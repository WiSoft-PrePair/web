import { Link } from 'react-router'
import { BrandLogo } from './auth'

/** 랜딩 헤더 (밝은 톤): 왼쪽 로고, 오른쪽 HOW IT WORKS(아래 소개로 이동) · START (로고와 같은 Fredoka) */
export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-ink/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-[var(--gutter)] xl:h-[72px]">
        <Link to="/" aria-label="PREPAIR 홈">
          <BrandLogo size={20} nudge={false} />
        </Link>
        <nav className="flex items-center gap-1 font-['Fredoka'] text-[14px] font-semibold tracking-[0.02em] text-soft xl:text-[15px]">
          <a href="#how" className="rounded-full px-3 py-2 transition-colors hover:bg-tint/[0.05] hover:text-paper">
            HOW IT WORKS
          </a>
          <Link to="/login" className="ml-1 rounded-full bg-toss px-4 py-2 text-white transition-colors hover:bg-toss-hover">
            START
          </Link>
        </nav>
      </div>
    </header>
  )
}
