import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AppShell, PageTitle } from '../components/AppShell'
import { BookmarkButton } from '../components/BookmarkButton'
import { ListFilters } from '../components/ListFilters'
import { ScoreRing } from '../components/ScoreRing'
import { toggleBookmark, useBookmarks } from '../data/bookmarks'
import { QUESTIONS, type QuestionRecord, TAGS, type Tag } from '../data/questions'
import { groupByWeek } from '../data/weekGroups'

/**
 * 텍스트 면접 목록 (화면만): 받은 질문 기록이 먼저, 하나를 눌러 들어가서 답한다.
 * 게시판처럼 보이지 않게 '내 연습 기록'으로: 한 줄에 상태(점수 링 / 아직 안 답함) · 태그 · 질문 · 날짜(오른쪽 끝).
 * 이번 주 · 지난주 · 이전으로 묶고, 페이지 번호 대신 '더 보기'. 보여 준 양은 주소(?page=)에 남겨 상세에서 돌아와도 유지된다.
 * 위 검색창으로 질문 내용만 찾고(대소문자·띄어쓰기 무시), 태그로 걸러 볼 수 있다(검색과 함께 적용).
 * TODO: interview-service 기록 API, 서버 검색
 */
const STEP = 10 // '더 보기' 한 번에 늘어나는 수

/** 최근 점수 (아직 안 답했으면 없음) */
function statusOf(r: QuestionRecord) {
  return { score: r.feedback?.score ?? r.past?.at(-1)?.feedback.score }
}

export default function AnswerList() {
  const [query, setQuery] = useState('')
  // 탭: 전체(null) · 태그 · 북마크
  const [tag, setTag] = useState<Tag | '북마크' | null>(null)
  const bookmarks = useBookmarks()
  const [params, setParams] = useSearchParams()
  const norm = (t: string) => t.toLowerCase().replace(/\s+/g, '')
  const q = norm(query)
  const matched = QUESTIONS.filter((r) => (!tag || (tag === '북마크' ? bookmarks.has(r.id) : r.tag === tag)) && (!q || norm(r.question).includes(q)))
  const page = Math.max(1, Number(params.get('page')) || 1)
  const items = matched.slice(0, page * STEP)
  const groups = groupByWeek(items, QUESTIONS[0].date)
  const goPage = (n: number) => setParams(n === 1 ? {} : { page: String(n) })
  const search = (v: string) => {
    setQuery(v)
    goPage(1)
  }

  const filterProps = {
    query,
    onQuery: search,
    tabs: [null, ...TAGS, '북마크' as const].map((t) => ({
      key: t ?? '전체',
      label: t ?? '전체',
      count: t === null ? QUESTIONS.length : t === '북마크' ? bookmarks.size : QUESTIONS.filter((r) => r.tag === t).length,
    })),
    active: tag ?? '전체',
    onTab: (k: string) => {
      setTag(k === '전체' ? null : (k as Tag | '북마크'))
      goPage(1)
    },
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[760px]">
        <div className="relative">
          <PageTitle title="텍스트 면접" desc="매일 받은 질문에 글로 답하고, 바로 피드백을 받아요." />
        </div>

        {/* 넓은 화면: 검색·태그를 가운데 목록 칸 바깥 왼쪽에 띄운다 (가운데는 질문만) */}
        <div className="relative mt-8">
          <aside className="absolute top-0 right-full mr-12 hidden h-full w-[150px] min-[1240px]:block">
            <div className="sticky top-28">
              <ListFilters vertical {...filterProps} />
            </div>
          </aside>

          {/* 좁은 화면: 같은 검색·태그를 목록 위에 가로로 */}
          <div className="mb-6 min-[1240px]:hidden">
            <ListFilters {...filterProps} />
          </div>

          {groups.map((g) => (
            <section key={g.name} aria-label={g.name} className="mt-8 first:mt-0">
              <h2 className="mb-2.5 pl-1 text-[14px] font-semibold text-soft">{g.name}</h2>
              <ul className="in-data-[theme=light]:rounded-2xl in-data-[theme=light]:border-0 in-data-[theme=light]:bg-card in-data-[theme=light]:px-5 in-data-[theme=light]:shadow-card in-data-[theme=light]:[&>li:last-child]:border-b-0">
                {g.rows.map((r) => {
                  const today = r.id === QUESTIONS[0].id
                  const { score } = statusOf(r)
                  return (
                    <li key={r.id} className="group flex items-center gap-2 border-b border-line">
                      <Link to={`/app/answer/${r.id}`} state={{ from: page }} className="flex min-w-0 flex-1 items-center gap-4 py-3">
                        <ScoreRing score={score} />
                        {/* 모바일: 질문 한 줄 + 아래 줄에 태그·날짜 / 넓은 화면(sm~): 태그 · 질문 · 날짜 한 줄 */}
                        <span className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                          <span className="block min-w-0 truncate text-[15px] font-medium text-[#4e5968] transition-colors group-hover:text-paper sm:order-2 sm:flex-1">{r.question}</span>
                          <span className="flex items-center gap-2 sm:contents">
                            <span className="w-[52px] shrink-0 rounded-full border border-line py-[3px] text-center text-[12px] text-mute sm:order-1">{r.tag}</span>
                            <span className="shrink-0 text-[12px] text-mute tabular-nums sm:order-3">{today ? <span className="font-medium text-paper">오늘</span> : r.date}</span>
                          </span>
                        </span>
                      </Link>
                      <BookmarkButton on={bookmarks.has(r.id)} onToggle={() => toggleBookmark(r.id)} />
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}

          {items.length === 0 && (
            <p className="pt-16 text-center text-[14px] text-mute">
              {query.trim() ? `‘${query.trim()}’에 맞는 질문이 없어요.` : tag === '북마크' ? '북마크한 질문이 없어요. 질문 옆 표시를 눌러 모아 보세요.' : '이 태그의 질문이 아직 없어요.'}
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
    </AppShell>
  )
}
