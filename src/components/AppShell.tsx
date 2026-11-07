import { AnimatePresence, motion } from 'motion/react'
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import logoMark from '../assets/brand/logo-mark.webp'
import { logout, useMember } from '../lib/api'
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
      // 지금 있는 메뉴(하위 페이지 포함)는 글자를 진하게 하고 알약 바탕을 계속 깔아 둔다
      <NavLink key={label} to={to} className={({ isActive }) => (isActive ? `${item} bg-tint/[0.06] text-paper` : item)}>
        {label}
      </NavLink>
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
          <Link to="/app" className="flex items-center gap-2 justify-self-start font-['Fredoka'] text-[21px] leading-6 font-semibold text-paper">
            <img src={logoMark} alt="" width={24} height={24} className="h-6 w-6" />
            PREPAIR
          </Link>
          {/* 가운데 메뉴 (좁은 화면에서는 아래 줄로) */}
          <nav aria-label="메뉴" className="hidden items-center gap-6 text-[14px] text-soft md:flex lg:gap-8">
            {menu}
          </nav>
          <div className="-mr-1.5 justify-self-end">
            <ProfileMenu onLogout={() => logout().then(() => navigate('/login', { replace: true }))} onWithdraw={() => soon('회원 탈퇴')} />
          </div>
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

/** 오른쪽 위 사람 아이콘: 누르면 아래로 작은 메뉴(내 정보 · 마이페이지 · 로그아웃 · 회원 탈퇴). 바깥을 누르거나 Esc로 닫힌다 */
function ProfileMenu({ onLogout, onWithdraw }: { onLogout: () => void; onWithdraw: () => void }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const member = useMember()
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  const row = 'flex w-full items-center rounded-lg px-3 py-2.5 text-left text-[14px] font-medium text-soft transition-colors hover:bg-tint/[0.05] hover:text-paper'

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label="내 메뉴"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`grid h-9 w-9 place-items-center rounded-full text-soft transition-colors hover:bg-tint/[0.06] hover:text-paper ${open ? 'bg-tint/[0.06] text-paper' : ''}`}
      >
        <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="8.5" r="3.5" />
          <path d="M5 19.5c1.2-3.4 3.9-5 7-5s5.8 1.6 7 5" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-56 rounded-2xl border border-line bg-card p-1.5 shadow-[0_12px_32px_-12px_rgba(16,24,40,0.25)]"
          >
            {/* 로그인할 때 받은 닉네임 · 이메일 (카카오 로그인은 이메일을 /api/auth/me로 채운다) */}
            <div className="px-3 pt-2 pb-2.5">
              <p className="text-[14px] font-semibold text-paper">{member?.nickname ?? '회원'}</p>
              {member?.email && <p className="mt-0.5 truncate text-[12px] text-mute">{member.email}</p>}
            </div>
            <div className="mx-1.5 mb-1 border-t border-line" />
            <Link role="menuitem" to="/app/me" onClick={() => setOpen(false)} className={row}>
              마이페이지
            </Link>
            <button role="menuitem" type="button" onClick={onLogout} className={row}>
              로그아웃
            </button>
            {/* 탈퇴는 구분선 아래 작고 옅게 (TODO: 탈퇴 확인 창 + member-service 탈퇴 API) */}
            <div className="mx-1.5 my-1 border-t border-line" />
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false)
                onWithdraw()
              }}
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-[13px] text-mute transition-colors hover:bg-tint/[0.05] hover:text-soft"
            >
              회원 탈퇴
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** 각 페이지 상단 제목 줄 */
export function PageTitle({ title, desc, right }: { title: string; desc?: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight text-paper">{title}</h1>
        {desc && <p className="mt-1.5 text-[14px] text-mute">{desc}</p>}
      </div>
      {right}
    </div>
  )
}
