import { AnimatePresence, motion } from 'motion/react'
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { BG, onAccent, readableOn, useAppearance } from './appearance'

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
  const vars = { '--color-lime': strong, '--color-grass': accent, '--color-accent-lg': large, '--accent-on': onAccent(accent) } as CSSProperties
  return (
    <div data-theme={mode} style={vars} className={`overflow-x-clip bg-ink ${className}`}>
      {children}
    </div>
  )
}

export function AppShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <ThemeRoot className="min-h-svh text-soft [--side:var(--gutter)] lg:[--side:clamp(40px,6.25vw,120px)]">
      <AppHeader />
      <Panel>
        <main className={`mx-auto px-[var(--side)] pt-24 pb-12 xl:pt-28 in-data-[theme=light]:pt-12 xl:in-data-[theme=light]:pt-14 ${wide ? 'max-w-[1680px]' : 'max-w-[960px]'}`}>{children}</main>
      </Panel>
    </ThemeRoot>
  )
}

/** 본문 판: 라이트에서는 헤더 아래 둥근 큰 판(index.css .app-panel), 다크에서는 아무 효과 없음 */
export function Panel({ children }: { children: ReactNode }) {
  return <div className="app-panel">{children}</div>
}

/** 헤더 메뉴. to가 없는 것은 아직 없는 기능이라 누르면 '준비 중' 안내만 뜬다 */
const MENU: { label: string; to?: string }[] = [
  { label: '텍스트 면접', to: '/app/answer' },
  { label: '화상 면접', to: '/app/interview' },
  { label: '맞춤 면접' },
  { label: '공고 관리' },
  { label: '리워드 샵' },
]

export function AppHeader() {
  const navigate = useNavigate()
  const [notice, setNotice] = useState('')
  const timer = useRef(0)
  const soon = (label: string) => {
    window.clearTimeout(timer.current)
    setNotice(`${label}, 준비 중이에요`)
    timer.current = window.setTimeout(() => setNotice(''), 1800)
  }
  // 맨 위에서는 헤더가 바탕과 하나로 보이고, 내리면 반투명 바탕 + 아래 구분선으로 본문과 갈라진다
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  // 커서를 올리면 글자 뒤에 옅은 알약 바탕이 깔리고 글자가 진해진다 (누를 수 있는 범위가 눈에 보이게)
  const item = 'shrink-0 rounded-full px-3 py-1.5 font-semibold transition-colors duration-200 hover:bg-tint/[0.06] hover:text-paper active:bg-tint/[0.1]'
  const menu = MENU.map(({ label, to }) =>
    to ? (
      <Link key={label} to={to} className={item}>
        {label}
      </Link>
    ) : (
      <button key={label} type="button" onClick={() => soon(label)} className={item}>
        {label}
      </button>
    ),
  )

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-10 border-b transition-colors duration-200 ${scrolled ? 'border-line bg-ink/70 backdrop-blur-md' : 'border-transparent bg-ink'}`}
      >
        <div className="mx-auto grid max-w-[1680px] grid-cols-[1fr_auto] items-center h-[60px] px-[var(--side)] md:grid-cols-[1fr_auto_1fr]">
          <Link to="/app" className="justify-self-start font-display text-[20px] leading-6 font-semibold tracking-tight">
            PREPAIR
          </Link>
          {/* 가운데 메뉴 (좁은 화면에서는 아래 줄로) */}
          <nav aria-label="메뉴" className="hidden items-center gap-6 text-[14px] text-soft md:flex lg:gap-8">
            {menu}
          </nav>
          <nav className="-mr-3 flex items-center gap-2 justify-self-end text-[14px] text-soft max-md:gap-0">
            <Link to="/app/me" className={item}>
              마이페이지
            </Link>
            {/* TODO: POST /api/auth/logout 연동 */}
            <button type="button" onClick={() => navigate('/login')} className={item}>
              로그아웃
            </button>
          </nav>
        </div>
        <nav aria-label="메뉴" className="flex gap-2 overflow-x-auto px-[calc(var(--side)-12px)] pb-1.5 text-[14px] text-soft [scrollbar-width:none] md:hidden">
          {menu}
        </nav>
      </header>
      {/* 준비 중 안내 (헤더의 흐림 효과 안에 두면 위치가 헤더 기준이 되어 밖에 둔다): 화면 아래 가운데에 잠깐 떴다 사라진다 */}
      <AnimatePresence>
        {notice && (
          <motion.p
            role="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-8 left-1/2 z-30 -translate-x-1/2 rounded-full border border-line bg-card px-4 py-2 text-[13px] text-paper shadow-[0_10px_30px_-8px_rgba(0,0,0,0.35)]"
          >
            {notice}
          </motion.p>
        )}
      </AnimatePresence>
    </>
  )
}

/** 각 페이지 상단 제목 줄 */
export function PageTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight text-paper">{title}</h1>
      </div>
      {right}
    </div>
  )
}
