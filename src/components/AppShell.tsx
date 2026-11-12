import { AnimatePresence, motion } from 'motion/react'
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
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
  // 프로필 아이콘과 같은 방식: 바탕 없이 글자만 중간 회색(mute) → 올리면 진하게(paper). 키보드 이동 때만 포커스 테두리

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-10 border-b transition-colors duration-200 ${scrolled ? 'border-line bg-ink/70 backdrop-blur-md' : 'border-transparent bg-ink'}`}
      >
        <div className="mx-auto flex max-w-[1680px] items-center justify-between h-[60px] px-[var(--side)]">
          <Link to="/app" className="flex items-center gap-2 justify-self-start font-['Fredoka'] text-[21px] leading-6 font-semibold text-paper">
            <img src={logoMark} alt="" width={24} height={24} className="h-6 w-6" />
            PREPAIR
          </Link>
          {/* 오른쪽: 리워드 샵(준비 중) · 내 메뉴. 면접은 홈 아래 바에서 시작한다 */}
          <div className="-mr-1.5 flex items-center gap-3">
            <IconButton label="리워드 샵" onClick={() => soon('리워드 샵')}>
              {/* 선물 상자 */}
              <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3.5" y="8" width="17" height="4" rx="1" />
                <path d="M5 12v7.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V12M12 8v12.5M12 8S10.6 4 8.2 4a2 2 0 0 0 0 4M12 8s1.4-4 3.8-4a2 2 0 0 1 0 4" />
              </svg>
            </IconButton>
            <ProfileMenu onLogout={() => logout().then(() => navigate('/login', { replace: true }))} onWithdraw={() => soon('회원 탈퇴')} />
          </div>
        </div>
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

/** 헤더 오른쪽 아이콘 버튼: 바탕 없이 아이콘 색만 tint 70% → 올리면 진하게 (프로필 아이콘과 같은 방식) */
function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-full text-tint/70 outline-none transition-colors hover:text-paper focus-visible:ring-2 focus-visible:ring-toss/40"
    >
      {children}
    </button>
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
  // 항목은 왼쪽 정렬(위 닉네임과 같은 줄). 올리면 바탕은 그대로, 글자만 진해진다
  const row = 'block w-full px-4 py-2.5 text-left text-[13px] font-medium text-soft transition-colors hover:text-paper'

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label="내 메뉴"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        // 바탕 없이 아이콘 색만 진해진다: 평소 tint 70%(mute는 너무 옅고 soft는 paper와 너무 가까워 hover 차이가 안 보였다) → 올리거나 열면 진하게(paper). 키보드 이동 때만 포커스 테두리
        className={`grid h-9 w-9 place-items-center rounded-full outline-none transition-colors hover:text-paper focus-visible:ring-2 focus-visible:ring-toss/40 ${open ? 'text-paper' : 'text-tint/70'}`}
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
            className="absolute top-full right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-card shadow-[0_12px_32px_-12px_rgba(16,24,40,0.25)]"
          >
            {/* 로그인할 때 받은 닉네임 · 이메일 (카카오 로그인은 이메일을 /api/auth/me로 채운다) */}
            <div className="border-b border-line px-4 pt-3.5 pb-3">
              <p className="truncate text-[15px] font-semibold text-paper">{member?.nickname ?? '회원'}</p>
              {member?.email && <p className="mt-1 truncate text-[13px] text-mute">{member.email}</p>}
            </div>
            <div className="py-1">
              <Link role="menuitem" to="/app/me" onClick={() => setOpen(false)} className={row}>
                마이페이지
              </Link>
              <button role="menuitem" type="button" onClick={onLogout} className={row}>
                로그아웃
              </button>
              {/* 탈퇴는 아주 옅게, 올리면 글자만 빨갛게 (TODO: 탈퇴 확인 창 + member-service 탈퇴 API) */}
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false)
                  onWithdraw()
                }}
                className="block w-full px-4 py-2.5 text-left text-[12px] text-dim transition-colors hover:text-[#f04452]"
              >
                회원 탈퇴
              </button>
            </div>
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
