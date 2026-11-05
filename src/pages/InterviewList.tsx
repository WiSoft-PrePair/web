import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AppShell, PageTitle } from '../components/AppShell'
import { BookmarkButton } from '../components/BookmarkButton'
import { ListFilters } from '../components/ListFilters'
import { ScoreRing } from '../components/ScoreRing'
import { toggleInterviewBookmark, useInterviewBookmarks } from '../data/bookmarks'
import { INTERVIEWS } from '../data/interviews'
import { TAGS } from '../data/questions'
import { groupByWeek } from '../data/weekGroups'

const STEP = 10 // '더 보기' 한 번에 늘어나는 수

/**
 * 화상 면접 기록 목록 (화면만): 텍스트 면접 목록과 같은 구성 (왼쪽 검색·태그·북마크, 이번 주 · 지난주 · 이전, 한 줄, 더 보기).
 * 한 줄: 점수 링 · 태그(주로 다룬 유형) · 첫 질문 · 날짜 · 북마크. 점수가 없으면 중간에 그만둔 면접(점선 원).
 * 화면 오른쪽 아래에 떠 있는 '면접 시작'으로 새 면접(기기 점검 → 면접)에 들어간다.
 * TODO: 기록을 누르면 결과 화면, 세션 API 연동
 */
export default function InterviewList() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  // 태그: 그 면접에서 주로 다룬 질문 유형 (텍스트 면접과 같은 분류)
  const [tag, setTag] = useState('전체')
  const bookmarks = useInterviewBookmarks()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const goPage = (n: number) => setParams(n === 1 ? {} : { page: String(n) })
  const norm = (t: string) => t.toLowerCase().replace(/\s+/g, '')
  const q = norm(query)
  const matched = INTERVIEWS.filter((r) => (tag === '전체' || (tag === '북마크' ? bookmarks.has(r.id) : r.tag === tag)) && (!q || norm(r.first).includes(q)))
  const items = matched.slice(0, page * STEP)
  const filterProps = {
    query,
    onQuery: (v: string) => {
      setQuery(v)
      goPage(1)
    },
    tabs: ['전체', ...TAGS, '북마크'].map((k) => ({ key: k, label: k, count: k === '전체' ? INTERVIEWS.length : k === '북마크' ? bookmarks.size : INTERVIEWS.filter((r) => r.tag === k).length })),
    active: tag,
    onTab: (k: string) => {
      setTag(k)
      goPage(1)
    },
  }
  const groups = groupByWeek(items, INTERVIEWS[0]?.date ?? '')

  return (
    <AppShell>
      <div className="mx-auto max-w-[760px]">
        {/* 제목 아래 구분선 (텍스트 면접 목록과 같게) */}
        <div className="border-b border-line pb-3">
          <PageTitle eyebrow="VIDEO INTERVIEW" title="화상 면접" />
        </div>

        <div className="relative mt-8">
          {/* 넓은 화면: 검색·필터를 가운데 목록 칸 바깥 왼쪽에 (텍스트 면접 목록과 같게) */}
          <aside className="absolute top-0 right-full mr-12 hidden h-full w-[150px] xl:block">
            <div className="sticky top-28">
              <ListFilters vertical {...filterProps} />
            </div>
          </aside>
          {/* 좁은 화면: 목록 위에 가로로 */}
          <div className="mb-6 xl:hidden">
            <ListFilters {...filterProps} />
          </div>

          {groups.map((g) => (
            <section key={g.name} aria-label={g.name} className="mt-8 first:mt-0">
              <h2 className="mb-2 text-[12px] font-medium text-mute">{g.name}</h2>
              <ul>
                {g.rows.map((r) => (
                  <li key={r.id} className="group flex items-center gap-4 border-b border-line py-3">
                    <ScoreRing score={r.score} />
                    <span className="w-[52px] shrink-0 rounded-full border border-line py-[3px] text-center text-[11px] text-mute">{r.tag}</span>
                    <span className="min-w-0 flex-1 truncate text-[15px] text-soft transition-colors duration-200 group-hover:text-paper">{r.first}</span>
                    <span className="shrink-0 text-[12px] text-mute tabular-nums">{r.date}</span>
                    <BookmarkButton on={bookmarks.has(r.id)} onToggle={() => toggleInterviewBookmark(r.id)} className="-ml-2" />
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {items.length === 0 && (
            <p className="pt-16 text-center text-[14px] text-mute">
              {INTERVIEWS.length === 0
                ? "아직 본 면접이 없어요. 오른쪽 아래 '면접 시작'으로 첫 면접을 시작해 보세요."
                : query.trim()
                  ? `‘${query.trim()}’에 맞는 면접이 없어요.`
                  : tag === '북마크'
                    ? '북마크한 면접이 없어요. 기록 옆 표시를 눌러 모아 보세요.'
                    : '이 조건의 면접이 아직 없어요.'}
            </p>
          )}

          {matched.length > items.length && (
            <div className="mt-8 flex justify-center">
              <button type="button" onClick={() => goPage(page + 1)} className="rounded-full border border-line px-5 py-2 text-[13px] text-soft transition-colors hover:border-mute hover:text-paper">
                더 보기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 면접 시작: 화면 오른쪽 아래에 떠 있어 스크롤 중에도 바로 누를 수 있다 */}
      <Link
        to="/app/interview/new"
        className="fixed right-[var(--side)] bottom-8 z-20 flex h-12 items-center gap-2 rounded-full bg-paper pr-5 pl-4 text-[14px] font-semibold text-ink shadow-[0_10px_30px_-8px_rgba(0,0,0,0.35)] transition-transform duration-200 hover:-translate-y-0.5"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h9A1.5 1.5 0 0 1 15 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 16.5v-9Z M15 10.5l6-3.5v10l-6-3.5" />
        </svg>
        면접 시작
      </Link>
    </AppShell>
  )
}
