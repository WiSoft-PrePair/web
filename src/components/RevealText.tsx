import { motion, type MotionValue, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'

/** 스크롤에 맞춰 연한 회색 글자가 앞에서부터 한 단어씩 진한 검정으로 바뀌는 문단 (밝은 랜딩용) */
export default function RevealText({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.4'] })
  const words = text.split(' ')

  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => (
        <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
          {word}
        </Word>
      ))}
    </p>
  )
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const color = useTransform(progress, range, ['#c9cfd6', '#111111'])
  return (
    <motion.span style={{ color }} className="inline-block whitespace-pre">
      {children}{' '}
    </motion.span>
  )
}
