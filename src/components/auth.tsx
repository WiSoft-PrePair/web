import type { ReactNode } from 'react'
import { Link } from 'react-router'
import logoMark from '../assets/brand/logo-mark.png'
import { Panel, ThemeRoot } from './AppShell'

/** 로그인·회원가입 공통 틀: 로고만 있는 헤더(랜딩과 같은 위치) + 가운데 한 열 */
/**
 * align='top': 입력 중에 칸이 늘어나는 화면(회원가입)은 윗부분 위치를 고정해서 전체가 들썩이지 않게 한다.
 * 고정 높이는 가운데보다 조금 위(화면 중앙에서 300px 위, 최소 84px)로 잡았다.
 */
export function AuthShell({ children, top, align = 'center', header = true }: { children: ReactNode; top?: ReactNode; align?: 'center' | 'top'; header?: boolean }) {
  return (
    <ThemeRoot>
      <div className="relative mx-auto flow-root min-h-svh max-w-[1680px] text-paper [--side:var(--gutter)] lg:[--side:clamp(40px,6.25vw,120px)]">
        {header && (
          <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-[var(--side)] h-[60px]">
            <Link to="/" className="font-display text-base font-semibold tracking-tight">
              PREPAIR<span className="text-lime">.</span>
            </Link>
            {top}
          </header>
        )}
        {header ? (
          <Panel>
            {/* 라이트에서는 판 안에 들어가므로 판 높이에 맞추고 위 여백을 헤더 높이만큼 줄인다 */}
            <main
              className={`flex min-h-svh justify-center px-[var(--side)] in-data-[theme=light]:min-h-[calc(100svh-60px)] ${
                align === 'top' ? 'items-start pt-[max(84px,calc(50svh-300px))] pb-10 in-data-[theme=light]:pt-[max(20px,calc(50svh-360px))]' : 'items-center py-24 in-data-[theme=light]:py-12'
              }`}
            >
              <div className="w-full max-w-[400px]">{children}</div>
            </main>
          </Panel>
        ) : (
          /* 헤더 없는 화면(로그인): 판 없이 흰 바탕 가운데에 한 열 */
          <main className={`flex min-h-svh justify-center px-[var(--side)] ${align === 'top' ? 'items-start pt-[max(48px,calc(50svh-320px))] pb-10' : 'items-center py-12'}`}>
            <div className="w-full max-w-[400px]">{children}</div>
          </main>
        )}
      </div>
    </ThemeRoot>
  )
}

/**
 * 로고: 마크 + PREPAIR(Fredoka). size = 글씨 크기(px), 마크는 글씨보다 조금 크게.
 * 마크가 왼쪽 아래로 무거워 가운데에 두면 살짝 왼쪽으로 보여서, 글씨 크기의 5%(최소 1px)만큼 오른쪽으로 옮긴다 (가운데 정렬이 아닌 곳은 nudge={false})
 */
export function BrandLogo({ size = 20, className = '', nudge = true }: { size?: number; className?: string; nudge?: boolean }) {
  const mark = Math.round(size * 1.15)
  return (
    <span
      className={`inline-flex items-center font-['Fredoka'] leading-none font-semibold text-paper ${className}`}
      style={{ fontSize: size, gap: Math.round(size * 0.4), transform: nudge ? `translateX(${Math.max(1, Math.round(size * 0.05))}px)` : undefined }}
    >
      <img src={logoMark} alt="" width={mark} height={mark} style={{ width: mark, height: mark }} />
      PREPAIR
    </span>
  )
}

export function KakaoButton({ children }: { children: ReactNode }) {
  return (
    <button type="button" className="flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-[#FEE500] text-[16px] font-semibold text-[#191919] transition-opacity hover:opacity-90">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#191919" aria-hidden>
        <path d="M12 3C6.48 3 2 6.58 2 11c0 2.85 1.86 5.35 4.66 6.77l-.95 3.5c-.08.3.26.54.52.37l4.17-2.77c.53.07 1.06.13 1.6.13 5.52 0 10-3.58 10-8S17.52 3 12 3Z" />
      </svg>
      {children}
    </button>
  )
}

/** 밑줄형 입력칸 (로그인·회원가입 공통). bareInput은 밑줄을 바깥 줄이 그릴 때 */
export const bareInput = 'w-full bg-transparent px-0 py-2.5 text-[16px] text-paper outline-none placeholder:text-dim'
/** 둥근 칸 입력 (로그인) */
export const boxInput = 'w-full h-[54px] rounded-2xl border border-line bg-card px-5 text-[16px] text-paper outline-none transition-colors placeholder:text-mute focus:border-dim'
/** 둥근 칸 안에 입력 + 오른쪽 버튼(인증하기·눈 아이콘)을 함께 넣을 때의 바깥 칸 */
export const boxWrap = 'flex h-[54px] items-center gap-3 rounded-2xl border border-line bg-card px-5 transition-colors focus-within:border-dim'
/** 로그인·회원가입 주요 버튼 (토스 파랑) */
export const tossButton =
  'h-[54px] w-full rounded-2xl bg-toss text-[16px] font-semibold text-white transition-colors hover:bg-toss-hover disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-toss'
export const lineInput = `${bareInput} border-b border-line transition-colors focus:border-paper`

export const primaryButtonClass = 'w-full rounded-xl bg-cta py-3 text-sm font-semibold text-white transition-colors hover:bg-cta-hover disabled:cursor-not-allowed disabled:opacity-30'

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
