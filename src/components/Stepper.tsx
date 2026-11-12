import { AnimatePresence, motion } from 'motion/react'
import { BrandLogo } from './auth'

const EASE = [0.22, 1, 0.36, 1] as const

/** 가입 단계 표시 (이메일 가입·카카오 가입 공통): 폼 폭만큼의 얇은 막대 두 칸. 지금 단계까지 흰색으로 채워진다. 막대를 눌러 이동(2단계는 계정 정보를 다 채운 뒤에만) */
export function Stepper({
  step,
  canGoNext,
  onGo,
  onBack,
  locked = false,
}: {
  step: 1 | 2
  canGoNext: boolean
  onGo: (s: 1 | 2) => void
  onBack: () => void
  /** true면 막대는 표시만 한다 (카카오 가입: 계정 단계로 돌아갈 화면이 없음) */
  locked?: boolean
}) {
  const steps = [
    { n: 1 as const, label: '1단계: 계정 생성' },
    { n: 2 as const, label: '2단계: 직무 설정' },
  ]
  return (
    <div>
      {/* 맨 위 줄: 왼쪽 이전, 가운데 작은 로고 (작성 중 실수로 나가지 않게 로고엔 링크를 걸지 않는다) */}
      <div className="relative mb-4 flex h-9 items-center justify-center">
        <button
          type="button"
          onClick={onBack}
          aria-label="이전"
          className="absolute left-0 -ml-2 grid h-9 w-9 place-items-center rounded-full text-soft transition-colors hover:bg-tint/[0.06] hover:text-paper"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <BrandLogo size={17} />
      </div>
      <div className="mb-1 flex items-baseline justify-between">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={step}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="text-[15px] font-medium text-paper"
          >
            {step === 1 ? '계정 생성' : '직무 설정'}
          </motion.span>
        </AnimatePresence>
        <span className="text-sm text-mute">
          <span className="text-paper">{step}</span> / 2
        </span>
      </div>
    <nav aria-label="가입 단계" className="flex gap-2">
      {steps.map(({ n, label }) => {
        const filled = step >= n
        const enabled = !locked && (n === 1 || canGoNext)
        return (
          <button
            key={n}
            type="button"
            aria-label={label}
            aria-current={step === n ? 'step' : undefined}
            disabled={!enabled || step === n}
            onClick={() => onGo(n)}
            className="group flex-1 py-2 disabled:cursor-default"
          >
            <span className="relative block h-[3px] overflow-hidden rounded-full bg-tint/[0.08]">
              <motion.span
                className="absolute inset-0 origin-left rounded-full bg-toss"
                initial={false}
                animate={{ scaleX: filled ? 1 : 0 }}
                transition={{ duration: 0.45, ease: EASE }}
              />
            </span>
          </button>
        )
      })}
    </nav>
    </div>
  )
}
