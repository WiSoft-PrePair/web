import { motion, useAnimationFrame, useMotionValue, useScroll, useTransform } from 'motion/react'
import { type ReactNode, useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router'
import AnimatedMeshBackground from '../components/AnimatedMeshBackground'
import Header from '../components/Header'
import RevealText from '../components/RevealText'
import { useSmoothScroll } from '../components/useSmoothScroll'
import { FeedbackScreen, InterviewScreens } from './landing/AppScreens'
import { QuestionMock } from './landing/MockCards'

// 크기·간격은 buttersoft.io 실측값 기준 (index.css의 --gutter, --section-space 참고)
const EASE = [0.22, 1, 0.36, 1] as const

// 단계별 섹션명 + 한 줄 소개
const STEPS: { title: string; desc: string; mock: ReactNode }[] = [
  { title: '직무 맞춤 질문 알림', desc: '희망 직무를 적어 두면, 그에 맞춘 면접 질문을 알림으로 보내 드려요.', mock: <QuestionMock /> },
  { title: '텍스트 면접과 화상 면접', desc: '오늘의 질문은 글로, 화상 면접은 AI 면접관과 말로 답해요.', mock: <InterviewScreens /> },
  { title: '답변마다 점수와 피드백', desc: '모든 답변의 점수와 피드백이 쌓이고, 언제든 다시 찾아볼 수 있어요.', mock: <FeedbackScreen /> },
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
  // 고정하지 않고 함께 올라가되, 큰 글자는 더 느리게(아래로 밀리며) 움직이고 흐려진다 = 시차
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])
  const wordFade = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const fade = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section ref={ref} className="relative flex min-h-[max(min(80svh,56vw),627px)] flex-col overflow-hidden px-[var(--gutter)] pt-24 pb-10 xl:min-h-[max(min(80svh,56vw),720px)] xl:pt-[110px]">
      <motion.div style={{ opacity: wordFade }} className="w-full">
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
      </motion.div>
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
    <section className="relative z-10 flex min-h-[593px] items-start overflow-hidden px-[var(--gutter)] pt-[100px] pb-[60px] xl:min-h-[1083px] xl:pt-[max(386px,calc(100svh_-_max(min(80svh,56vw),720px)_+_40px))] xl:pb-[var(--section-space)]">
      <AnimatedMeshBackground />
      {/* 윗부분만 어둡게: 첫 화면과의 경계선은 남긴다 */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[clamp(200px,30vh,360px)] bg-gradient-to-b from-black/55 via-black/25 to-transparent" />
      <div className="relative w-full">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.9, ease: EASE }}
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
        <div className="mt-16 flex flex-col gap-1.5 text-sm leading-[1.6] tracking-[-0.01em] break-keep xl:mt-[clamp(72px,6.25vw,120px)] xl:mr-[1.4vw] xl:ml-auto xl:w-fit xl:[&>p]:whitespace-nowrap xl:text-base">
          <p>PrePair는 매일 아침 직무에 맞는 면접 질문을 보내고, 글이나 말로 답하며 실제처럼 연습할 수 있게 돕는 AI 면접 파트너입니다.</p>
          <p>답변을 마치면 AI가 좋았던 점과 보완할 점, 더 나은 답변 예시까지 짚어 주고, 그 기록이 쌓여 같은 질문에도 점점 나은 답을 하게 됩니다.</p>
          <p>그렇게 하루 한 문제씩 쌓인 연습 덕분에, 면접장에서 마주한 질문도 더 이상 처음 듣는 질문이 아니게 됩니다.</p>
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
      </div>
      <div className="mt-12 space-y-20 xl:mt-[clamp(72px,6.25vw,120px)] xl:space-y-[120px]">
        {STEPS.map((step, i) => (
          <Step key={step.title} {...step} reverse={i % 2 === 1} />
        ))}
      </div>
    </section>
  )
}

function Step({ title, desc, mock, reverse }: (typeof STEPS)[number] & { reverse: boolean }) {
  // 박스와 텍스트의 아랫선이 항상 맞도록 박스만 따로 움직이는 패럴랙스는 두지 않는다
  return (
    <div className={`flex flex-col gap-10 lg:items-stretch lg:justify-start lg:gap-[3%] ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 1, ease: EASE }}
        className="w-full max-w-[640px] lg:w-[54%] lg:max-w-none"
      >
        {mock}
      </motion.div>
      <div className={`flex flex-col lg:w-[40%] ${reverse ? 'lg:items-end lg:text-right' : ''}`}>
        <div className="lg:mt-auto lg:mb-[6px]">
          <h3 className="text-lg leading-[1.4] font-medium xl:text-[22px]">{title}</h3>
          <p className="mt-2 text-sm leading-[1.5] text-balance text-mute xl:text-[15px]">{desc}</p>
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
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.9, ease: EASE }}
        className="mt-6 text-center font-display text-3xl leading-[1.1] font-medium tracking-[-0.02em] xl:mt-9 xl:text-[66px]"
      >
        PRE<span className="text-mute">PARE WITH YOUR</span> PAIR<span className="text-mute">.</span>
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
              i % 3 === 1 ? 'border-paper bg-paper text-ink' : 'border-line text-soft'
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
        <p className="mt-2 text-sm leading-[1.4] text-mute xl:text-base">가입하면 매일 아침, 직무에 맞는 질문을 보내 드려요.</p>
        <Link
          to="/login"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-paper px-8 py-3.5 font-display text-lg font-medium text-ink transition-transform duration-300 hover:scale-105 xl:mt-10 xl:text-[22px]"
        >
          START NOW
          <svg viewBox="0 0 24 24" className="h-[0.8em] w-[0.8em]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m9 5 7 7-7 7" />
          </svg>
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

/** 맨 위 링을 따라 도는 흰 점 */
function OrbitDot() {
  const cx = useMotionValue(360 - RING_RX)
  const cy = useMotionValue(RING_YS[0])
  useAnimationFrame((t) => {
    const a = (t / 18000) * Math.PI * 2 + Math.PI
    cx.set(360 + Math.cos(a) * RING_RX)
    cy.set(RING_YS[0] + Math.sin(a) * RING_RY)
  })
  return <motion.circle cx={cx} cy={cy} r={4} fill="var(--color-paper)" />
}

function Footer() {
  return (
    <footer className="relative z-10 bg-ink px-[var(--gutter)] pt-10 pb-7 xl:py-[clamp(64px,4.167vw,80px)]">
      <div className="flex flex-col justify-between gap-3 border-t border-line pt-8 text-xs leading-[1.4] text-mute xl:flex-row">
        <span className="font-display">
          PREPAIR.
        </span>
        <span className="font-display text-dim">© 2026 PREPAIR. ALL RIGHTS RESERVED.</span>
      </div>
    </footer>
  )
}
