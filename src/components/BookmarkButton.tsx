/** 북마크 토글 아이콘 버튼. 켜지면 대표색(고른 색 그대로)으로 채워진다 */
export function BookmarkButton({ on, onToggle, className = '' }: { on: boolean; onToggle: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label={on ? '북마크 해제' : '북마크'}
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onToggle()
      }}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors hover:bg-tint/[0.06] ${on ? 'text-grass' : 'text-dim hover:text-soft'} ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
        <path d="M6 4h12v16l-6-4-6 4V4Z" />
      </svg>
    </button>
  )
}
