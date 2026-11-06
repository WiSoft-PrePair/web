import { motion } from 'motion/react'
import feedback from '../../assets/landing/feedback.jpg'
import text from '../../assets/landing/text.jpg'
import video from '../../assets/landing/video.jpg'

/**
 * 랜딩 'HOW IT WORKS' 카드: 실제 앱 화면(밝은 테마 캡처)을 밝은 브라우저 창 틀에 담아 보여 준다.
 * 캡처는 src/assets/landing/*.jpg (1440×900, 2배). 화면이 바뀌면 다시 찍어 교체한다.
 */

const frame = 'relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line md:aspect-[16/10]'
const EASE = [0.22, 1, 0.36, 1] as const

/** 카드 안 은은한 색 번짐 배경 (밝은 바탕) */
const glow = (a: string, b: string) => ({
  background: `radial-gradient(60% 70% at 15% 100%, ${a}, transparent 70%), radial-gradient(55% 60% at 90% 0%, ${b}, transparent 70%), #f4f7fb`,
})

function Window({ src, alt, className, delay = 0 }: { src: string; alt: string; className: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 1, delay, ease: EASE }}
      className={`absolute overflow-hidden rounded-[10px] border border-black/[0.06] bg-white shadow-[0_24px_60px_-24px_rgba(16,24,40,0.35)] ${className}`}
    >
      {/* 브라우저 상단 바 */}
      <div className="flex h-[22px] items-center gap-1.5 border-b border-black/[0.05] bg-[#f2f4f6] px-2.5">
        <span className="h-[7px] w-[7px] rounded-full bg-[#ff5f57]" />
        <span className="h-[7px] w-[7px] rounded-full bg-[#febc2e]" />
        <span className="h-[7px] w-[7px] rounded-full bg-[#28c840]" />
      </div>
      <img src={src} alt={alt} loading="lazy" decoding="async" className="block w-full" />
    </motion.div>
  )
}

/** 02 · 텍스트 면접: 질문 + STAR 안내 + 답 적는 중 */
export function TextScreen() {
  return (
    <div className={frame} style={glow('rgba(49,130,246,0.14)', 'rgba(139,123,255,0.14)')}>
      <Window src={text} alt="텍스트 면접 화면: 질문, STAR 안내, 답변 입력, 답변 기록" className="top-[10%] left-[6%] w-[112%]" />
    </div>
  )
}

/** 03 · 화상 면접: 이력서 기반 질문 카드 + AI 면접관 + 내 카메라 (요소가 화면 네 귀퉁이에 퍼져 있어 창 전체를 보여 준다) */
export function VideoScreen() {
  return (
    <div className={frame} style={glow('rgba(139,123,255,0.16)', 'rgba(49,130,246,0.14)')}>
      <Window src={video} alt="화상 면접 화면: 이력서 기반 질문, AI 면접관, 내 카메라, 마이크·카메라 조작" className="top-[9%] left-1/2 w-[88%] -translate-x-1/2" />
    </div>
  )
}

/** 04 · 답변 피드백: 점수 · 좋았던 점 · 고칠 점 · 더 나은 답 */
export function FeedbackScreen() {
  return (
    <div className={frame} style={glow('rgba(255,181,71,0.14)', 'rgba(49,130,246,0.14)')}>
      <Window src={feedback} alt="답변 피드백 화면: 점수, 좋았던 점, 고칠 점, 이렇게 바꿔 보면 좋은 점" className="top-[10%] left-[6%] w-[112%]" />
    </div>
  )
}
