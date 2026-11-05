import { motion } from 'motion/react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { AuthShell, KakaoButton, lineInput, primaryButtonClass } from '../components/auth'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * 로그인 (화면만, member-service api/auth 연동은 아직).
 * 가운데 한 열: 제목(로그인) → 이메일·비밀번호 → 보조 링크 → 카카오. 회원가입은 /signup.
 */
export default function Login() {
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    // TODO: POST /api/auth/login 연동
  }

  return (
    <AuthShell>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}>
        <h1 className="text-center text-[28px] font-semibold tracking-tight text-paper">로그인</h1>

        <form onSubmit={onSubmit} className="mt-9 space-y-5">
          <label className="block">
            <span className="block text-[13px] text-soft">이메일</span>
            <input aria-label="이메일" type="email" autoComplete="email" required className={lineInput} />
          </label>
          <label className="block">
            <span className="block text-[13px] text-soft">비밀번호</span>
            <input aria-label="비밀번호" type="password" autoComplete="current-password" required className={lineInput} />
          </label>
          <div className="pt-2">
            <button type="submit" className={primaryButtonClass}>
              로그인
            </button>
          </div>
        </form>

        <div className="mt-4 flex items-center justify-center gap-3 text-[13px] text-mute">
          <Link to="/signup" className="hover:text-paper">
            회원가입
          </Link>
          <span className="h-3 w-px bg-line" />
          <button type="button" className="hover:text-paper">
            비밀번호 찾기
          </button>
        </div>

        <div className="my-5 flex items-center gap-3 text-xs text-dim">
          <span className="h-px flex-1 bg-line/70" />
          또는
          <span className="h-px flex-1 bg-line/70" />
        </div>

        <KakaoButton>카카오로 로그인</KakaoButton>
      </motion.div>
    </AuthShell>
  )
}
