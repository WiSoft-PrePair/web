import { motion } from 'motion/react'
import { type FormEvent, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { AuthShell, BrandLogo, KakaoButton, boxInput, tossButton } from '../components/auth'
import { ApiError, login, startKakaoLogin } from '../lib/api'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * 로그인: POST /api/auth/login → 성공하면 원래 가려던 곳(?next) 또는 /app. 카카오는 카카오 로그인 화면으로 보낸다.
 * 헤더 없이 흰 바탕 가운데 한 열: 로고 → 둥근 칸 이메일·비밀번호 → 로그인 → 가입·찾기(양 끝) → 빠른 회원가입/로그인(카카오). 회원가입은 /signup.
 */
export default function Login() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState<'login' | 'kakao' | null>(null)
  const [error, setError] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy('login')
    setError('')
    try {
      await login(email.trim(), password)
      const next = params.get('next')
      navigate(next?.startsWith('/app') ? next : '/app', { replace: true })
    } catch (err) {
      // 없는 이메일(404)과 틀린 비밀번호(401)를 같은 말로: 가입 여부가 드러나지 않게
      setError(err instanceof ApiError && (err.status === 401 || err.status === 404) ? '이메일 또는 비밀번호를 다시 확인해 주세요.' : err instanceof Error ? err.message : '로그인하지 못했어요.')
      setBusy(null)
    }
  }
  const onKakao = async () => {
    if (busy) return
    setBusy('kakao')
    setError('')
    try {
      await startKakaoLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : '카카오 로그인을 시작하지 못했어요.')
      setBusy(null)
    }
  }

  return (
    <AuthShell header={false}>
      {/* 로그인만 전체를 90% 크기로 (넓은 화면만. 모바일은 입력칸 글씨가 16px 아래로 내려가면 iOS가 확대하므로 그대로) */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }} className="sm:mx-auto sm:max-w-[400px] sm:[zoom:0.9]">
        <h1 className="flex justify-center">
          <BrandLogo size={34} />
        </h1>

        <form onSubmit={onSubmit} className="mt-10 space-y-3">
          <input aria-label="이메일" placeholder="이메일" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={boxInput} />
          <input
            aria-label="비밀번호"
            placeholder="비밀번호"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={boxInput}
          />
          {error && (
            <p role="alert" className="px-1 pt-1 text-[13px] text-[#f04452]">
              {error}
            </p>
          )}
          <div className="pt-3">
            <button type="submit" disabled={busy !== null} className={tossButton}>
              {busy === 'login' ? '로그인 중…' : '로그인'}
            </button>
          </div>
        </form>

        {/* 가입은 왼쪽, 찾기는 오른쪽 */}
        <div className="mt-4 flex items-center justify-between px-3 text-[14px] text-soft">
          <Link to="/signup" className="transition-colors hover:text-paper">
            이메일로 가입하기
          </Link>
          <Link to="/password-reset" className="transition-colors hover:text-paper">
            비밀번호 찾기
          </Link>
        </div>

        <div className="mt-14 mb-5 flex items-center gap-3 text-[13px] text-mute">
          <span className="h-px flex-1 bg-line" />
          빠른 회원가입/로그인
          <span className="h-px flex-1 bg-line" />
        </div>

        <KakaoButton onClick={onKakao} disabled={busy !== null}>
          {busy === 'kakao' ? '카카오로 이동 중…' : '카카오로 시작하기'}
        </KakaoButton>
      </motion.div>
    </AuthShell>
  )
}
