import { motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AppHeader, ThemeRoot } from '../components/AppShell'
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
  { label: '공고 관리', to: '/app/jobs' },
]

/** 가운데에 오늘의 질문, 그 아래 텍스트 바로가기 3개 */
function TodayQuestion() {
  const today = RECORDS[0]

  return (
    <section
      aria-labelledby="today-title"
      className="flex flex-col items-center text-center"
    >
      {/* 영문 표시는 Geist(대문자·넓은 자간), 날짜·태그는 본문 글꼴(Pretendard·기본 자간)으로 나눠 한 줄에 글꼴이 섞이지 않게 */}
      <p className="text-[12px]">
        <span className="font-display font-medium tracking-[0.08em] text-grass">TODAY&apos;S QUESTION</span>
        <span className="ml-1 text-mute">
          · {fullDate(today.date)} · {today.tag}
        </span>
      </p>
      <OneLineTitle id="today-title" text={today.question} />

      <ActionLinks />
    </section>
  )
}

/** 점·알약 움직임: 하나의 스프링으로 이어서 움직여 끊김이 없게 (살짝 늦게 따라오는 정도) */
const PILL_SPRING = { stiffness: 320, damping: 30, mass: 0.7 }

/**
 * 텍스트 바로가기 3개 (| 구분).
 * 마우스가 들어오면 대표색 점이 커서처럼 따라오다가, 버튼 위에서는 알약으로 부드럽게 커져 글자 뒤에 깔린다.
 * 글자색은 알약이 거의 덮었을 때 바뀌도록 살짝 늦게. 터치 기기는 hover가 없으니 글자만 보인다.
 */
function ActionLinks() {
  const navigate = useNavigate()
  const nav = useRef<HTMLElement>(null)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const [active, setActive] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)

  // 목표값(바로 바뀜) → 스프링(따라감). 마우스 이동마다 다시 그리지 않는다.
  const tx = useMotionValue(0)
  const ty = useMotionValue(0)
  const tw = useMotionValue(16)
  const th = useMotionValue(16)
  const x = useSpring(tx, PILL_SPRING)
  const y = useSpring(ty, PILL_SPRING)
  const width = useSpring(tw, PILL_SPRING)
  const height = useSpring(th, PILL_SPRING)

  const setTarget = (nx: number, ny: number, nw: number, nh: number, jump = false) => {
    tx.set(nx)
    ty.set(ny)
    tw.set(nw)
    th.set(nh)
    if (jump) [x, y, width, height].forEach((m, i) => m.jump([nx, ny, nw, nh][i]))
  }
  const toButton = (i: number) => {
    const n = nav.current?.getBoundingClientRect()
    const r = buttons.current[i]?.getBoundingClientRect()
    if (!n || !r) return
    setActive(i)
    setTarget(r.left - n.left - 12, r.top - n.top - 5, r.width + 24, r.height + 10)
  }
  const toPoint = (clientX: number, clientY: number, jump = false) => {
    const n = nav.current?.getBoundingClientRect()
    if (!n) return
    if (active !== null) setActive(null)
    setTarget(clientX - n.left - 8, clientY - n.top - 8, 16, 16, jump)
  }
  const hide = () => {
    setActive(null)
    setVisible(false)
  }

  return (
    <nav
      ref={nav}
      aria-label="바로가기"
      data-cursor-none
      onMouseEnter={(e) => {
        // 들어온 자리에서 바로 나타나게 (이전 위치에서 미끄러져 오지 않게)
        toPoint(e.clientX, e.clientY, true)
        setVisible(true)
      }}
      onMouseMove={(e) => {
        const i = buttons.current.findIndex((b) => b?.contains(e.target as Node))
        if (i >= 0) {
          if (i !== active) toButton(i)
        } else toPoint(e.clientX, e.clientY)
      }}
      onMouseLeave={hide}
      className="relative mt-5 flex items-center justify-center gap-5 px-6 py-2 text-[15px] font-medium"
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 rounded-full bg-grass"
        style={{ x, y, width, height }}
        initial={false}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
      {ACTIONS.map(({ label, to }, i) => (
        <span key={label} className="relative flex items-center gap-5">
          {i > 0 && <span aria-hidden className="h-3.5 w-px bg-line" />}
          <button
            ref={(el) => {
              buttons.current[i] = el
            }}
            type="button"
            onClick={() => navigate(to)}
            onFocus={() => {
              const n = nav.current?.getBoundingClientRect()
              const r = buttons.current[i]?.getBoundingClientRect()
              if (n && r && !visible) setTarget(r.left - n.left - 12, r.top - n.top - 5, r.width + 24, r.height + 10, true)
              setVisible(true)
              toButton(i)
            }}
            onBlur={hide}
            className={`relative py-1 outline-none transition-colors ${active === i ? 'text-(--accent-on) delay-100 duration-300' : 'text-soft duration-200'}`}
          >
            {label}
          </button>
        </span>
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
      className="mt-4 w-[min(1120px,calc(100vw-2*var(--side)))] leading-[1.35] font-semibold text-soft tracking-tight text-balance"
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
        <Link to="/app/answer" className="text-[13px] text-mute transition-colors hover:text-paper">
          View all
        </Link>
      </div>

      <ul className="mt-4 border-t border-line">
        {RECORDS.slice(1).filter((r) => r.score !== undefined).slice(0, 3).map((r) => {
          const pending = r.score === undefined
          return (
            <li key={r.id} className="border-b border-line">
              <Link to={`/app/answer/${r.id}`} className="group flex w-full items-center gap-4 py-3.5 text-left md:gap-6">
                <span className="w-[104px] shrink-0 text-[13px] text-mute tabular-nums">{fullDate(r.date)}</span>
                <span className="w-12 shrink-0 text-[12px] text-mute sm:w-14">{r.tag}</span>
                <span className="min-w-0 flex-1 truncate text-[15px] text-soft transition-colors group-hover:text-paper">{r.question}</span>
                {pending ? (
                  <span className="shrink-0 rounded-full border border-lime px-2.5 py-0.5 text-[12px] text-lime">답변하기</span>
                ) : (
                  <span className="w-8 shrink-0 text-right font-display text-[15px] font-medium text-soft tabular-nums">{r.score}</span>
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

  return { weeks, months, streak }
}

function AnswerGrass() {
  const scroller = useRef<HTMLDivElement>(null)

  const { weeks, months, streak } = useMemo(() => buildGrass(), [])

  // 좁은 화면에서는 최근(오른쪽)부터 보이게
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  return (
    <section aria-labelledby="grass-title" className="mt-10">
      <div className="flex items-baseline justify-between">
        <h2 id="grass-title" className="text-[15px] font-medium">
          답변 기록
        </h2>
        <p className="text-[13px] text-mute">
          Streak <span className="text-lime tabular-nums">{streak}</span>
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-line p-4 md:p-5">
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
