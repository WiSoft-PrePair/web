import { motion } from 'motion/react'
import feedback from '../../assets/landing/feedback.jpg'
import home from '../../assets/landing/home.jpg'
import text from '../../assets/landing/text.jpg'
import video from '../../assets/landing/video.jpg'

/**
 * 랜딩 'HOW IT WORKS' 카드: 실제 앱 화면(다크 모드 캡처)을 브라우저 창 틀에 담아 보여 준다.
 * 캡처는 src/assets/landing/*.jpg (1440×900, 2배). 화면이 바뀌면 다시 찍어 교체한다.
 */

const frame = 'relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line md:aspect-[16/10]'
const EASE = [0.22, 1, 0.36, 1] as const

/** 카드 안 색 번짐 배경 (카드 안에서만 색을 쓴다) */
const glow = (a: string, b: string) => ({
  background: `radial-gradient(60% 70% at 15% 100%, ${a}, transparent 70%), radial-gradient(55% 60% at 90% 0%, ${b}, transparent 70%), #141414`,
})

function Window({ src, alt, className, delay = 0 }: { src: string; alt: string; className: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 1, delay, ease: EASE }}
      className={`absolute overflow-hidden rounded-[10px] border border-white/10 bg-[#111] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] ${className}`}
    >
      {/* 브라우저 상단 바 */}
      <div className="flex h-[22px] items-center gap-1.5 border-b border-white/[0.06] bg-[#1a1a1a] px-2.5">
        <span className="h-[7px] w-[7px] rounded-full bg-[#ff5f57]" />
        <span className="h-[7px] w-[7px] rounded-full bg-[#febc2e]" />
        <span className="h-[7px] w-[7px] rounded-full bg-[#28c840]" />
      </div>
      <img src={src} alt={alt} loading="lazy" decoding="async" className="block w-full" />
    </motion.div>
  )
}

/** 01 · 메인: 오늘의 질문과 답변 기록 */
export function HomeScreen() {
  return (
    <div className={frame} style={glow('rgba(225,255,107,0.22)', 'rgba(139,123,255,0.28)')}>
      <Window src={home} alt="PrePair 메인 화면: 오늘의 질문, 다시 답해 볼 질문, 답변 기록 잔디" className="top-[10%] left-1/2 w-[88%] -translate-x-1/2" />
    </div>
  )
}

/** 02 · 텍스트 면접(뒤) + 화상 면접(앞) */
export function InterviewScreens() {
  return (
    <div className={frame} style={glow('rgba(108,199,255,0.22)', 'rgba(139,123,255,0.3)')}>
      <Window src={text} alt="텍스트 면접 화면: 질문, STAR 가이드, 답변 입력" className="top-[7%] left-[5%] w-[70%]" />
      <Window src={video} alt="화상 면접 화면: AI 면접관과 내 카메라, 질문 자막" className="top-[30%] right-[5%] w-[66%]" delay={0.15} />
    </div>
  )
}

/** 03 · 답변 피드백 창 */
export function FeedbackScreen() {
  return (
    <div className={frame} style={glow('rgba(255,181,71,0.18)', 'rgba(225,255,107,0.2)')}>
      <Window src={feedback} alt="답변 피드백 화면: 점수, 총평, STAR 체크, 좋았던 점과 고칠 점" className="top-[10%] right-[6%] w-[118%]" />
    </div>
  )
}
