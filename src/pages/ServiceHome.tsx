import { motion } from 'motion/react'
import { type ReactNode, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router'
import { AppHeader, ThemeRoot } from '../components/AppShell'
import { ScoreRing } from '../components/ScoreRing'
import { fullDate, QUESTIONS } from '../data/questions'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * 서비스 홈 (화면만, API 연동은 아직): 간단한 헤더 → 오늘의 질문(바로가기 3개) → 질문 기록 → 답변 잔디.
 * 데이터는 전부 목업. 나중에 interview-service 응답으로 바꾼다.
 */
export default function ServiceHome() {
  return (
    <ThemeRoot className="min-h-svh text-soft [--side:var(--gutter)] lg:[--side:clamp(40px,6.25vw,120px)]">
      <AppHeader />
      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="mx-auto max-w-[960px] px-[var(--side)] pt-24 pb-12 xl:pt-28"
      >
        <TodayQuestion />
        <QuestionHistory />
        <AnswerGrass />
      </motion.main>
    </ThemeRoot>
  )
}

/* ───────── 오늘의 질문 ───────── */

const ACTIONS = [
  { label: '텍스트 면접', to: '/app/answer' },
  { label: '화상 면접', to: '/app/interview' },
  { label: '맞춤 면접', to: '/app/custom' },
  { label: '공고 관리', to: '/app/jobs' },
  { label: '리워드 샵', to: '/app/shop' },
]

/** 가운데에 오늘의 질문, 그 아래 텍스트 바로가기 3개 */
const NICKNAME = '우민' // 목업

function TodayQuestion() {
  const today = RECORDS[0]

  return (
    <section
      aria-labelledby="today-title"
      className="flex flex-col items-center text-center"
    >
      {/* 질문 위 인사 한마디 (TODO: 닉네임은 회원 API에서) */}
      <p className="bob text-[14px] text-mute">
        <span className="font-medium text-paper">{NICKNAME}님,</span> 오늘도 한 문제만 같이 풀어 볼까요?
      </p>
      <OneLineTitle id="today-title" text={today.question} />

      <ActionTiles />
    </section>
  )
}

/** 바로가기 아이콘 (24px 선 아이콘) */
const ICONS: Record<string, ReactNode> = {
  '텍스트 면접': <path d="M4 20h4L19 9l-4-4L4 16v4Z M13.5 6.5l4 4" />,
  '화상 면접': <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h9A1.5 1.5 0 0 1 15 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 16.5v-9Z M15 10.5l6-3.5v10l-6-3.5" />,
  '맞춤 면접': <path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z M14 3v5h5 M9.5 13l1.8 1.8L15 11" />,
  '공고 관리': <path d="M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8Z M9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8 M4 13h16" />,
  '리워드 샵': <path d="M4 10h16v10H4V10Z M3 7h18v3H3V7Z M12 7v13 M12 7c-1.5-3-5-3-5-1s3 1 5 1Zm0 0c1.5-3 5-3 5-1s-3 1-5 1Z" />,
}

/**
 * 바로가기 5개: 카드. 아이콘은 왼쪽 위, 이름은 왼쪽 아래.
 * 커서를 올리면 아래에서부터 대표색이 차올라 카드가 물들고, 글자·아이콘은 그 위에서 읽히는 색으로 바뀐다.
 */
function ActionTiles() {
  return (
    <nav aria-label="바로가기" className="mt-9 grid w-full max-w-[720px] grid-cols-5 gap-2 max-sm:grid-cols-3">
      {ACTIONS.map(({ label, to }) => (
        <Link
          key={to}
          to={to}
          className="group relative isolate flex h-[92px] flex-col items-start justify-between overflow-hidden rounded-xl border border-line p-4 text-left text-soft transition-[color,border-color] duration-300 hover:border-grass hover:text-(--accent-on)"
        >
          {/* 차오르는 대표색 */}
          <span aria-hidden className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-grass transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100" />
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-mute transition-colors duration-300 group-hover:text-(--accent-on)" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {ICONS[label]}
          </svg>
          <span className="text-[14px] font-medium">{label}</span>
        </Link>
      ))}
    </nav>
  )
}

/** 질문을 한 줄로: 넘치면 글자를 줄이고(최소 18px), 그래도 넘치면(모바일 등) 줄바꿈 */
function OneLineTitle({ id, text }: { id: string; text: string }) {
  const ref = useRef<HTMLHeadingElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      let size = Math.min(30, Math.max(22, window.innerWidth * 0.022))
      el.style.whiteSpace = 'nowrap'
      el.style.fontSize = `${size}px`
      while (el.scrollWidth > el.clientWidth && size > 18) {
        size -= 1
        el.style.fontSize = `${size}px`
      }
      if (el.scrollWidth > el.clientWidth) el.style.whiteSpace = 'normal'
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [text])

  return (
    <h1
      ref={ref}
      id={id}
      className="bob mt-4 w-[min(1120px,calc(100vw-2*var(--side)))] leading-[1.35] font-semibold text-soft tracking-tight text-balance"
    >
      {text}
    </h1>
  )
}

/* ───────── 질문 기록 ───────── */

// 메인 목록은 지난 질문 중 답한 것만 (TODO: 무작위 3개)
const RECORDS = QUESTIONS.map((q) => ({ ...q, score: q.feedback?.score }))

function QuestionHistory() {
  return (
    <section aria-labelledby="history-title" className="mt-14">
      <div className="flex items-baseline justify-between">
        <h2 id="history-title" className="text-[15px] font-medium">
          이 질문, 지금 다시 답하면?
        </h2>
        <Link to="/app/answer" className="-mr-1 flex items-center text-[13px] text-soft transition-colors hover:text-paper">
          전체 보기
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m9 6 6 6-6 6" />
          </svg>
        </Link>
      </div>

      <ul className="mt-[10px] border-t border-line">
        {RECORDS.slice(1).filter((r) => r.score !== undefined).slice(0, 3).map((r) => {
          const pending = r.score === undefined
          return (
            <li key={r.id} className="border-b border-line">
              <Link to={`/app/answer/${r.id}`} className="group flex w-full items-center gap-4 py-2.5 text-left">
                <span className="shrink-0 text-[13px] text-mute tabular-nums">{fullDate(r.date)}</span>
                <span className="w-[52px] shrink-0 rounded-full border border-line py-[3px] text-center text-[11px] text-mute">{r.tag}</span>
                <span className="min-w-0 flex-1 truncate text-[15px] text-soft transition-colors group-hover:text-paper">{r.question}</span>
                {pending ? (
                  <span className="shrink-0 rounded-full border border-lime px-2.5 py-0.5 text-[12px] text-lime">답변하기</span>
                ) : (
                  <ScoreRing score={r.score} size={30} />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/* ───────── 답변 잔디 ───────── */

const WEEKS = 53
const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const LEVEL_CLASS = ['bg-tint/[0.06]', 'bg-grass/30', 'bg-grass/60', 'bg-grass']

/** 목업: 날짜마다 고정된 답변 수 (0~3) */
function mockCount(d: Date) {
  const n = Math.sin(d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate()) * 10000
  const r = n - Math.floor(n)
  return r < 0.35 ? 0 : r < 0.75 ? 1 : r < 0.92 ? 2 : 3
}

/** 월요일 시작 주 단위로, 이번 주가 마지막 열 */
function buildGrass() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(today.getDate() - ((today.getDay() + 6) % 7) - (WEEKS - 1) * 7)

  const weeks: { date: Date; count: number; future: boolean }[][] = []
  const months: { col: number; label: string }[] = []
  for (let w = 0; w < WEEKS; w++) {
    const col = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(start)
      date.setDate(start.getDate() + w * 7 + d)
      const future = date > today
      const count = future ? 0 : mockCount(date)
      col.push({ date, count, future })
      if (date.getDate() === 1) months.push({ col: w, label: MONTHS[date.getMonth()] })
    }
    weeks.push(col)
  }

  // 연속 일수: 오늘부터 거꾸로, 답변이 없는 날에서 멈춤 (오늘 아직 안 했으면 어제부터)
  // TODO: 서버에서 KST 기준으로 계산, 매주 받는 사용자는 주 단위
  const day = new Date(today)
  if (mockCount(day) === 0) day.setDate(day.getDate() - 1)
  let streak = 0
  for (; mockCount(day) > 0; day.setDate(day.getDate() - 1)) streak++

  // 전체 답변 수 (잔디 기간 안)
  const total = weeks.flat().reduce((sum, d) => sum + d.count, 0)

  return { weeks, months, streak, total }
}

function AnswerGrass() {
  const scroller = useRef<HTMLDivElement>(null)

  const { weeks, months, streak, total } = useMemo(() => buildGrass(), [])

  // 좁은 화면에서는 최근(오른쪽)부터 보이게
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  return (
    <section aria-labelledby="grass-title" className="mt-10">
      {/* 연속 일수는 제목 바로 옆에 붙여 한 덩어리로 읽히게 */}
      <div className="flex items-baseline gap-2">
        <h2 id="grass-title" className="text-[15px] font-medium">
          답변 기록
        </h2>
        <p className="text-[13px] text-mute tabular-nums">
          {total}개 답변, {streak}일째 이어가는 중
        </p>
      </div>

      <div className="mt-3 rounded-2xl border border-line p-4 md:p-5">
        <div ref={scroller} className="overflow-x-auto [scrollbar-width:none]">
          {/* 1열: 요일 라벨(가로 스크롤해도 고정), 2열~: 주. 칸은 폭에 맞춰 늘어나되 최소 10px */}
          <div
            className="grid gap-[3px]"
            style={{ minWidth: `calc(28px + ${WEEKS} * 13px)`, gridTemplateColumns: `28px repeat(${WEEKS}, minmax(10px, 1fr))`, gridTemplateRows: `auto repeat(7, auto)` }}
          >
            <span className="sticky left-0 z-[1] bg-ink" style={{ gridRow: 1, gridColumn: 1 }} />
            {/* 폭 0: 라벨 글자가 칸 너비를 늘리지 않게 */}
            {months.map((m) => (
              <span
                key={`${m.col}-${m.label}`}
                className="mb-1.5 w-0 text-[11px] whitespace-nowrap text-mute"
                style={{ gridRow: 1, gridColumn: m.col + 2 }}
              >
                {m.label}
              </span>
            ))}

            {DAY_LABELS.map((l, i) => (
              <span
                key={i}
                className="sticky left-0 z-[1] flex items-center bg-ink text-[11px] leading-none text-mute"
                style={{ gridRow: i + 2, gridColumn: 1 }}
              >
                {l}
              </span>
            ))}

            {weeks.map((col, w) =>
              col.map(({ date, count, future }, d) => (
                <span
                  key={date.getTime()}
                  title={future ? undefined : `${date.getMonth() + 1}월 ${date.getDate()}일 · 답변 ${count}개`}
                  className={`aspect-square rounded-[3px] ${future ? 'bg-transparent' : LEVEL_CLASS[count]}`}
                  style={{ gridRow: d + 2, gridColumn: w + 2 }}
                />
              )),
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-mute">
          Less
          {LEVEL_CLASS.map((c) => (
            <span key={c} className={`h-2.5 w-2.5 rounded-[3px] ${c}`} />
          ))}
          More
        </div>
      </div>
    </section>
  )
}
