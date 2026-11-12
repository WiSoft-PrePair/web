import { motion } from 'motion/react'

/** 북마크 토글 아이콘 버튼. 켜지면 대표색(고른 색 그대로)으로 채워진다. 누르면 줄었다가 스프링으로 튕기듯 돌아온다 (바탕 효과 없음) */
export function BookmarkButton({ on, onToggle, className = '' }: { on: boolean; onToggle: () => void; className?: string }) {
  return (
    <motion.button
      type="button"
      aria-label={on ? '북마크 해제' : '북마크'}
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onToggle()
      }}
      whileTap={{ scale: 0.75 }}
      transition={{ type: 'spring', stiffness: 500, damping: 12 }}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-toss/40 ${on ? 'text-grass' : 'text-dim hover:text-soft'} ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
        <path d="M6 4h12v16l-6-4-6 4V4Z" />
      </svg>
    </motion.button>
  )
}
