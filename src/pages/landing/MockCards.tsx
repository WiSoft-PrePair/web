import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import logoMark from '../../assets/brand/logo-mark.png'

/**
 * 랜딩 'HOW IT WORKS'에 쓰는 서비스 장면 목업. 화면에 들어오면 스스로 움직인다.
 * 실제 기능을 근거로 만든다: 직무 맞춤 질문 알림(매일·매주, 오전 8시), 텍스트·화상 면접(AI 면접관 음성),
 * 답변별 점수·피드백(잘한 점/부족한 점/개선 방향)과 기록.
 * 카드 안에서만 색을 쓴다: 브랜드 라임 + 보조색(보라·하늘·주황).
 */

const frame = '@container relative aspect-[4/3] w-full md:aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-ink-2'
const EASE = [0.22, 1, 0.36, 1] as const
const LIME = '#e1ff6b'
const VIOLET = '#8b7bff'
const SKY = '#6cc7ff'
const AMBER = '#ffb547'
const TOSS = '#3182f6'

/**
 * 카드 폭에 비례하는 크기. 기준은 데스크톱 카드 폭 655px(1440 화면), min은 좁은 화면에서의 최소값.
 * 글자·여백을 px로 고정하면 카드 폭이 바뀔 때 휴대폰(%)과 비율이 어긋나서 요소가 밀린다.
 */
const cq = (px: number, min = 0) => `max(${min}px, ${(px / 6.55).toFixed(3)}cqw)`

/** 카드가 화면에 들어왔는지 (한 번 들어오면 계속 true) */
function useActive<T extends Element>() {
  const ref = useRef<T>(null)
  const inView = useInView(ref, { once: true, margin: '-15%' })
  return [ref, inView] as const
}

/** 일정 간격으로 1씩 오르는 카운터. 화면 밖이거나 '동작 줄이기'면 멈춘다 */
function useTicker(active: boolean, ms: number) {
  const reduced = useReducedMotion()
  const [t, setT] = useState(0)
  useEffect(() => {
    if (!active || reduced) return
    const id = window.setInterval(() => setT((v) => v + 1), ms)
    return () => window.clearInterval(id)
  }, [active, reduced, ms])
  return t
}

/** 카드 배경에서 천천히 떠다니는 색 번짐 (transform만 움직여서 가볍다) */
function Glow({ color, className, delay = 0 }: { color: string; className: string; delay?: number }) {
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{ background: `radial-gradient(closest-side, ${color}, transparent)` }}
      animate={{ x: ['-6%', '6%', '-6%'], y: ['4%', '-4%', '4%'], scale: [1, 1.08, 1] }}
      transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  )
}

/* ───────── 01 · 직무 맞춤 질문 알림 ───────── */

// 모든 직군 대상: 희망 직무 칸이 여러 직군을 번갈아 입력한다
const JOBS = ['백엔드 개발자', '마케터', 'UX 디자이너', '간호사', '회계 담당자']
const HOLD = 18 // 다 쓴 뒤 머무는 틱 수

/** 틱 수로부터 현재 입력 중인 글자를 계산 (쓰기 → 머물기 → 지우기 → 다음 직무) */
function typed(t: number) {
  const cycle = JOBS.map((w) => w.length * 2 + HOLD)
  const total = cycle.reduce((a, b) => a + b, 0)
  let r = t % total
  let i = 0
  while (r >= cycle[i]) r -= cycle[i++]
  const word = JOBS[i]
  const n = r < word.length ? r + 1 : r < word.length + HOLD ? word.length : word.length * 2 + HOLD - r - 1
  return word.slice(0, Math.max(0, n))
}

export function QuestionMock() {
  const [ref, active] = useActive<HTMLDivElement>()
  const [rang, setRang] = useState(false)
  const t = useTicker(active, 90)

  // 들어오고 잠시 뒤 7:59 → 8:00, 그와 함께 알림 도착
  useEffect(() => {
    if (!active) return
    const id = window.setTimeout(() => setRang(true), 900)
    return () => window.clearTimeout(id)
  }, [active])

  const settings = [
    { label: '알림 채널', value: '이메일 · 카카오톡' },
    { label: '희망 직무', value: null },
    { label: '발송 주기', value: '매일 · 매주' },
    { label: '발송 시간', value: '08:00 AM' },
  ]

  return (
    // 밝은 카드 (랜딩 밝은 톤): 휴대폰만 어둡게, 강조는 토스 파랑
    <div ref={ref} className={`${frame} bg-[#f4f7fb]`}>
      <Glow color="rgba(49,130,246,0.16)" className="-bottom-[30%] -left-[10%] h-[90%] w-[60%]" />
      <Glow color="rgba(139,123,255,0.14)" className="-top-[30%] right-[-10%] h-[90%] w-[60%]" delay={2} />

      {/* 휴대폰: 왼쪽, 카드 아래로 잘려 나간다 */}
      <div
        className="absolute top-[9%] left-[8%] aspect-[9/19] w-[38%] overflow-hidden border-[#2b2b2b] bg-[linear-gradient(180deg,#232323,#0e0e0e)] text-white shadow-[0_24px_60px_-24px_rgba(16,24,40,0.45)]"
        style={{ borderWidth: cq(6, 4), borderRadius: cq(40, 22) }}
      >
        {/* 알림이 오면 화면이 켜지듯 밝아진다 */}
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(90%_60%_at_50%_0%,rgba(49,130,246,0.45),rgba(139,123,255,0.14)_60%,transparent)]"
          initial={{ opacity: 0.25 }}
          animate={{ opacity: rang ? 1 : 0.25 }}
          transition={{ duration: 1.2, ease: EASE }}
        />
        <div className="relative mx-auto w-[30%] rounded-full bg-black" style={{ marginTop: cq(10.3, 6), height: cq(17.2, 10) }} />
        <p className="relative text-center text-white/70" style={{ marginTop: cq(13.8, 6), fontSize: cq(10.3, 8) }}>
          11월 5일 수요일
        </p>
        <div className="relative overflow-hidden text-center font-display leading-none font-semibold tracking-tight" style={{ fontSize: cq(55, 26), height: '1em' }}>
          <motion.div animate={{ y: rang ? '-1em' : '0em' }} transition={{ duration: 0.6, ease: EASE }}>
            <p style={{ height: '1em' }}>7:59</p>
            <p style={{ height: '1em' }}>8:00</p>
          </motion.div>
        </div>

        <div className="relative" style={{ margin: `${cq(44, 14)} ${cq(16, 8)} 0` }}>
          <motion.div
            className="absolute inset-x-[6%] h-full rounded-2xl bg-white/[0.06]"
            style={{ bottom: `calc(-1 * ${cq(6.9, 4)})` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: rang ? 1 : 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          />
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.92 }}
            animate={rang ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -24, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.25 }}
            className="relative bg-white/[0.14] backdrop-blur-md"
            style={{ padding: `${cq(15, 8)} ${cq(15, 8)} ${cq(16, 9)}`, borderRadius: cq(15.5, 10) }}
          >
            <div className="flex items-center" style={{ gap: cq(6.9, 4) }}>
              {/* 앱 아이콘: 흰 칸 안 로고 마크 */}
              <span className="grid place-items-center bg-white" style={{ width: cq(24.1, 14), height: cq(24.1, 14), borderRadius: cq(6.9, 4) }}>
                <img src={logoMark} alt="" style={{ width: '72%', height: '72%' }} />
              </span>
              <span className="font-semibold" style={{ fontSize: cq(12, 9) }}>
                PrePair
              </span>
              <span className="ml-auto text-white/60" style={{ fontSize: cq(10.3, 8) }}>
                지금
              </span>
            </div>
            <p className="font-semibold" style={{ marginTop: cq(10, 5), fontSize: cq(12, 9) }}>
              오늘의 질문이 도착했어요
            </p>
            <p className="leading-relaxed text-white/70" style={{ fontSize: cq(11.2, 9), marginTop: cq(3, 1) }}>
              최근에 가장 몰입해서 해낸 일은 무엇이었나요?
            </p>
          </motion.div>
        </div>
      </div>

      {/* 오른쪽: 질문 설정 */}
      <div className="absolute inset-y-0 right-[8%] left-[54%] flex flex-col justify-center" style={{ gap: cq(8, 4) }}>
        {settings.map((it, i) => {
          const accent = it.value === null
          return (
            <motion.div
              key={it.label}
              initial={{ opacity: 0, x: 14 }}
              animate={active ? { opacity: 1, x: 0 } : { opacity: 0, x: 14 }}
              transition={{ duration: 0.7, delay: 0.3 + i * 0.12, ease: EASE }}
              className="relative border backdrop-blur-sm"
              style={{
                padding: `${cq(11, 5)} ${cq(16, 7)}`,
                borderRadius: cq(12, 7),
                borderColor: accent ? 'rgba(49,130,246,0.5)' : 'rgba(16,24,40,0.06)',
                background: accent ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
                boxShadow: accent ? '0 8px 28px -10px rgba(49,130,246,0.45)' : '0 1px 2px rgba(16,24,40,0.04)',
              }}
            >
              <p className="text-mute" style={{ fontSize: cq(11, 8) }}>
                {it.label}
              </p>
              <p className="font-medium text-paper" style={{ fontSize: cq(15, 9), marginTop: cq(2, 1), color: accent ? TOSS : undefined }}>
                {accent ? (
                  <>
                    {typed(t)}
                    <motion.span
                      aria-hidden
                      className="ml-px inline-block align-[-0.1em]"
                      style={{ width: 2, height: '1em', background: TOSS }}
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
                    />
                  </>
                ) : (
                  it.value
                )}
              </p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/* ───────── 02 · 텍스트 면접과 화상 면접 ───────── */

const AI_QUESTION = '최근에 가장 몰입해서 해낸 일은 무엇이었나요?'
const TURN = 70 // 한 차례(면접관 → 나)에 걸리는 틱 수 (틱 = 90ms)

export function AnswerMock() {
  const [ref, active] = useActive<HTMLDivElement>()
  const t = useTicker(active, 90)
  const phase = t % TURN
  const aiTalking = phase < TURN / 2
  const caption = aiTalking ? AI_QUESTION.slice(0, Math.min(AI_QUESTION.length, phase + 1)) : AI_QUESTION
  const seconds = 42 + Math.floor((t * 90) / 1000)
  const rec = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  return (
    <div ref={ref} className={`${frame} bg-[radial-gradient(80%_80%_at_50%_30%,#232032,#111)]`}>
      <Glow color="rgba(139,123,255,0.28)" className="-top-[20%] left-[10%] h-[80%] w-[60%]" />
      <Glow color="rgba(108,199,255,0.18)" className="-bottom-[30%] right-[0%] h-[80%] w-[55%]" delay={3} />

      {/* 나 (실루엣): 내 차례면 초록 테두리가 숨쉰다 */}
      <svg viewBox="0 0 160 100" className="absolute inset-x-0 bottom-0 mx-auto h-[74%]" aria-hidden>
        <defs>
          <linearGradient id="me-ring" x1="0" x2="1">
            <stop offset="0" stopColor={LIME} />
            <stop offset="1" stopColor={SKY} />
          </linearGradient>
        </defs>
        <circle cx="80" cy="38" r="17" fill="#2c2a36" />
        <path d="M38 100c2-24 20-38 42-38s40 14 42 38z" fill="#2c2a36" />
        <motion.circle
          cx="80"
          cy="38"
          r="20"
          fill="none"
          stroke="url(#me-ring)"
          strokeWidth="1.4"
          animate={{ opacity: !aiTalking ? [0.4, 1, 0.4] : 0, scale: !aiTalking ? [1, 1.06, 1] : 1 }}
          transition={{ duration: 1.4, repeat: Infinity }}
          style={{ originX: '80px', originY: '38px' }}
        />
      </svg>

      {/* 녹화 표시 */}
      <div
        className="absolute flex items-center rounded-full bg-black/50 text-paper tabular-nums"
        style={{ top: cq(18, 10), left: cq(18, 10), gap: cq(6, 4), padding: `${cq(5, 3)} ${cq(12, 8)}`, fontSize: cq(12, 9) }}
      >
        <span className="animate-pulse rounded-full bg-red-500" style={{ width: cq(7, 5), height: cq(7, 5) }} />
        REC {rec}
      </div>

      {/* 답변 방식 탭 */}
      <div className="absolute left-1/2 flex -translate-x-1/2 rounded-full bg-white/[0.07]" style={{ top: cq(18, 10), padding: cq(3, 2), fontSize: cq(12, 9) }}>
        <span className="text-mute" style={{ padding: `${cq(4, 3)} ${cq(14, 9)}` }}>
          텍스트
        </span>
        <span className="rounded-full bg-paper font-medium text-ink" style={{ padding: `${cq(4, 3)} ${cq(14, 9)}` }}>
          화상 면접
        </span>
      </div>

      {/* AI 면접관 타일: 말하는 동안 테두리가 빛난다 */}
      <motion.div
        className="absolute flex aspect-video w-[24%] flex-col items-center justify-center border bg-[#1b1a24]"
        style={{ top: cq(60, 38), right: cq(18, 10), gap: cq(8, 4), borderRadius: cq(12, 8) }}
        animate={{
          borderColor: aiTalking ? 'rgba(225,255,107,0.8)' : 'rgba(255,255,255,0.12)',
          boxShadow: aiTalking ? '0 0 28px -6px rgba(225,255,107,0.55)' : '0 0 0 0 rgba(0,0,0,0)',
        }}
        transition={{ duration: 0.4 }}
      >
        <Bars on={aiTalking} color={LIME} height={cq(26, 14)} />
        <span className="text-soft" style={{ fontSize: cq(11, 8) }}>
          AI 면접관
        </span>
      </motion.div>

      {/* 자막: 면접관 차례엔 질문이 타이핑, 내 차례엔 답변 중 */}
      <div className="absolute inset-x-0 flex justify-center" style={{ bottom: cq(72, 42) }}>
        <div className="flex items-center rounded-lg bg-black/55 backdrop-blur-sm" style={{ gap: cq(8, 5), padding: `${cq(6, 4)} ${cq(12, 8)}`, fontSize: cq(12, 9), maxWidth: '78%' }}>
          {aiTalking ? (
            <span className="truncate text-paper">{caption}</span>
          ) : (
            <>
              <Bars on color={SKY} height={cq(12, 8)} count={4} />
              <span style={{ color: SKY }}>답변하는 중</span>
            </>
          )}
        </div>
      </div>

      {/* 컨트롤 바 */}
      <div className="absolute left-1/2 flex -translate-x-1/2" style={{ bottom: cq(18, 10), gap: cq(10, 6) }}>
        <CtrlButton>
          <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z M5 11a7 7 0 0 0 14 0 M12 18v3" />
        </CtrlButton>
        <CtrlButton>
          <path d="M3 7h12v10H3z M15 10l6-3v10l-6-3" />
        </CtrlButton>
        <CtrlButton danger>
          <path d="M6 6l12 12 M18 6L6 18" />
        </CtrlButton>
      </div>
    </div>
  )
}

/** 음성 막대: 켜지면 오르내리고, 꺼지면 낮게 가라앉는다 */
function Bars({ on, color, height, count = 6 }: { on: boolean; color: string; height: string; count?: number }) {
  const hs = [0.5, 0.9, 0.6, 1, 0.7, 0.4].slice(0, count)
  return (
    <div className="flex items-center" style={{ height, gap: cq(3, 2) }}>
      {hs.map((h, i) => (
        <motion.span
          key={i}
          className="rounded-full"
          style={{ width: cq(3, 2), height: '100%', originY: 0.5, background: color }}
          animate={on ? { scaleY: [h * 0.35, h, h * 0.5] } : { scaleY: 0.18 }}
          transition={on ? { duration: 0.8, repeat: Infinity, repeatType: 'mirror', delay: i * 0.1 } : { duration: 0.3 }}
        />
      ))}
    </div>
  )
}

function CtrlButton({ children, danger = false }: { children: ReactNode; danger?: boolean }) {
  return (
    <span className={`grid place-items-center rounded-full ${danger ? 'bg-red-500' : 'bg-white/10'}`} style={{ width: cq(40, 24), height: cq(40, 24) }}>
      <svg viewBox="0 0 24 24" style={{ width: cq(18, 12), height: cq(18, 12) }} fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </span>
  )
}

/* ───────── 03 · 답변마다 점수와 피드백 ───────── */

const OPENED = { q: '최근에 가장 몰입해서 해낸 일은 무엇이었나요?', meta: '11.05 · 오늘의 질문 · 3번째 답변', score: 82 }
const FEEDBACK = [
  { label: '잘한 점', color: LIME, body: '상황과 내 역할이 분명하게 드러났어요.' },
  { label: '부족한 점', color: AMBER, body: '결과를 보여 줄 숫자가 빠져 있어요.' },
  { label: '개선 방향', color: SKY, body: '성과를 수치 하나로 마무리해 보세요.' },
]
const TREND = [58, 66, 71, 74, 82] // 같은 질문에 다시 답할수록 오른 점수
const CLOSED = [
  { q: '동료와 의견이 달랐을 때, 어떻게 풀어 갔나요?', meta: '11.04 · 오늘의 질문 · 2번째 답변', score: 74 },
  { q: '신입 화상 면접 · 5문항', meta: '11.02 · 화상 면접', score: 71 },
]

export function FeedbackMock() {
  const [ref, active] = useActive<HTMLDivElement>()
  const fade = (i: number) => ({
    initial: { opacity: 0, y: 10 },
    animate: active ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 },
    transition: { duration: 0.6, delay: 0.15 + i * 0.12, ease: EASE },
  })

  return (
    <div ref={ref} className={`${frame} flex flex-col justify-center bg-[#141414]`} style={{ padding: `0 ${cq(40, 14)}` }}>
      <Glow color="rgba(108,199,255,0.16)" className="-top-[30%] -right-[10%] h-[90%] w-[60%]" />
      <Glow color="rgba(225,255,107,0.12)" className="-bottom-[40%] -left-[10%] h-[90%] w-[55%]" delay={2.5} />

      <div className="relative flex items-end justify-between">
        <p className="font-medium" style={{ fontSize: cq(15, 11) }}>
          답변 기록
        </p>
        <Trend active={active} />
      </div>

      {/* 펼친 기록: 점수 게이지 + 피드백 */}
      <motion.div {...fade(0)} className="relative border border-white/[0.06] bg-white/[0.04]" style={{ marginTop: cq(14, 7), padding: `${cq(18, 9)} ${cq(20, 10)}`, borderRadius: cq(14, 9) }}>
        <div className="flex items-center justify-between" style={{ gap: cq(16, 8) }}>
          <div className="min-w-0">
            <p className="truncate text-paper" style={{ fontSize: cq(15, 11) }}>
              {OPENED.q}
            </p>
            <p className="text-mute" style={{ fontSize: cq(12, 9), marginTop: cq(4, 2) }}>
              {OPENED.meta}
            </p>
          </div>
          <ScoreRing active={active} score={OPENED.score} />
        </div>
        <div className="flex flex-col" style={{ marginTop: cq(14, 7), gap: cq(8, 4) }}>
          {FEEDBACK.map((f, i) => (
            <motion.div key={f.label} {...fade(i + 1)} className="flex items-center" style={{ gap: cq(10, 6), fontSize: cq(12, 9) }}>
              <span className="shrink-0 rounded-full" style={{ width: cq(6, 4), height: cq(6, 4), background: f.color, boxShadow: `0 0 10px ${f.color}` }} />
              <span className="shrink-0" style={{ width: cq(60, 40), color: f.color }}>
                {f.label}
              </span>
              <span className="truncate text-soft">{f.body}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 접힌 기록 */}
      <div className="relative divide-y divide-line" style={{ marginTop: cq(6, 3) }}>
        {CLOSED.map((c, i) => (
          <motion.div key={c.q} {...fade(i + 4)} className="flex items-center justify-between" style={{ gap: cq(16, 8), padding: `${cq(12, 6)} ${cq(20, 10)}` }}>
            <div className="min-w-0">
              <p className="truncate text-soft" style={{ fontSize: cq(14, 10) }}>
                {c.q}
              </p>
              <p className="text-mute" style={{ fontSize: cq(11, 8), marginTop: cq(3, 2) }}>
                {c.meta}
              </p>
            </div>
            <p className="shrink-0 font-display leading-none font-semibold text-mute" style={{ fontSize: cq(20, 13) }}>
              {c.score}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/** 원형 점수 게이지: 링이 차오르며 숫자가 0에서 올라간다 */
function ScoreRing({ active, score }: { active: boolean; score: number }) {
  const value = useMotionValue(0)
  const shown = useTransform(value, (v) => Math.round(v))
  useEffect(() => {
    if (!active) return
    const c = animate(value, score, { duration: 1.6, delay: 0.4, ease: EASE })
    return () => c.stop()
  }, [active, score, value])
  const progress = useTransform(value, (v) => v / 100)

  return (
    <div className="relative shrink-0" style={{ width: cq(64, 40), height: cq(64, 40) }}>
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="score-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={LIME} />
            <stop offset="1" stopColor={SKY} />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        <motion.circle cx="32" cy="32" r="27" fill="none" stroke="url(#score-ring)" strokeWidth="5" strokeLinecap="round" style={{ pathLength: progress }} />
      </svg>
      <motion.span className="absolute inset-0 grid place-items-center font-display font-semibold text-paper tabular-nums" style={{ fontSize: cq(20, 13) }}>
        {shown}
      </motion.span>
    </div>
  )
}

/** 최근 점수 추이: 선이 왼쪽부터 그려지고 마지막 점이 빛난다 */
function Trend({ active }: { active: boolean }) {
  const W = 120
  const H = 32
  const min = 50
  const max = 90
  const pts = TREND.map((s, i) => [(i / (TREND.length - 1)) * (W - 8) + 4, H - 4 - ((s - min) / (max - min)) * (H - 8)])
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const [lx, ly] = pts[pts.length - 1]
  return (
    <div className="flex items-end" style={{ gap: cq(8, 5) }}>
      <span className="text-mute" style={{ fontSize: cq(11, 8) }}>
        점수 추이
      </span>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: cq(120, 70), height: cq(32, 19) }} aria-hidden>
        <defs>
          <linearGradient id="trend-line" x1="0" x2="1">
            <stop offset="0" stopColor={VIOLET} />
            <stop offset="1" stopColor={LIME} />
          </linearGradient>
        </defs>
        <motion.path
          d={d}
          fill="none"
          stroke="url(#trend-line)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: active ? 1 : 0 }}
          transition={{ duration: 1.4, delay: 0.3, ease: EASE }}
        />
        <motion.circle cx={lx} cy={ly} r="3" fill={LIME} initial={{ opacity: 0, scale: 0 }} animate={active ? { opacity: 1, scale: [0, 1.6, 1] } : {}} transition={{ duration: 0.6, delay: 1.6 }} />
      </svg>
    </div>
  )
}
