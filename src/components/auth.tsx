import type { ReactNode } from 'react'
import { Link } from 'react-router'

/** 로그인·회원가입 공통 틀: 로고만 있는 헤더(랜딩과 같은 위치) + 가운데 한 열 */
/**
 * align='top': 입력 중에 칸이 늘어나는 화면(회원가입)은 윗부분 위치를 고정해서 전체가 들썩이지 않게 한다.
 * 고정 높이는 가운데보다 조금 위(화면 중앙에서 300px 위, 최소 84px)로 잡았다.
 */
export function AuthShell({ children, top, align = 'center' }: { children: ReactNode; top?: ReactNode; align?: 'center' | 'top' }) {
  return (
    <div className="relative mx-auto min-h-svh max-w-[1680px] text-paper [--side:var(--gutter)] lg:[--side:clamp(40px,6.25vw,120px)]">
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-[var(--side)] py-5 xl:py-[30px]">
        <Link to="/" className="font-display text-base font-semibold tracking-tight">
          PREPAIR<span className="text-lime">.</span>
        </Link>
        {top}
      </header>
      <main className={`flex min-h-svh justify-center px-[var(--side)] ${align === 'top' ? 'items-start pt-[max(84px,calc(50svh-300px))] pb-10' : 'items-center py-24'}`}>
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  )
}

export function KakaoButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3 text-sm font-semibold text-[#191919] transition-opacity hover:opacity-90"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#191919" aria-hidden>
        <path d="M12 3C6.48 3 2 6.58 2 11c0 2.85 1.86 5.35 4.66 6.77l-.95 3.5c-.08.3.26.54.52.37l4.17-2.77c.53.07 1.06.13 1.6.13 5.52 0 10-3.58 10-8S17.52 3 12 3Z" />
      </svg>
      {children}
    </button>
  )
}

/** 밑줄형 입력칸 (로그인·회원가입 공통). bareInput은 밑줄을 바깥 줄이 그릴 때 */
export const bareInput = 'w-full bg-transparent px-0 py-2.5 text-[16px] text-paper outline-none placeholder:text-dim'
export const lineInput = `${bareInput} border-b border-line transition-colors focus:border-paper`

export const primaryButtonClass =
  'w-full rounded-xl bg-paper py-3 text-sm font-semibold text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30'

/** 비밀번호 보기/숨기기 눈 아이콘 */
export function EyeToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? '비밀번호 숨기기' : '비밀번호 보기'}
      aria-pressed={shown}
      className="h-8 shrink-0 px-1 text-[13px] whitespace-nowrap text-mute transition-colors hover:text-paper"
    >
      {shown ? '숨기기' : '보기'}
    </button>
  )
}
