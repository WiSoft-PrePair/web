import { MeshGradient } from '@paper-design/shaders-react'
import { useEffect, useRef, useState } from 'react'

/**
 * 천천히 흐르는 흑백 메시 그라데이션 배경 (WebGL, Paper Shaders).
 * 설정값은 buttersoft.io 소개 섹션 실측. 화면에 보일 때만 움직이고, '동작 줄이기'면 멈춘다.
 */
export default function AnimatedMeshBackground() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e?.isIntersecting ?? false), { rootMargin: '120px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-ink">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 8% 24%, rgb(255 255 255 / 24%), transparent 30%), radial-gradient(circle at 84% 40%, rgb(255 255 255 / 12%), transparent 34%), linear-gradient(180deg, #454545 0%, #111 72%, #000 100%)',
        }}
      />
      <MeshGradient
        className="absolute inset-0 size-full opacity-85"
        width="100%"
        height="100%"
        colors={['#111111', '#454545', '#888888', '#ffffff']}
        distortion={0.8}
        swirl={0.1}
        grainMixer={0.08}
        grainOverlay={0.04}
        speed={visible && !reduced ? 0.25 : 0}
        fit="cover"
        minPixelRatio={1}
        maxPixelCount={1_500_000}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink/15 to-black/50" />
    </div>
  )
}
