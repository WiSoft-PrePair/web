import { useLayoutEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AppShell, PageTitle } from '../components/AppShell'
import { BookmarkButton } from '../components/BookmarkButton'
import { toggleBookmark, useBookmarks } from '../data/bookmarks'
import { QUESTIONS, TAGS, type Tag } from '../data/questions'

/**
 * 텍스트 면접 목록 (화면만): 받은 질문 기록이 먼저, 하나를 눌러 들어가서 답한다.
 * 위 검색창으로 질문 내용만 찾고(대소문자·띄어쓰기 무시, 답변 본문은 제외), 태그로 걸러 볼 수 있다(검색과 함께 적용).
 * 페이지 방식: 한 페이지 줄 수는 창 높이에 맞춰 정하고(스크롤 없음),
 * 목록 높이를 그 줄 수만큼 고정해 마지막 페이지에서도 페이지 버튼 위치가 그대로다.
 * 현재 페이지는 주소(?page=)에 남겨 상세에서 돌아와도 유지된다.
 * TODO: interview-service 기록 API, 서버 검색
 */
const ROW_H = 57 // 한 줄 56px + 구분선 1px
const PAGER_H = 36 + 24 // 페이지 버튼 + 위 여백
const BOTTOM = 48 // 화면 아래 여백 (AppShell pb-12)

/** 목록 시작 위치부터 화면 아래까지 들어가는 줄 수 (3~12줄) */
function useRowsThatFit() {
  const list = useRef<HTMLUListElement>(null)
  const [rows, setRows] = useState(7)
  useLayoutEffect(() => {
    const fit = () => {
      const top = list.current?.getBoundingClientRect().top ?? 0
      const n = Math.floor((window.innerHeight - top - PAGER_H - BOTTOM) / ROW_H)
      setRows(Math.min(12, Math.max(3, n)))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  return [list, rows] as const
}

export default function AnswerList() {
  const [query, setQuery] = useState('')
  // 탭: 전체(null) · 태그 · 북마크
  const [tag, setTag] = useState<Tag | '북마크' | null>(null)
  const bookmarks = useBookmarks()
  const [params, setParams] = useSearchParams()
  const [list, pageSize] = useRowsThatFit()
  const norm = (t: string) => t.toLowerCase().replace(/\s+/g, '')
  const q = norm(query)
  const matched = QUESTIONS.filter((r) => (!tag || (tag === '북마크' ? bookmarks.has(r.id) : r.tag === tag)) && (!q || norm(r.question).includes(q)))
  const pages = Math.max(1, Math.ceil(matched.length / pageSize))
  const page = Math.min(pages, Math.max(1, Number(params.get('page')) || 1))
  const items = matched.slice((page - 1) * pageSize, page * pageSize)
  const goPage = (n: number) => setParams(n === 1 ? {} : { page: String(n) })
  const search = (v: string) => {
    setQuery(v)
    goPage(1)
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[760px]">
        <PageTitle eyebrow="TEXT INTERVIEW" title="텍스트 면접" />

        {/* 게시판 툴바: 왼쪽 태그 탭(밑줄 = 선택), 오른쪽 검색. 아래 선이 목록의 윗선을 겸한다 */}
        <div className="mt-8 flex flex-col-reverse gap-2 border-b border-line sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div role="tablist" aria-label="태그" className="-mb-px flex gap-5">
            {[null, ...TAGS, '북마크' as const].map((t) => {
              const on = tag === t
              return (
                <button
                  key={t ?? 'all'}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => {
                    setTag(t)
                    goPage(1)
                  }}
                  className={`border-b-2 pb-3 text-[14px] transition-colors ${on ? 'border-paper font-medium text-paper' : 'border-transparent text-mute hover:text-soft'}`}
                >
                  {t ?? '전체'}
                </button>
              )
            })}
          </div>

          <label className="flex items-center gap-2 pb-3 sm:w-[120px]">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-mute" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              aria-label="질문 검색"
              placeholder="질문 검색"
              value={query}
              onChange={(e) => search(e.target.value)}
              className="w-full bg-transparent text-[13px] text-paper outline-none placeholder:text-dim [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button type="button" aria-label="검색어 지우기" onClick={() => search('')} className="shrink-0 text-mute transition-colors hover:text-paper">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            )}
          </label>
        </div>

        {/* 높이를 pageSize줄로 고정: 줄 수가 적은 페이지에서도 아래 페이지 버튼이 움직이지 않는다 */}
        <div className="relative" style={{ height: pageSize * ROW_H }}>
          <ul ref={list}>
            {items.map((r) => {
              const today = r.id === QUESTIONS[0].id
              return (
                <li key={r.id} className="flex items-center gap-2 border-b border-line">
                  <Link to={`/app/answer/${r.id}`} state={{ from: page }} className="group flex h-14 min-w-0 flex-1 items-center gap-4 md:gap-6">
                    <span className="w-[72px] shrink-0 text-[13px] text-mute tabular-nums">
                      {today ? <span className="font-display tracking-[0.06em] text-lime">TODAY</span> : r.date}
                    </span>
                    <span className="w-12 shrink-0 text-[12px] text-mute sm:w-14">{r.tag}</span>
                    <span className="min-w-0 flex-1 truncate text-[15px] text-soft transition-colors group-hover:text-paper">{r.question}</span>
                  </Link>
                  <BookmarkButton on={bookmarks.has(r.id)} onToggle={() => toggleBookmark(r.id)} className="-mr-2" />
                </li>
              )
            })}
          </ul>
          {items.length === 0 && (
            <p className="absolute inset-x-0 top-16 text-center text-[14px] text-mute">
              {query.trim() ? `‘${query.trim()}’에 맞는 질문이 없어요.` : tag === '북마크' ? '북마크한 질문이 없어요. 질문 옆 표시를 눌러 모아 보세요.' : '이 태그의 질문이 아직 없어요.'}
            </p>
          )}
        </div>

        {/* 페이지가 하나여도 자리는 남겨 둔다 */}
        <div className="mt-6 h-9">{pages > 1 && <Pagination page={page} pages={pages} onGo={goPage} />}</div>
      </div>
    </AppShell>
  )
}

/** ‹ 1 2 3 › — 페이지가 많으면 현재 주변만 보이고 나머지는 … */
function Pagination({ page, pages, onGo }: { page: number; pages: number; onGo: (n: number) => void }) {
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1)
  const arrow = 'grid h-9 w-9 place-items-center rounded-full text-mute transition-colors hover:text-paper disabled:pointer-events-none disabled:opacity-30'
  return (
    <nav aria-label="페이지" className="flex items-center justify-center gap-1">
      <button type="button" aria-label="이전 페이지" disabled={page === 1} onClick={() => onGo(page - 1)} className={arrow}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      {nums.map((n, i) => (
        <span key={n} className="flex items-center">
          {i > 0 && n - nums[i - 1] > 1 && <span className="w-6 text-center text-[13px] text-dim">…</span>}
          <button
            type="button"
            aria-label={`${n}페이지`}
            aria-current={n === page ? 'page' : undefined}
            onClick={() => onGo(n)}
            className={`h-9 min-w-9 rounded-full px-2 text-[14px] tabular-nums transition-colors ${n === page ? 'bg-tint/[0.08] font-medium text-paper' : 'text-mute hover:text-paper'}`}
          >
            {n}
          </button>
        </span>
      ))}
      <button type="button" aria-label="다음 페이지" disabled={page === pages} onClick={() => onGo(page + 1)} className={arrow}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m9 5 7 7-7 7" />
        </svg>
      </button>
    </nav>
  )
}
