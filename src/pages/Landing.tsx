import { motion, useAnimationFrame, useMotionValue, useScroll, useTransform } from 'motion/react'
import { type ReactNode, useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router'
import logoMark from '../assets/brand/logo-mark.png'
import { ThemeRoot } from '../components/AppShell'
import { BrandLogo } from '../components/auth'
import Header from '../components/Header'
import RevealText from '../components/RevealText'
import { useSmoothScroll } from '../components/useSmoothScroll'
import { FeedbackScreen, TextScreen, VideoScreen } from './landing/AppScreens'
import { QuestionMock } from './landing/MockCards'

// 크기·간격은 buttersoft.io 실측값 기준 (index.css의 --gutter, --section-space 참고)
const EASE = [0.22, 1, 0.36, 1] as const

// 단계별 섹션명 + 한 줄 소개
const STEPS: { title: string; desc: string; mock: ReactNode }[] = [
  { title: '직무 맞춤 질문 알림', desc: '희망 직무를 적어 두면, 그에 맞춘 면접 질문을 매일 아침 알림으로 보내 드려요.', mock: <QuestionMock /> },
  { title: '글로 답하는 텍스트 면접', desc: '오늘의 질문에 STAR 순서로 차근차근 답을 적어 봐요. 같은 질문에 다시 답한 기록도 모여요.', mock: <TextScreen /> },
  { title: '이력서 기반 화상 면접', desc: '이력서를 올리면 내 경험에 맞춘 질문으로, AI 면접관과 말로 답하는 실전 연습을 해요.', mock: <VideoScreen /> },
  { title: '답변마다 점수와 피드백', desc: '좋았던 점과 고칠 점, 더 나은 답변 예시까지 짚어 주고, 언제든 다시 찾아볼 수 있어요.', mock: <FeedbackScreen /> },
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
    // 앱과 같은 밝은 테마(흰 바탕 · 토스 파랑 · 새 로고)
    <ThemeRoot className="text-paper">
      <Header />
      <Hero />
      <Statement />
      <HowItWorks />
      <Why />
      <QuestionMarquee />
      <Cta />
      <Footer />
    </ThemeRoot>
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
          className="inline-flex items-center gap-[0.12em] font-['Fredoka'] leading-[0.8] font-semibold tracking-[-0.02em] whitespace-nowrap"
        >
          <img src={logoMark} alt="" className="h-[0.86em] w-[0.86em]" />
          PREPAIR
        </motion.h1>
      </motion.div>
      <motion.div
        style={{ opacity: fade }}
        className="mt-8 flex flex-col gap-1 font-['Fredoka'] text-[15px] font-semibold tracking-[0.01em] text-soft sm:flex-row sm:justify-between xl:mt-[60px] xl:text-xl"
      >
        <p>YOUR AI INTERVIEW PARTNER</p>
        <p className="sm:text-right">FROM QUESTION TO FEEDBACK</p>
      </motion.div>
      <motion.p style={{ opacity: fade }} className="mt-auto text-center font-['Fredoka'] text-[13px] font-semibold tracking-[0.02em] text-mute xl:text-[15px]">
        SCROLL DOWN ↓
      </motion.p>
    </section>
  )
}

function Statement() {
  return (
    <section className="relative z-10 flex min-h-[593px] items-start overflow-hidden px-[var(--gutter)] pt-[100px] pb-[60px] xl:pt-[max(386px,calc(100svh_-_max(min(80svh,56vw),720px)_+_40px))] xl:pb-20">
      {/* 앱 패널과 같은 은은한 하늘·연보라·살구빛 배경 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_560px_at_10%_10%,#eaf3ff,transparent_70%),radial-gradient(1000px_600px_at_60%_30%,#f3f0ff,transparent_70%),radial-gradient(800px_520px_at_100%_80%,#fdf3ef,transparent_70%)]"
      />
      <div className="relative w-full">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.9, ease: EASE }}
          className="text-[26px] leading-[1.35] font-bold tracking-tight break-keep xl:text-[3vw]"
        >
          묻고, 듣고, 짚어 주는 AI 면접 파트너.
          <br className="hidden xl:block" /> 실제 면접이 익숙해질 때까지
          <br className="hidden xl:block" /> 프리페어가 함께 연습해요.
        </motion.h2>
        <p className="mt-6 max-w-[560px] text-[15px] leading-[1.6] text-mute xl:mt-7 xl:text-[17px]">
          하루 한 문제, 말로 답하는 연습이
          <br />
          면접 날의 자신감이 돼요.
        </p>
        <div className="mt-16 flex flex-col gap-1.5 text-sm leading-[1.6] tracking-[-0.01em] text-soft break-keep xl:mt-[clamp(72px,6.25vw,120px)] xl:mr-[1.4vw] xl:ml-auto xl:w-fit xl:[&>p]:whitespace-nowrap xl:text-base">
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
    <section id="how" className="relative z-10 scroll-mt-20 bg-ink px-[var(--gutter)] py-[60px] xl:pt-[var(--section-space)] xl:pb-20">
      <div className="flex items-end justify-between">
        <h2 className="font-['Fredoka'] text-[28px] leading-[1.2] font-semibold tracking-[-0.01em] xl:text-[3vw]">HOW IT WORKS</h2>
      </div>
      <div className="mt-12 space-y-20 xl:mt-[clamp(72px,6.25vw,120px)] xl:space-y-[120px]">
        {STEPS.map((step, i) => (
          <Step key={step.title} {...step} n={i + 1} reverse={i % 2 === 1} />
        ))}
      </div>
    </section>
  )
}

function Step({ title, desc, mock, n, reverse }: (typeof STEPS)[number] & { n: number; reverse: boolean }) {
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
        {/* 번호(로고 글씨) · 제목 · 설명을 이미지 옆 세로 가운데에 */}
        <div className="lg:my-auto">
          <p className="font-['Fredoka'] text-[15px] font-semibold tracking-[0.02em] text-toss xl:text-[17px]">{String(n).padStart(2, '0')}</p>
          <h3 className="mt-2 text-[20px] leading-[1.4] font-bold tracking-tight xl:text-[26px]">{title}</h3>
          <p className="mt-3 max-w-[420px] text-[15px] leading-[1.65] text-balance break-keep text-mute xl:text-[17px]">{desc}</p>
        </div>
      </div>
    </div>
  )
}

function Why() {
  return (
    <section className="relative z-10 bg-ink px-[var(--gutter)] pt-[100px] pb-14 xl:pt-[var(--section-space)] xl:pb-20">
      <RevealText
        className="mx-auto max-w-[1060px] text-center text-balance text-lg leading-[1.5] font-medium tracking-[-0.01em] xl:text-[24px]"
        text="면접장에는 혼자 들어가지만, 준비까지 혼자 할 필요는 없습니다."
      />
      {/* 슬로건: 로고 글씨(Fredoka) + 토스 파랑 PRE · PAIR = PREPAIR, 사이 글자는 연한 회색 */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.9, ease: EASE }}
        className="mt-3 text-center font-['Fredoka'] text-[clamp(22px,7vw,34px)] whitespace-nowrap leading-[1.1] font-semibold tracking-[-0.01em] xl:mt-4 xl:text-[72px]"
      >
        <span className="text-toss">PRE</span>
        <span className="text-[#c9d0d8]">PARE WITH YOUR </span>
        <span className="text-toss">PAIR</span>
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
            className={`rounded-full border px-7 py-4 text-sm whitespace-nowrap xl:text-base ${i % 3 === 1 ? 'border-toss bg-toss text-white' : 'border-line bg-card text-soft'}`}
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
        <h2 className="text-xl leading-[1.4] font-bold tracking-tight xl:text-[33px]">면접 준비, 오늘부터 시작해 볼까요?</h2>
        <p className="mt-2 text-sm leading-[1.4] text-mute xl:text-base">가입하면 매일 아침, 직무에 맞는 질문을 보내 드려요.</p>
        <Link
          to="/login"
          className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-toss px-7 py-3 font-['Fredoka'] text-[16px] font-semibold tracking-[0.02em] text-white transition-colors duration-300 hover:bg-toss-hover xl:mt-10 xl:text-[18px]"
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
          <ellipse key={cy} cx={360} cy={cy} rx={RING_RX} ry={RING_RY} stroke="#e3e7ec" />
        ))}
        <OrbitDot />
      </svg>
    </div>
  )
}

/** 맨 위 링을 따라 도는 파란 점 */
function OrbitDot() {
  const cx = useMotionValue(360 - RING_RX)
  const cy = useMotionValue(RING_YS[0])
  useAnimationFrame((t) => {
    const a = (t / 18000) * Math.PI * 2 + Math.PI
    cx.set(360 + Math.cos(a) * RING_RX)
    cy.set(RING_YS[0] + Math.sin(a) * RING_RY)
  })
  return <motion.circle cx={cx} cy={cy} r={4} fill="var(--color-toss)" />
}

function Footer() {
  return (
    <footer className="relative z-10 bg-ink px-[var(--gutter)] pt-10 pb-7 xl:py-[clamp(64px,4.167vw,80px)]">
      <div className="flex flex-col justify-between gap-3 border-t border-line pt-8 text-xs leading-[1.4] text-mute xl:flex-row">
        <BrandLogo size={15} nudge={false} />
        <span className="text-dim">© 2026 PREPAIR</span>
      </div>
    </footer>
  )
}
