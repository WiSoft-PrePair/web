import { motion } from 'motion/react'
import { type FormEvent, type ReactNode, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthShell, BrandLogo, EyeToggle, bareInput, boxWrap, tossButton } from '../components/auth'
import { OtpInput } from '../components/OtpInput'
import { ApiError, login, resetPassword, sendResetCode } from '../lib/api'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * 비밀번호 찾기: 이메일 → 6자리 인증번호 → 새 비밀번호 → 바꾸고 바로 로그인.
 * 인증번호는 바꾸기 요청에 함께 보내 서버가 확인한다(미리 확인하면 코드가 소모돼 바꾸기가 실패하므로).
 */
export default function ResetPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState<'send' | 'submit' | null>(null)
  const [error, setError] = useState('')

  const emailValid = /^\S+@\S+\.\S+$/.test(email)
  const canSubmit = sent && code.length === 6 && password.length >= 8

  const sendCode = async () => {
    setBusy('send')
    setError('')
    try {
      await sendResetCode(email.trim())
      setSent(true)
      setCode('')
    } catch (err) {
      setError(err instanceof ApiError && err.status === 404 ? '가입된 이메일이 아니에요. 이메일을 다시 확인해 주세요.' : errorText(err, '인증번호를 보내지 못했어요.'))
    } finally {
      setBusy(null)
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit || busy) return
    setBusy('submit')
    setError('')
    try {
      await resetPassword(email.trim(), code, password)
      await login(email.trim(), password)
      navigate('/app', { replace: true })
    } catch (err) {
      // 코드가 틀렸거나 5분이 지났으면 다시 받게 한다
      if (err instanceof ApiError && err.code === 'INVALID_VERIFICATION_CODE') {
        setCode('')
        setError('인증번호가 맞지 않거나 시간이 지났어요. 다시 받아 주세요.')
      } else setError(errorText(err, '비밀번호를 바꾸지 못했어요.'))
      setBusy(null)
    }
  }

  return (
    <AuthShell header={false} align="top">
      <div className="sm:mx-auto sm:max-w-[400px] sm:[zoom:0.9]">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}>
          {/* 맨 위 줄: 회원가입과 같은 모양 (왼쪽 로그인으로, 가운데 작은 로고) */}
          <div className="relative flex h-9 items-center justify-center">
            <Link
              to="/login"
              aria-label="로그인으로 돌아가기"
              className="absolute left-0 -ml-2 grid h-9 w-9 place-items-center rounded-full text-soft transition-colors hover:bg-tint/[0.06] hover:text-paper"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </Link>
            <BrandLogo size={17} />
          </div>

          <h1 className="mt-8 text-[24px] leading-snug font-semibold tracking-tight text-paper">비밀번호를 잊으셨나요?</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-mute">가입한 이메일로 인증번호를 보내 드릴게요.</p>

          <form onSubmit={onSubmit} className="mt-10 space-y-6">
            <Field label="이메일">
              <div className={boxWrap}>
                <input
                  aria-label="이메일"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setSent(false)
                    setError('')
                  }}
                  className={bareInput}
                />
                <button
                  type="button"
                  disabled={!emailValid || busy === 'send'}
                  onClick={sendCode}
                  className="shrink-0 text-sm font-semibold text-paper transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:text-dim disabled:hover:opacity-100"
                >
                  {busy === 'send' ? '보내는 중…' : sent ? '다시 받기' : '인증하기'}
                </button>
              </div>
            </Field>

            {sent && (
              <>
                <Field label="인증번호" appear>
                  <OtpInput value={code} onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} />
                </Field>
                <Field label="새 비밀번호" appear>
                  <div className={boxWrap}>
                    <input
                      aria-label="새 비밀번호"
                      placeholder="8자 이상"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={bareInput}
                    />
                    <EyeToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                  </div>
                </Field>
              </>
            )}

            {error && (
              <p role="alert" className="-mt-3 px-1 text-[13px] text-[#f04452]">
                {error}
              </p>
            )}

            <div className="pt-3">
              <button type="submit" disabled={!canSubmit || busy === 'submit'} className={tossButton}>
                {busy === 'submit' ? '바꾸는 중…' : '비밀번호 바꾸고 로그인'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AuthShell>
  )
}

function Field({ label, appear = false, children }: { label: string; appear?: boolean; children: ReactNode }) {
  return (
    <motion.div initial={appear ? { opacity: 0, y: -6 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}>
      <span className="block pl-1 text-[13px] font-medium text-soft">{label}</span>
      <div className="mt-2">{children}</div>
    </motion.div>
  )
}

const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback)
