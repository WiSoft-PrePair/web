import { Link } from 'react-router'

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-ink/75 backdrop-blur-md xl:bg-transparent xl:backdrop-blur-none">
      <div className="flex items-center justify-between px-[var(--gutter)] py-5 xl:py-[30px]">
        <Link to="/" className="font-display text-base font-semibold tracking-tight text-white">
          PREPAIR<span className="text-lime">.</span>
        </Link>
        <nav className="flex gap-6 font-display text-sm tracking-[-0.01em] text-white xl:gap-[clamp(32px,2.083vw,40px)] xl:text-base">
          <a href="#how">HOW IT WORKS</a>
          <Link to="/login">LOGIN</Link>
        </nav>
      </div>
    </header>
  )
}
