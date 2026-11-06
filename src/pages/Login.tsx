import { motion } from 'motion/react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { AuthShell, BrandLogo, KakaoButton, boxInput, tossButton } from '../components/auth'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * 로그인 (화면만, member-service api/auth 연동은 아직).
 * 헤더 없이 흰 바탕 가운데 한 열: 로고 → 둥근 칸 이메일·비밀번호 → 로그인 → 가입·찾기(양 끝) → 빠른 회원가입/로그인(카카오). 회원가입은 /signup.
 */
export default function Login() {
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    // TODO: POST /api/auth/login 연동
  }

  return (
    <AuthShell header={false}>
      {/* 로그인만 전체를 90% 크기로 (넓은 화면만. 모바일은 입력칸 글씨가 16px 아래로 내려가면 iOS가 확대하므로 그대로) */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }} className="sm:mx-auto sm:max-w-[400px] sm:[zoom:0.9]">
        <h1 className="flex justify-center">
          <BrandLogo size={34} />
        </h1>

        <form onSubmit={onSubmit} className="mt-10 space-y-3">
          <input aria-label="이메일" placeholder="이메일" type="email" autoComplete="email" required className={boxInput} />
          <input aria-label="비밀번호" placeholder="비밀번호" type="password" autoComplete="current-password" required className={boxInput} />
          <div className="pt-3">
            <button type="submit" className={tossButton}>
              로그인
            </button>
          </div>
        </form>

        {/* 가입은 왼쪽, 찾기는 오른쪽 */}
        <div className="mt-4 flex items-center justify-between px-3 text-[14px] text-soft">
          <Link to="/signup" className="transition-colors hover:text-paper">
            이메일로 가입하기
          </Link>
          <button type="button" className="transition-colors hover:text-paper">
            비밀번호 찾기
          </button>
        </div>

        <div className="mt-14 mb-5 flex items-center gap-3 text-[13px] text-mute">
          <span className="h-px flex-1 bg-line" />
          빠른 회원가입/로그인
          <span className="h-px flex-1 bg-line" />
        </div>

        <KakaoButton>카카오로 시작하기</KakaoButton>
      </motion.div>
    </AuthShell>
  )
}
