import { AnimatePresence, motion } from 'motion/react'
import { type FormEvent, type ReactNode, useState } from 'react'
import { useNavigate } from 'react-router'
import { BottomSheet } from '../components/BottomSheet'
import { OtpInput } from '../components/OtpInput'
import { Welcome } from '../components/Welcome'
import { Consents } from '../components/Consents'
import { useConsents } from '../components/useConsents'
import { ChoiceCards } from '../components/prefs'
import { CHANNELS, type Channel, FREQUENCY } from '../components/prefsOptions'
import { AuthShell, BrandLogo, EyeToggle, bareInput, boxInput, boxWrap, tossButton } from '../components/auth'
import { ApiError, type Frequency, login, type Notification, register, sendSignupCode, verifySignupCode } from '../lib/api'

const EASE = [0.22, 1, 0.36, 1] as const
/** 단계 내용 넘김: 앞으로 가면 오른쪽에서 들어와 왼쪽으로, 뒤로 가면 반대 */
const SLIDE = {
  enter: (d: number) => ({ opacity: 0, x: d * 28 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d * -28 }),
}

/**
 * 회원가입: 2단계 (1. 계정: 이메일 인증·비밀번호·닉네임 / 2. 질문 설정: 희망 직무·받는 곳·주기) → 가입 뒤 바로 로그인 → 완료.
 * 필드는 member-service 가입 API와 같다:
 *   POST /api/members/email (purpose REGISTER) → POST /api/members/email-verify
 *   → POST /api/members/register { email, password(8+), nickname, job, notification(email|kakao|both), frequency(every|weekly) }
 * 카카오는 로그인 화면에만 둔다. 신규 카카오 사용자는 OAuth 콜백 후 '질문 설정' 값만 추가로 받는다 (POST /api/auth/kakao/register).
 */


type Verify = 'idle' | 'sent' | 'verified'

export default function Signup() {
  const navigate = useNavigate()
  // 1: 계정 → 2: 질문 설정 → 완료(done)
  const [step, setStep] = useState<1 | 2 | 'done'>(1)
  const [showPassword, setShowPassword] = useState(false)

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [verify, setVerify] = useState<Verify>('idle')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [job, setJob] = useState('')
  const [channels, setChannels] = useState<Channel[]>([])
  // 서버 값으로: 둘 다 고르면 both
  const notification = channels.length === 2 ? 'both' : channels[0]
  const [frequency, setFrequency] = useState<string>()
  // 서버 요청 중 표시와 오류 문구 (이메일·인증번호 칸 아래, 가입 버튼 아래)
  const [busy, setBusy] = useState<'send' | 'verify' | 'submit' | null>(null)
  const [emailError, setEmailError] = useState('')
  const [submitError, setSubmitError] = useState('')

  // 단계 이동 방향(앞으로 1, 뒤로 -1): 내용이 그 방향으로 밀려 나가고 들어온다
  const [dir, setDir] = useState(1)
  const go = (n: 1 | 2) => {
    setDir(typeof step !== 'number' || n > step ? 1 : -1)
    setStep(n)
  }

  const emailValid = /^\S+@\S+\.\S+$/.test(email)
  const accountValid = verify === 'verified' && password.length >= 8 && !!nickname.trim()
  const consents = useConsents()
  const canSubmit = accountValid && job.trim() && notification && frequency
  // 이메일을 서버로 보내기 전에(첫 '인증하기') 약관 동의를 바텀시트로 받는다
  const [consentOpen, setConsentOpen] = useState(false)

  const sendCode = async () => {
    setBusy('send')
    setEmailError('')
    try {
      await sendSignupCode(email.trim())
      setVerify('sent')
      setCode('')
    } catch (err) {
      setEmailError(err instanceof ApiError && err.code === 'EMAIL_ALREADY_EXISTS' ? '이미 가입된 이메일이에요. 로그인해 주세요.' : errorText(err, '인증번호를 보내지 못했어요.'))
    } finally {
      setBusy(null)
    }
  }
  // 6자리를 다 입력하면 자동으로 확인한다
  const onCodeChange = async (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 6)
    setCode(digits)
    setEmailError('')
    if (digits.length !== 6 || busy) return
    setBusy('verify')
    try {
      await verifySignupCode(email.trim(), digits)
      setVerify('verified')
    } catch (err) {
      setEmailError(err instanceof ApiError && err.code === 'INVALID_VERIFICATION_CODE' ? '인증번호가 맞지 않거나 시간이 지났어요.' : errorText(err, '인증번호를 확인하지 못했어요.'))
      setCode('')
    } finally {
      setBusy(null)
    }
  }
  const onNext = (e: FormEvent) => {
    e.preventDefault()
    if (accountValid) go(2)
  }
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit || busy) return
    setBusy('submit')
    setSubmitError('')
    try {
      await register({ email: email.trim(), password, nickname: nickname.trim(), job: job.trim(), notification: notification as Notification, frequency: frequency as Frequency })
      await login(email.trim(), password)
      // 완료 화면: 체크 → 인사 → 설정 요약 → 버튼으로 메인 (자동으로 넘기지 않는다)
      setStep('done')
    } catch (err) {
      // 인증은 5분만 유효하다. 지나면 1단계로 돌려 다시 인증받는다
      if (err instanceof ApiError && err.status === 401) {
        setVerify('idle')
        setCode('')
        setEmailError('인증 시간이 지났어요. 이메일을 다시 인증해 주세요.')
        go(1)
      } else setSubmitError(errorText(err, '가입하지 못했어요.'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <AuthShell header={false} align={typeof step === 'number' ? 'top' : 'center'}>
      {/* 로그인처럼 전체를 90% 크기로 (넓은 화면만. 모바일은 입력칸 글씨가 16px 아래로 내려가면 iOS가 확대하므로 그대로) */}
      <div className="sm:mx-auto sm:max-w-[400px] sm:[zoom:0.9]">
      <AnimatePresence mode="wait">
        {typeof step === 'number' ? (
          <motion.div key="steps" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: EASE }}>
            {/* 단계 막대는 그대로 두고(채움·제목만 바뀜), 아래 내용만 옆으로 넘긴다 */}
            <Stepper
              step={step}
              canGoNext={accountValid}
              onGo={go}
              onBack={step === 1 ? () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/')) : () => go(1)}
            />
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              {step === 1 ? (
          <motion.div key="form" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28, ease: EASE }}>
            <h1 className="sr-only">회원가입 · 계정</h1>

            <form onSubmit={onNext} className="mt-10 space-y-6">
              <Field label="이메일">
                <div className={boxWrap}>
                  <input
                    aria-label="이메일"
                    type="email"
                    autoComplete="email"
                    value={email}
                    readOnly={verify === 'verified'}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (verify !== 'idle') setVerify('idle')
                    }}
                    className={`${bareInput} read-only:text-soft`}
                  />
                  {verify === 'verified' ? (
                    <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-toss">
                      <Check className="h-3.5 w-3.5" /> 인증됨
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={!emailValid || busy === 'send'}
                      onClick={() => (consents.requiredOk ? sendCode() : setConsentOpen(true))}
                      className="shrink-0 text-sm font-semibold text-paper transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:text-dim disabled:hover:opacity-100"
                    >
                      {busy === 'send' ? '보내는 중…' : verify === 'sent' ? '다시 받기' : '인증하기'}
                    </button>
                  )}
                </div>
              </Field>

              <AnimatePresence initial={false}>
                {verify === 'sent' && (
                  <Field key="code" label="인증번호" appear>
                    <OtpInput value={code} onChange={onCodeChange} />
                  </Field>
                )}
              </AnimatePresence>
              {emailError && (
                <p role="alert" className="-mt-3 px-1 text-[13px] text-[#f04452]">
                  {emailError}
                </p>
              )}

              <Field label="비밀번호">
                <div className={boxWrap}>
                  <input
                    aria-label="비밀번호"
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

              <Field label="닉네임">
                <input aria-label="닉네임" placeholder="어떻게 불러 드릴까요?" autoComplete="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} className={boxInput} />
              </Field>

              <div className="pt-3">
                <button type="submit" disabled={!accountValid} className={tossButton}>
                  다음
                </button>
              </div>
            </form>
          </motion.div>
              ) : (
          <motion.div key="settings" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28, ease: EASE }}>
            <h1 className="sr-only">회원가입 · 질문 설정</h1>

            <form onSubmit={onSubmit} className="mt-10 space-y-6">
              <Field label="희망 직무" hint="자유롭게 적을수록 질문이 더 잘 맞춰져요.">
                <textarea
                  aria-label="희망 직무"
                  rows={1}
                  placeholder="예: 대용량 트래픽을 다루는 백엔드 개발자"
                  value={job}
                  onChange={(e) => {
                    setJob(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = `${e.target.scrollHeight}px`
                  }}
                  className={`${boxInput} block h-auto min-h-[54px] resize-none overflow-hidden py-[14px] leading-[24px]`}
                />
              </Field>

              <Field label="알림 채널" hint="둘 다 선택할 수 있어요.">
                <ChoiceCards
                  multiple
                  options={CHANNELS}
                  isOn={(v) => channels.includes(v as Channel)}
                  onPick={(v) => setChannels((cs) => (cs.includes(v as Channel) ? cs.filter((c) => c !== v) : [...cs, v as Channel]))}
                />
              </Field>

              <Field label="알림 주기">
                <ChoiceCards options={FREQUENCY} isOn={(v) => frequency === v} onPick={setFrequency} />
              </Field>

              <div className="pt-3">
                <button type="submit" disabled={!canSubmit || busy === 'submit'} className={tossButton}>
                  {busy === 'submit' ? '가입하는 중…' : '가입하기'}
                </button>
                {submitError && (
                  <p role="alert" className="mt-3 text-center text-[13px] text-[#f04452]">
                    {submitError}
                  </p>
                )}
              </div>
            </form>
          </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <Welcome key="welcome" nickname={nickname} job={job} frequency={frequency} notification={notification} onStart={() => navigate('/app', { replace: true })} />
        )}
      </AnimatePresence>
      </div>

      <BottomSheet open={consentOpen} title="약관에 동의해 주세요" desc="인증번호를 보내기 전에 확인해 주세요." onClose={() => setConsentOpen(false)}>
        <Consents checked={consents.checked} setChecked={consents.setChecked} />
        <button
          type="button"
          disabled={!consents.requiredOk}
          onClick={() => {
            setConsentOpen(false)
            sendCode()
          }}
          className={`mt-5 ${tossButton}`}
        >
          동의하고 인증번호 받기
        </button>
      </BottomSheet>
    </AuthShell>
  )
}

/** 단계 표시: 폼 폭만큼의 얇은 막대 두 칸. 지금 단계까지 흰색으로 채워진다. 막대를 눌러 이동(2단계는 계정 정보를 다 채운 뒤에만) */
function Stepper({ step, canGoNext, onGo, onBack }: { step: 1 | 2; canGoNext: boolean; onGo: (s: 1 | 2) => void; onBack: () => void }) {
  const steps = [
    { n: 1 as const, label: '1단계: 계정' },
    { n: 2 as const, label: '2단계: 질문 설정' },
  ]
  return (
    <div>
      {/* 맨 위 줄: 왼쪽 이전, 가운데 작은 로고 (작성 중 실수로 나가지 않게 로고엔 링크를 걸지 않는다) */}
      <div className="relative mb-4 flex h-9 items-center justify-center">
        <button
          type="button"
          onClick={onBack}
          aria-label="이전"
          className="absolute left-0 -ml-2 grid h-9 w-9 place-items-center rounded-full text-soft transition-colors hover:bg-tint/[0.06] hover:text-paper"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <BrandLogo size={17} />
      </div>
      <div className="mb-1 flex items-baseline justify-between">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={step}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="text-[15px] font-medium text-paper"
          >
            {step === 1 ? '계정 만들기' : '질문 설정'}
          </motion.span>
        </AnimatePresence>
        <span className="text-sm text-mute">
          <span className="text-paper">{step}</span> / 2
        </span>
      </div>
    <nav aria-label="가입 단계" className="flex gap-2">
      {steps.map(({ n, label }) => {
        const filled = step >= n
        const enabled = n === 1 || canGoNext
        return (
          <button
            key={n}
            type="button"
            aria-label={label}
            aria-current={step === n ? 'step' : undefined}
            disabled={!enabled || step === n}
            onClick={() => onGo(n)}
            className="group flex-1 py-2 disabled:cursor-default"
          >
            <span className="relative block h-[3px] overflow-hidden rounded-full bg-tint/[0.08]">
              <motion.span
                className="absolute inset-0 origin-left rounded-full bg-toss"
                initial={false}
                animate={{ scaleX: filled ? 1 : 0 }}
                transition={{ duration: 0.45, ease: EASE }}
              />
            </span>
          </button>
        )
      })}
    </nav>
    </div>
  )
}

/** 박스 대신 밑줄 하나만 있는 입력칸 */

function Field({ label, hint, hintTone, appear = false, children }: { label: string; hint?: string; hintTone?: 'lime'; appear?: boolean; children: ReactNode }) {
  return (
    <motion.div
      layout="position"
      transition={{ duration: 0.35, ease: EASE }}
      initial={appear ? { opacity: 0, y: -6 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, transition: { duration: 0.2 } }}
    >
      <span className="block pl-1 text-[13px] font-medium text-soft">{label}</span>
      <div className="mt-2">{children}</div>
      {hint && <span className={`mt-2.5 block pl-1 text-xs ${hintTone === 'lime' ? 'text-paper' : 'text-mute'}`}>{hint}</span>}
    </motion.div>
  )
}


const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback)

function Check({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}
