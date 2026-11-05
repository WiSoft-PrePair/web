import { type CSSProperties, type ReactNode, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { BG, cursorFor, onAccent, readableOn, useAppearance } from './appearance'

/** 로그인 후 화면 공통 틀: 고정 헤더 + 가운데 본문 */
/**
 * 로그인 후 화면의 가장 바깥: 화면 모드(data-theme)와 대표색을 정한다.
 * --color-lime = 글자용(배경에서 읽히게 보정), --color-grass = 잔디·커서·알약 배경용(고른 색 그대로)
 */
export function ThemeRoot({ className = '', children }: { className?: string; children: ReactNode }) {
  const { mode, accent } = useAppearance()
  const strong = readableOn(accent, BG[mode])
  const large = readableOn(accent, BG[mode], 3)
  // 스크롤 끝에서 튕길 때 보이는 바깥 배경도 같은 색으로
  useEffect(() => {
    const html = document.documentElement
    html.style.backgroundColor = BG[mode]
    return () => {
      html.style.backgroundColor = ''
    }
  }, [mode])
  // 글씨가 아닌 곳(커서, 알약 배경)은 고른 색 그대로, 그 위 글자는 --accent-on
  const vars = { '--color-lime': strong, '--color-grass': accent, '--color-accent-lg': large, '--accent-on': onAccent(accent), '--app-cursor': cursorFor(accent) } as CSSProperties
  return (
    <div data-theme={mode} style={vars} className={`bg-ink ${className}`}>
      {children}
    </div>
  )
}

export function AppShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <ThemeRoot className="min-h-svh text-soft [--side:var(--gutter)] lg:[--side:clamp(40px,6.25vw,120px)]">
      <AppHeader />
      <main className={`mx-auto px-[var(--side)] pt-24 pb-12 xl:pt-28 ${wide ? 'max-w-[1680px]' : 'max-w-[960px]'}`}>{children}</main>
    </ThemeRoot>
  )
}

export function AppHeader() {
  const navigate = useNavigate()
  return (
    <header className="fixed inset-x-0 top-0 z-10 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1680px] items-center justify-between px-[var(--side)] py-5 xl:py-[30px]">
        <Link to="/app" className="font-display text-base font-semibold tracking-tight">
          PREPAIR<span className="text-lime">.</span>
        </Link>
        <nav className="flex items-center gap-5 text-[13px] text-mute">
          <Link to="/app/me" className="transition-colors hover:text-paper">
            마이페이지
          </Link>
          {/* TODO: POST /api/auth/logout 연동 */}
          <button type="button" onClick={() => navigate('/login')} className="transition-colors hover:text-paper">
            로그아웃
          </button>
        </nav>
      </div>
    </header>
  )
}

/** 각 페이지 상단 제목 줄 */
export function PageTitle({ eyebrow, title, right }: { eyebrow: string; title: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="font-display text-[12px] font-medium tracking-[0.08em] text-lime">{eyebrow}</p>
        <h1 className="mt-2 text-[24px] font-semibold tracking-tight">{title}</h1>
      </div>
      {right}
    </div>
  )
}
