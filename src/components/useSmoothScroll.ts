import Lenis from 'lenis'
import { cancelFrame, frame } from 'motion/react'
import { useEffect } from 'react'

/**
 * 랜딩 전용 관성 스크롤 (buttersoft.io와 같은 duration 1.2 + 기본 expo 감속).
 * Lenis를 Motion의 프레임 루프에서 돌려서, 스크롤 연동 애니메이션과 같은 프레임에 갱신되게 한다.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ duration: 1.2, smoothWheel: true, anchors: { duration: 1 } })
    const update = ({ timestamp }: { timestamp: number }) => lenis.raf(timestamp)
    frame.update(update, true)
    return () => {
      cancelFrame(update)
      lenis.destroy()
    }
  }, [])
}
