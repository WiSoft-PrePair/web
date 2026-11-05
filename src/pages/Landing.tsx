import { motion, useAnimationFrame, useMotionValue, useScroll, useTransform } from 'motion/react'
import { type ReactNode, useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router'
import AnimatedMeshBackground from '../components/AnimatedMeshBackground'
import Header from '../components/Header'
import RevealText from '../components/RevealText'
import { useSmoothScroll } from '../components/useSmoothScroll'
import { AnswerMock, FeedbackMock, QuestionMock } from './landing/MockCards'

// 크기·간격은 buttersoft.io 실측값 기준 (index.css의 --gutter, --section-space 참고)
const EASE = [0.22, 1, 0.36, 1] as const

// tags는 실제 기능 근거: 질문 발송(이메일·카카오톡 알림, 매일/매주 선택, 오전 8시 예정), 텍스트 답변, AI 면접관 음성(TTS), 화상 면접 재시도, 스피치/비언어 분석
const STEPS: { no: string; title: string; desc: string; tags: string[]; mock: ReactNode }[] = [
  { no: '01', title: '직무 맞춤 질문 알림', desc: '희망 직무를 적어 두면, 그에 맞춘 면접 질문을 알림으로 보내 드려요.', tags: ['알림', '직무 맞춤 질문', '매일 · 매주 선택'], mock: <QuestionMock /> },
  { no: '02', title: '텍스트 면접과 화상 면접', desc: '오늘의 질문은 글로, 화상 면접은 AI 면접관과 말로 답해요.', tags: ['텍스트 면접', 'AI 면접관 음성', '다시 답변하기'], mock: <AnswerMock /> },
  { no: '03', title: '답변마다 점수와 피드백', desc: '모든 답변의 점수와 피드백이 쌓이고, 언제든 다시 찾아볼 수 있어요.', tags: ['점수 리포트', '잘한 점 · 부족한 점', '기록 검색'], mock: <FeedbackMock /> },
]

const QUESTIONS = [
  '본인의 강점은 무엇인가요?',
  '가장 어려웠던 협업 경험은?',
  'REST와 GraphQL을 비교해 주세요',
  '실패에서 배운 점을 말해 주세요',
  '트랜잭션 격리 수준을 설명해 주세요',
  '우리 회사에 지원한 이유는?',
  '최근 해결한 가장 어려운 버그는?',
  '5년 뒤 어떤 개발자가 되고 싶나요?',
]

export default function Landing() {
  useSmoothScroll()

  return (
    <div className="bg-ink text-paper">
      <Header />
      <Hero />
      <Statement />
      <HowItWorks />
      <Why />
      <QuestionMarquee />
      <Cta />
      <Footer />
    </div>
  )
}

/** 글자가 부모 너비를 정확히 채우도록 font-size를 맞춘다 */
function useFitText<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    const el = ref.current
    const parent = el?.parentElement
    if (!el || !parent) return
    const fit = () => {
      el.style.fontSize = '100px'
      const ratio = parent.clientWidth / el.scrollWidth
      el.style.fontSize = `${100 * ratio}px`
    }
    fit()
    document.fonts.ready.then(fit)
    const ro = new ResizeObserver(fit)
    ro.observe(parent)
    return () => ro.disconnect()
  }, [])
  return ref
}

function Hero() {
  const ref = useRef<HTMLElement>(null)
  const wordRef = useFitText<HTMLHeadingElement>()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '-45%'])
  const fade = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section ref={ref} className="sticky top-0 flex min-h-[max(80svh,627px)] flex-col overflow-hidden px-[var(--gutter)] pt-24 pb-10 xl:min-h-[max(80svh,720px)] xl:pt-[110px]">
      <div className="w-full">
        <motion.h1
          ref={wordRef}
          style={{ y }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: EASE }}
          className="inline-block font-display leading-[0.8] font-semibold tracking-[-0.04em] whitespace-nowrap"
        >
          PREPAIR
        </motion.h1>
      </div>
      <motion.div style={{ opacity: fade }} className="mt-8 flex flex-col gap-1 sm:flex-row sm:justify-between font-display text-sm tracking-[-0.01em] text-soft xl:mt-[60px] xl:text-xl">
        <p>YOUR AI INTERVIEW PARTNER</p>
        <p className="sm:text-right">FROM QUESTION TO FEEDBACK</p>
      </motion.div>
      <motion.p style={{ opacity: fade }} className="mt-auto text-center font-display text-sm tracking-[-0.01em] text-soft xl:text-xl">
        (SCROLL DOWN) ↓
      </motion.p>
    </section>
  )
}

function Statement() {
  return (
    <section className="relative z-10 flex min-h-[593px] items-start overflow-hidden px-[var(--gutter)] pt-[100px] pb-[60px] xl:min-h-[1083px] xl:pt-[386px] xl:pb-[var(--section-space)]">
      <AnimatedMeshBackground />
      <div className="relative w-full">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 1, ease: EASE }}
          className="font-display text-2xl leading-[1.2] font-medium tracking-[-0.01em] xl:text-[3.333vw]"
        >
          PREPAIR IS YOUR AI INTERVIEW PARTNER
          <br className="hidden xl:block" /> THAT ASKS, LISTENS, AND COACHES YOU
          <br className="hidden xl:block" /> UNTIL THE REAL INTERVIEW FEELS FAMILIAR.
        </motion.h2>
        <p className="mt-6 max-w-[560px] font-display text-sm xl:mt-7 leading-[1.36] tracking-[-0.01em] text-soft xl:text-base">
          One question a day, answered out loud.
          <br />
          Practice that becomes confidence on the day.
        </p>
        <div className="mt-16 flex flex-col gap-1.5 text-sm leading-[1.4] tracking-[-0.01em] xl:mt-[clamp(72px,6.25vw,120px)] xl:ml-auto xl:w-fit xl:text-base xl:[&>p]:whitespace-nowrap">
          <p>PrePair는 매일 아침 직무에 맞는 질문을 보내고, 당신의 답을 듣는 AI 면접 파트너입니다.</p>
          <p>혼자서는 막막했던 준비를, 하루 한 문제씩 소리 내어 답해 보는 습관으로 바꿉니다.</p>
          <p>미리 말해 본 경험이 쌓일수록, 면접장의 질문도 더 이상 처음 듣는 질문이 아닙니다.</p>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="how" className="relative z-10 bg-ink px-[var(--gutter)] py-[60px] xl:py-[var(--section-space)]">
      <div className="flex items-end justify-between">
        <h2 className="font-display text-2xl leading-[1.2] font-medium tracking-[-0.01em] xl:text-[3.333vw]">HOW IT WORKS</h2>
        <p className="hidden text-right font-display text-base leading-[1.36] text-mute xl:block">
          ASK. ANSWER.
          <br />
          REVIEW. REPEAT.
        </p>
      </div>
      <div className="mt-12 space-y-20 xl:mt-[clamp(72px,6.25vw,120px)] xl:space-y-[120px]">
        {STEPS.map((step, i) => (
          <Step key={step.no} {...step} reverse={i % 2 === 1} />
        ))}
      </div>
    </section>
  )
}

function Step({ no, title, desc, tags, mock, reverse }: (typeof STEPS)[number] & { reverse: boolean }) {
  // 박스와 텍스트의 아랫선이 항상 맞도록 박스만 따로 움직이는 패럴랙스는 두지 않는다
  return (
    <div className={`flex flex-col gap-14 xl:items-stretch xl:justify-between xl:gap-10 ${reverse ? 'xl:flex-row-reverse' : 'xl:flex-row'}`}>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 1, ease: EASE }}
        className="w-full xl:w-[54%]"
      >
        {mock}
      </motion.div>
      <div className={`flex flex-col xl:w-[40%] ${reverse ? 'xl:items-end xl:text-right' : ''}`}>
        <div className="xl:mt-auto">
          <span className="font-display text-[15px] text-lime">{no}</span>
          <h3 className="mt-1 text-lg leading-[1.4] font-medium xl:text-[22px]">{title}</h3>
          <p className="mt-1 text-sm leading-[1.4] text-balance text-mute xl:text-[15px]">{desc}</p>
          <ul className={`mt-4 flex flex-wrap gap-2 ${reverse ? 'xl:justify-end' : ''}`}>
            {tags.map((t) => (
              <li key={t} className="rounded-full border border-line px-3 py-1.5 text-xs text-soft">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function Why() {
  return (
    <section className="relative z-10 bg-ink px-[var(--gutter)] py-[100px] xl:py-[var(--section-space)]">
      <RevealText
        className="mx-auto max-w-[1060px] text-center text-balance text-xl leading-[1.4] font-medium tracking-[-0.01em] xl:text-[33px]"
        text="면접장에는 혼자 들어가지만, 준비까지 혼자 할 필요는 없습니다."
      />
      {/* 슬로건: 라임색 PRE + PAIR = PREPAIR */}
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: 1, ease: EASE }}
        className="mt-10 text-center font-display text-3xl leading-[1.1] font-medium tracking-[-0.02em] xl:mt-16 xl:text-[66px]"
      >
        <span className="text-lime">PRE</span>PARE WITH YOUR <span className="text-lime">PAIR</span>.
      </motion.p>
    </section>
  )
}

function QuestionMarquee() {
  const items = [...QUESTIONS, ...QUESTIONS]
  return (
    <section className="relative z-10 overflow-hidden bg-ink pb-[60px] xl:pb-[var(--section-space)]" aria-label="질문 예시">
      <div className="animate-marquee flex w-max gap-4">
        {items.map((q, i) => (
          <span
            key={i}
            aria-hidden={i >= QUESTIONS.length}
            className={`rounded-full border px-7 py-4 text-sm whitespace-nowrap xl:text-base ${
              i % 3 === 1 ? 'border-lime bg-lime text-ink' : 'border-line text-soft'
            }`}
          >
            Q. {q}
          </span>
        ))}
      </div>
    </section>
  )
}

function Cta() {
  return (
    <section className="relative z-10 flex min-h-[322px] flex-col items-center overflow-hidden bg-ink px-[var(--gutter)] pt-[100px] pb-20 text-center xl:min-h-[520px] xl:justify-center">
      <Rings />
      <div className="relative">
        <h2 className="text-xl leading-[1.4] font-medium xl:text-[33px]">면접 준비, 오늘부터 시작해 볼까요?</h2>
        <p className="mt-2 text-sm leading-[1.4] text-mute xl:text-base">하루 10분이면 충분합니다.</p>
        <Link
          to="/login"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-lime px-8 py-3.5 font-display text-lg font-medium text-black transition-transform duration-300 hover:scale-105 xl:mt-10 xl:text-[22px]"
        >
          START NOW →
        </Link>
      </div>
    </section>
  )
}

const RING_YS = [110, 210, 310, 410]
const RING_RX = 340
const RING_RY = 64

function Rings() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
      <svg viewBox="0 0 720 520" className="w-[min(900px,140vw)]" fill="none">
        {RING_YS.map((cy) => (
          <ellipse key={cy} cx={360} cy={cy} rx={RING_RX} ry={RING_RY} stroke="#2e2e2e" />
        ))}
        <OrbitDot />
      </svg>
    </div>
  )
}

/** 맨 위 링을 따라 도는 라임 점 */
function OrbitDot() {
  const cx = useMotionValue(360 - RING_RX)
  const cy = useMotionValue(RING_YS[0])
  useAnimationFrame((t) => {
    const a = (t / 18000) * Math.PI * 2 + Math.PI
    cx.set(360 + Math.cos(a) * RING_RX)
    cy.set(RING_YS[0] + Math.sin(a) * RING_RY)
  })
  return <motion.circle cx={cx} cy={cy} r={4} fill="var(--color-lime)" />
}

function Footer() {
  return (
    <footer className="relative z-10 bg-ink px-[var(--gutter)] pt-10 pb-7 xl:py-[clamp(64px,4.167vw,80px)]">
      <div className="flex flex-col justify-between gap-3 border-t border-line pt-8 text-xs leading-[1.4] text-mute xl:flex-row">
        <span className="font-display">
          PREPAIR<span className="text-lime">.</span>
        </span>
        <span className="font-display text-dim">© 2026 PREPAIR. ALL RIGHTS RESERVED.</span>
      </div>
    </footer>
  )
}
