import Lenis from 'lenis'
import { AnimatePresence, cancelFrame, frame, motion } from 'motion/react'
import { type FormEvent, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router'
import { AppShell } from '../components/AppShell'
import { BookmarkButton } from '../components/BookmarkButton'
import { ScoreRing } from '../components/ScoreRing'
import { toggleBookmark, useBookmarks } from '../data/bookmarks'
import { type Feedback, QUESTIONS, type QuestionRecord, type Tag } from '../data/questions'

const EASE = [0.22, 1, 0.36, 1] as const

type Attempt = { answer: string; feedback: Feedback; date: string }

/** STAR 기법: 상황 · 과제 · 행동 · 결과 */
const STAR = [
  { key: 'S', label: '상황', hint: '언제, 어디서, 어떤 상황이었나요?' },
  { key: 'T', label: '과제', hint: '내가 맡은 역할이나 풀어야 할 문제는?' },
  { key: 'A', label: '행동', hint: '구체적으로 무엇을, 왜 그렇게 했나요?' },
  { key: 'R', label: '결과', hint: '어떻게 됐나요? 숫자가 있으면 좋아요.' },
] as const

const WEEK = ['일', '월', '화', '수', '목', '금', '토']
/** 오늘을 목업 날짜 형식(MM.DD (요일))으로 */
function todayLabel() {
  const d = new Date()
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${WEEK[d.getDay()]})`
}

/** 목업 피드백: 답변 길이로만 점수를 흉내 낸다 */
function mockFeedback(answer: string, attempt: number): Feedback {
  const score = Math.min(95, 58 + Math.round(answer.length / 12) + attempt * 6)
  return {
    score,
    good: '핵심 개념을 정확히 짚었어요.',
    lack: '실제 상황에서 무엇이 어떻게 틀어졌는지가 빠져 있어요.',
    next: '겪은 상황을 숫자와 함께 한 문장으로 덧붙여 보세요.',
  }
}

/**
 * 텍스트 면접 상세 (문서형, 화면만): 목록에서 질문 하나를 눌러 들어온다.
 * 왼쪽: 질문 → STAR 가이드 → 작성 칸 (쓰기만).
 * 오른쪽: 이 질문에 쓴 답변 기록 목록. 누르면 왼쪽 작성 칸 자리가 그 답변의 결과로 바뀐다. (모바일은 목록이 아래로)
 * 제출하면 새 답변의 결과가 같은 자리에 바로 뜬다.
 * TODO: 답변 제출·피드백·기록 API(interview-service) 연동
 */
export default function TextAnswer() {
  const { id } = useParams()
  const record = QUESTIONS.find((q) => String(q.id) === id)
  // 잘못된 주소는 목록으로
  if (!record) return <Navigate to="/app/answer" replace />
  return <AnswerDoc key={record.id} record={record} />
}

function AnswerDoc({ record }: { record: QuestionRecord }) {
  // 목록에서 몇 페이지에서 왔는지 (돌아갈 때 같은 페이지로)
  const from = (useLocation().state as { from?: number } | null)?.from ?? 1
  // 이전 답변들 + 가장 최근 답변 (오래된 순)
  const [attempts, setAttempts] = useState<Attempt[]>(() => [
    ...(record.past ?? []),
    ...(record.answer && record.feedback
      ? [
          {
            answer: record.answer,
            feedback: record.feedback,
            date: record.date,
          },
        ]
      : []),
  ])
  // 결과로 보고 있는 답변 (없으면 작성 칸)
  const [selected, setSelected] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const bookmarked = useBookmarks().has(record.id)
  // 답변 기록은 5개까지만 보이고 나머지는 목록 안에서 스크롤
  const VISIBLE = 5
  const historyBox = useRef<HTMLDivElement>(null)
  const [historyMax, setHistoryMax] = useState<number>()
  useLayoutEffect(() => {
    const list = historyBox.current?.querySelector('ol')
    if (!list) return
    const measure = () => {
      const items = list.querySelectorAll(':scope > li')
      setHistoryMax(items.length <= VISIBLE ? undefined : Math.ceil(1 + [...items].slice(0, VISIBLE).reduce((sum, li) => sum + li.getBoundingClientRect().height, 0)))
    }
    measure()
    // 글꼴이 늦게 로드되거나 창 폭이 바뀌어 줄 높이가 달라지면 다시 잰다
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    return () => ro.disconnect()
  }, [attempts.length])

  // 답변 기록 목록만 부드럽게 스크롤 (랜딩과 같은 Lenis, 이 상자 안에서만)
  useEffect(() => {
    const box = historyBox.current
    const content = box?.firstElementChild as HTMLElement | null
    if (!box || !content || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ wrapper: box, content, duration: 0.9, smoothWheel: true })
    const update = ({ timestamp }: { timestamp: number }) => lenis.raf(timestamp)
    frame.update(update, true)
    return () => {
      cancelFrame(update)
      lenis.destroy()
    }
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || submitting) return
    setSubmitting(true)
    window.setTimeout(() => {
      const n = attempts.length
      setAttempts([...attempts, { answer: text, feedback: mockFeedback(text, n), date: todayLabel() }])
      setSelected(n)
      setDraft('')
      setSubmitting(false)
    }, 1200)
  }

  const current = selected === null ? null : attempts[selected]

  return (
    <AppShell wide>
      <div className="mx-auto max-w-[1120px]">
        {/* 위: 돌아가기 + 날짜·태그 */}
        <div className="flex items-center gap-3">
          <Link
            to={from > 1 ? `/app/answer?page=${from}` : '/app/answer'}
            aria-label="목록으로"
            className="-ml-2 grid h-9 w-9 place-items-center rounded-full text-soft transition-colors hover:bg-tint/[0.06] hover:text-paper"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
          <p className="text-[13px] text-mute">
            {record.date} · {record.tag}
            {record.parentId !== undefined && (
              <>
                {' · '}
                <Link to={`/app/answer/${record.parentId}`} className="underline-offset-4 hover:text-paper hover:underline">
                  꼬리 질문
                </Link>
              </>
            )}
          </p>
          <BookmarkButton on={bookmarked} onToggle={() => toggleBookmark(record.id)} className="-ml-1.5" />
        </div>

        <div className="mt-4 grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
          {/* 왼쪽: 질문 → 작성 칸 */}
          <article className="min-w-0">
            <h1 className="text-[clamp(22px,2.2vw,28px)] leading-snug font-semibold tracking-tight text-paper">{record.question}</h1>

            {/* 기록을 고르면 이 자리가 그 답변의 결과로 바뀐다. 쓰던 글(draft)은 위에서 들고 있어 그대로 남는다 */}
            <AnimatePresence mode="wait" initial={false}>
              {current && selected !== null ? (
                <motion.div key={`result-${selected}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: EASE }}>
                  <ResultView index={selected} attempt={current} tag={record.tag} />
                </motion.div>
              ) : (
                <motion.div key="compose" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: EASE }}>
                  <Composer value={draft} onChange={setDraft} onSubmit={submit} submitting={submitting} />
                </motion.div>
              )}
            </AnimatePresence>
          </article>

          {/* 오른쪽: 이 질문의 답변 기록 (누르면 옆 창) */}
          <aside aria-label="답변 기록" className="lg:sticky lg:top-28 lg:self-start lg:pt-[9px]">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-paper">
                답변 기록 <span className="ml-1 text-mute tabular-nums">{attempts.length}</span>
              </h2>
              {/* 새 답변 쓰기 */}
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label={draft.trim() ? '쓰던 답변 이어 쓰기' : '새 답변 쓰기'}
                title={draft.trim() ? '쓰던 답변 이어 쓰기' : '새 답변 쓰기'}
                className={`-mr-px grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-tint/[0.06] hover:text-paper ${selected === null ? 'text-paper' : 'text-soft'}`}
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
            {/* 스크롤 영역: 오른쪽에 스크롤바 자리를 따로 두어 글자를 가리지 않게, 스크롤바는 밝은 회색 */}
            <div ref={historyBox} style={{ maxHeight: historyMax }} className="thin-scroll -mx-3 mt-3 overflow-y-auto px-3 [scrollbar-gutter:stable]">
              <ol className="border-t border-line">
                {[...attempts.keys()].reverse().map((i) => {
                  const a = attempts[i]
                  const on = selected === i
                  return (
                    <li key={i} className="border-b border-line">
                      <button
                        type="button"
                        aria-current={on ? 'true' : undefined}
                        onClick={() => setSelected(i)}
                        className={`block w-full rounded-lg px-3 py-3.5 text-left transition-colors ${on ? 'bg-tint/[0.04]' : 'hover:bg-tint/[0.03]'}`}
                      >
                        <span className="flex items-center justify-between">
                          <span className={`text-[13px] ${on ? 'font-medium text-paper' : 'text-soft'}`}>{a.date}</span>
                          <ScoreRing score={a.feedback.score} size={28} />
                        </span>
                        <span className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-mute">{a.answer}</span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </div>
            {attempts.length === 0 && <p className="py-6 text-[13px] text-mute">아직 답변이 없어요. 첫 답변을 써 보세요.</p>}
          </aside>
        </div>
      </div>
    </AppShell>
  )
}

/* ───────── 피드백 상세 (목업) ───────── */

type Detail = {
  summary: string
  good: string
  next: string
  rewrite: string
  followUps: string[]
}

const FOLLOW_UPS: Record<Tag, string[]> = {
  직무: ['그 방법의 단점은 무엇인가요?', '규모가 10배 커지면 무엇이 달라지나요?', '실제로 적용해 본 적이 있나요?'],
  경험: ['그때 다른 선택지는 무엇이었나요?', '팀에서 반대 의견은 없었나요?', '다시 한다면 무엇을 바꾸겠어요?'],
  협업: ['상대가 끝까지 동의하지 않았다면요?', '그 일 이후 팀에 생긴 변화는?', '본인의 부족했던 점은 무엇이었나요?'],
  컬처핏: ['그 가치가 흔들렸던 경험이 있나요?', '우리 팀과 맞지 않는 부분이 있다면?', '5년 뒤 어떤 모습이고 싶나요?'],
}
// 피드백 한 줄 뒤에 붙이는 설명 (태그별, 목업)
const GOOD_MORE: Record<Tag, string> = {
  직무: '개념을 먼저 짚고 원인과 해결로 이어 가서, 듣는 사람이 흐름을 놓치지 않고 따라올 수 있었어요.',
  경험: '실제로 겪은 일이라 말에 힘이 있고, 면접관이 상황을 쉽게 떠올릴 수 있었어요.',
  협업: '상대의 입장까지 함께 말해서, 혼자 일하는 사람이 아니라는 인상을 줬어요.',
  컬처핏: '가치관을 구체적인 행동과 연결해서, 말뿐인 답변으로 들리지 않았어요.',
}
const NEXT_MORE: Record<Tag, string> = {
  직무: '면접관은 “왜 그 방법을 골랐는지”를 가장 궁금해해요. 선택지 두세 개를 나란히 놓고, 상황에 따라 무엇을 고르는지 기준을 한 문장으로 붙여 보세요.',
  경험: '결과가 빠지면 이야기가 중간에 끝난 느낌이 들어요. 바뀐 숫자(시간, 건수, 비용)를 하나만 넣어도 답변의 무게가 달라져요.',
  협업: '갈등을 어떻게 풀었는지에서 끝나지 말고, 그 뒤 팀에 남은 변화나 내가 바꾼 습관까지 이어 보세요.',
  컬처핏: '좋은 말로만 끝나면 누구나 할 수 있는 답이 돼요. 그 가치 때문에 손해를 보거나 선택을 바꾼 순간을 하나 넣어 보세요.',
}

const REWRITE: Record<Tag, string> = {
  직무: '주문 목록 API에서 쿼리가 101번 나가는 걸 로그로 확인했고, 페이징이 있어 fetch join 대신 batch size 100을 적용해 3번으로 줄였습니다.',
  경험: '가격 변경이 10분 늦게 반영돼 문의가 하루 30건 들어왔습니다. TTL을 1분으로 줄이고 변경 시 캐시를 지워 문의를 0건으로 만들었습니다.',
  협업: '일정과 품질 중 무엇을 지킬지 의견이 갈려, 영향 범위를 표로 정리해 함께 보고 핵심 기능만 먼저 내기로 합의했습니다.',
  컬처핏: '문제를 숨기지 않고 빨리 공유하는 걸 중요하게 생각합니다. 장애를 낸 날 먼저 회고 문서를 써서 같은 실수를 막았습니다.',
}

/** 점수와 답변으로 그럴듯한 상세 피드백을 만든다 (API 붙기 전 화면 확인용) */
function mockDetail(f: Feedback, tag: Tag): Detail {
  const s = f.score
  return {
    summary:
      s >= 85
        ? '구조와 근거가 모두 탄탄해요. 실제 면접에서 바로 써도 좋은 답변이에요. 꼬리 질문까지 준비해 두면 더 안심할 수 있어요.'
        : s >= 70
          ? '흐름은 좋아요. 무엇을 했는지는 잘 보이는데, 그래서 얼마나 나아졌는지가 약해요. 근거를 숫자로 보태면 훨씬 단단해져요.'
          : '핵심 개념은 짚었지만, 언제 어떤 상황이었는지와 결과가 비어 있어요. 지금은 정의를 말한 답변에 가까워서, 내 경험을 한 가지 붙여 보면 좋아요.',
    good: `${f.good} ${GOOD_MORE[tag]}`,
    next: `${f.next} ${NEXT_MORE[tag]}`,
    rewrite: REWRITE[tag],
    followUps: FOLLOW_UPS[tag],
  }
}

/**
 * 고른 답변의 결과 (가운데 칸, 작성 칸 자리에 뜬다).
 * 점수 링 + 총평 → 좋았던 점 / 고칠 점 → 예시 답변. 꼬리 질문·내 답변은 접어 둔다.
 * 작성 칸으로 돌아가려면 오른쪽 '답변 기록' 옆 + 버튼을 누른다.
 */
function ResultView({ index, attempt, tag }: { index: number; attempt: Attempt; tag: Tag }) {
  const [more, setMore] = useState<'follow' | 'answer' | null>(null)
  const d = mockDetail(attempt.feedback, tag)

  return (
    <section aria-label={`${index + 1}번째 답변 결과`} className="mt-8">
      {/* 점수 + 총평 (상자 없이) */}
      <div className="flex gap-5">
        <ScoreRing score={attempt.feedback.score} size={56} />
        <div className="min-w-0 flex-1">
          <p className="text-[16px] leading-relaxed font-medium text-paper">{d.summary}</p>
        </div>
      </div>

      {/* 좋았던 점 · 고칠 점 */}
      {[
        ['이런 점이 좋았어요.', d.good],
        ['이 부분을 고치면 좋겠어요.', d.next],
      ].map(([k, v]) => (
        <div key={k} className="mt-8">
          <SectionTitle>{k}</SectionTitle>
          <p className="mt-2.5 text-[15px] leading-relaxed text-soft">{v}</p>
        </div>
      ))}

      {/* 예시 답변 */}
      <div className="mt-8">
        <SectionTitle>이렇게 바꿔 보면 좋겠어요.</SectionTitle>
        <p className="mt-2.5 text-[15px] leading-relaxed text-soft">{d.rewrite}</p>
      </div>

      {/* 접어 둔 것: 내 답변 · 꼬리 질문 */}
      <div className="mt-6 border-t border-line pt-5">
        <div className="flex gap-5 text-[14px]">
          {(
            [
              ['answer', '내 답변 보기'],
              ['follow', '예상 꼬리 질문'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-expanded={more === k}
              onClick={() => setMore(more === k ? null : k)}
              className={`flex items-center gap-1.5 transition-colors ${more === k ? 'text-paper' : 'text-soft hover:text-paper'}`}
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-3.5 w-3.5 transition-transform ${more === k ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m9 5 7 7-7 7" />
              </svg>
              {label}
            </button>
          ))}
        </div>
        <AnimatePresence initial={false}>
          {more && (
            <motion.div
              key={more}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="overflow-hidden"
            >
              {more === 'follow' ? (
                <ol className="space-y-2 pt-4 text-[14px] leading-relaxed text-soft">
                  {d.followUps.map((q, i) => (
                    <li key={q} className="flex items-baseline gap-3">
                      <span className="text-mute tabular-nums">{i + 1}</span>
                      <span className="min-w-0 flex-1">{q}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="pt-4 text-[15px] leading-relaxed whitespace-pre-wrap text-soft">{attempt.answer}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

/** 결과 안 섹션 제목: 형광 점 + 진한 글씨 (흰 배경에서도 형광이 살고, 글씨는 잘 읽히게) */
function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="flex items-center gap-2 text-[15px] font-semibold text-paper">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-grass" />
      {children}
    </h3>
  )
}

/** 작성 칸 + STAR 가이드 */
function Composer({ value, onChange, onSubmit, submitting }: { value: string; onChange: (v: string) => void; onSubmit: (e: FormEvent) => void; submitting: boolean }) {
  return (
    <form onSubmit={onSubmit} className="mt-8">
      {/* STAR 가이드 */}
      <div className="rounded-2xl border border-line bg-card px-5 py-4 shadow-card in-data-[theme=light]:border-transparent">
        <p className="text-[13px] text-soft">
          <span className="font-display font-medium tracking-[0.06em] text-paper">STAR</span>로 정리하면 전달이 쉬워요
        </p>
        <ol className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {STAR.map((s, i) => (
            <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed">
              <span className="w-4 shrink-0 font-display font-semibold text-lime">{s.key}</span>
              <span>
                <span className="text-soft">{s.label}</span> <span className="text-mute">· {s.hint}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <textarea
        autoFocus
        aria-label="답변"
        placeholder="생각나는 대로 적어 보세요. 제출하면 바로 피드백을 드릴게요."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-4 block min-h-[min(36svh,320px)] w-full resize-y rounded-2xl border border-line bg-card px-5 py-4 shadow-card in-data-[theme=light]:border-transparent text-[16px] leading-[1.8] text-paper outline-none transition-colors placeholder:text-dim focus:border-mute in-data-[theme=light]:focus:border-transparent"
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[12px] text-mute tabular-nums">{value.trim().length}자</span>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={!value.trim() || submitting}
            className="rounded-xl bg-cta px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cta-hover disabled:cursor-not-allowed disabled:opacity-30"
          >
            {submitting ? '분석 중…' : '제출하기'}
          </button>
        </div>
      </div>
    </form>
  )
}
