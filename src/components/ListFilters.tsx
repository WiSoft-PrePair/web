/**
 * 목록 화면 공용 검색 + 필터 탭 (텍스트·화상 면접 목록).
 * vertical: 넓은 화면 왼쪽 사이드바(세로), 아니면 목록 위 가로 줄.
 */
export type FilterTab = { key: string; label: string; count: number }

export function ListFilters({
  query,
  onQuery,
  tabs,
  active,
  onTab,
  vertical = false,
  placeholder = '질문 검색',
}: {
  query: string
  onQuery: (v: string) => void
  tabs: FilterTab[]
  active: string
  onTab: (key: string) => void
  vertical?: boolean
  placeholder?: string
}) {
  return (
    <>
      <label className="flex items-center gap-2 border-b border-line pb-2.5">
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-mute" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          aria-label={placeholder}
          placeholder={placeholder}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          className="w-full bg-transparent text-[13px] text-paper outline-none placeholder:text-dim [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button type="button" aria-label="검색어 지우기" onClick={() => onQuery('')} className="shrink-0 text-mute transition-colors hover:text-paper">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        )}
      </label>

      <div role="tablist" aria-label="필터" aria-orientation={vertical ? 'vertical' : 'horizontal'} className={`-mx-3 mt-4 flex gap-1 ${vertical ? 'flex-col' : 'overflow-x-auto'}`}>
        {tabs.map((t) => {
          const on = active === t.key
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onTab(t.key)}
              className={`flex shrink-0 items-center justify-between gap-4 rounded-lg px-3 py-2 text-left text-[14px] transition-colors ${on ? 'bg-tint/[0.06] font-medium text-paper' : 'text-mute hover:text-soft'}`}
            >
              {t.label}
              <span className="text-[12px] font-normal text-dim tabular-nums">{t.count}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}
