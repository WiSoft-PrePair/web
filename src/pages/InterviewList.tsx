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
 * 화면 오른쪽 아래에 떠 있는 '화상 면접 시작'으로 새 면접(기기 점검 → 면접)에 들어간다.
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
      <div className="mx-auto max-w-[760px] pb-20">
        <div>
          <PageTitle title="화상 면접" desc="AI 면접관 앞에서 말로 답하고, 꼬리 질문까지 연습해요." />
        </div>

        <div className="relative mt-8">
          {/* 넓은 화면: 검색·필터를 가운데 목록 칸 바깥 왼쪽에 (텍스트 면접 목록과 같게) */}
          <aside className="absolute top-0 right-full mr-12 hidden h-full w-[150px] min-[1240px]:block">
            <div className="sticky top-28">
              <ListFilters vertical {...filterProps} />
            </div>
          </aside>
          {/* 좁은 화면: 목록 위에 가로로 */}
          <div className="mb-6 min-[1240px]:hidden">
            <ListFilters {...filterProps} />
          </div>

          {groups.map((g) => (
            <section key={g.name} aria-label={g.name} className="mt-8 first:mt-0">
              <h2 className="mb-2.5 pl-1 text-[14px] font-semibold text-soft">{g.name}</h2>
              <ul className="in-data-[theme=light]:rounded-2xl in-data-[theme=light]:border-0 in-data-[theme=light]:bg-card in-data-[theme=light]:px-5 in-data-[theme=light]:shadow-card in-data-[theme=light]:[&>li:last-child]:border-b-0">
                {g.rows.map((r) => (
                  <li key={r.id} className="group flex items-center gap-4 border-b border-line py-3">
                    <ScoreRing score={r.score} />
                    {/* 모바일: 질문 한 줄 + 아래 줄에 태그·날짜 / 넓은 화면(sm~): 태그 · 질문 · 날짜 한 줄 */}
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                      <span className="block min-w-0 truncate text-[15px] font-medium text-[#4e5968] transition-colors duration-200 group-hover:text-paper sm:order-2 sm:flex-1">{r.first}</span>
                      <span className="flex items-center gap-2 sm:contents">
                        <span className="w-[52px] shrink-0 rounded-full border border-line py-[3px] text-center text-[12px] text-mute sm:order-1">{r.tag}</span>
                        <span className="shrink-0 text-[12px] text-mute tabular-nums sm:order-3">{r.date}</span>
                      </span>
                    </span>
                    <BookmarkButton on={bookmarks.has(r.id)} onToggle={() => toggleInterviewBookmark(r.id)} className="-ml-2" />
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {items.length === 0 && (
            <p className="pt-16 text-center text-[14px] text-mute">
              {INTERVIEWS.length === 0
                ? "아직 본 면접이 없어요. 오른쪽 아래 '화상 면접 시작'으로 첫 면접을 시작해 보세요."
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

      {/* 면접 시작: 메인 하단 바의 파란 버튼과 같은 모양으로 오른쪽 아래에 떠 있다 */}
      <Link
        to="/app/interview/new"
        className="fixed right-[var(--side)] bottom-8 z-20 rounded-full bg-toss px-6 py-3.5 text-[14px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(49,130,246,0.55)] transition-colors hover:bg-toss-hover"
      >
        화상 면접 시작
      </Link>
    </AppShell>
  )
}
