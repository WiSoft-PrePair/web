import Lenis from 'lenis'
import { cancelFrame, frame } from 'motion/react'
import { useEffect } from 'react'

/**
 * 랜딩 전용 관성 스크롤. 고정 시간(duration) 대신 lerp로 따라가게 해서, 트랙패드·휠 모두 입력에 바로 반응하면서 끝만 부드럽게 멈춘다.
 * Lenis를 Motion의 프레임 루프에서 돌려서, 스크롤 연동 애니메이션과 같은 프레임에 갱신되게 한다.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, anchors: { duration: 1 } })
    const update = ({ timestamp }: { timestamp: number }) => lenis.raf(timestamp)
    frame.update(update, true)
    return () => {
      cancelFrame(update)
      lenis.destroy()
    }
  }, [])
}
