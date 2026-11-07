import { motion } from 'motion/react'
import logoMark from '../assets/brand/logo-mark.png'
import { tossButton } from './auth'

const EASE = [0.22, 1, 0.36, 1] as const

/** 가입 완료: 로고 마크가 통통 튀어 들어오고 작은 물방울들이 퍼진다 → 인사 → 내 설정 요약 카드 → 시작 버튼 */
export function Welcome({ nickname, job, frequency, notification, onStart }: { nickname: string; job: string; frequency?: string; notification?: string; onStart: () => void }) {
  const when = frequency === 'weekly' ? '매주 월요일 오전 8시' : '매일 오전 8시'
  const where = notification === 'both' ? '이메일 · 카카오톡' : notification === 'kakao' ? '카카오톡' : '이메일'
  const rows = [
    { label: '질문 받는 시간', value: when },
    { label: '받는 곳', value: where },
    { label: '희망 직무', value: job.trim() },
  ]
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="text-center">
      <div className="relative mx-auto grid h-28 w-28 place-items-center">
        {/* 퍼지는 고리 두 겹 */}
        {[0, 0.18].map((delay) => (
          <motion.span
            key={delay}
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-toss/30"
            initial={{ scale: 0.4, opacity: 0.9 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.1, delay: 0.25 + delay, ease: 'easeOut' }}
          />
        ))}
        {/* 사방으로 튀는 작은 물방울 */}
        {BURST.map(({ x, y, s, c }, i) => (
          <motion.span
            key={i}
            aria-hidden
            className={`absolute rounded-full ${c}`}
            style={{ width: s, height: s }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{ x, y, scale: [0, 1, 0.8], opacity: [1, 1, 0] }}
            transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
          />
        ))}
        <span aria-hidden className="absolute inset-3 rounded-full bg-toss/[0.08]" />
        <motion.img
          src={logoMark}
          alt=""
          className="relative h-14 w-14"
          initial={{ scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
        />
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.55, ease: EASE }}>
        <p className="mt-6 font-['Fredoka'] text-[15px] font-semibold tracking-[0.12em] text-toss">WELCOME</p>
        <h1 className="mt-2 text-[28px] leading-snug font-semibold tracking-tight text-paper">{nickname}님, 반가워요</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-mute">이제 하루 한 문제씩 같이 준비해요.</p>
      </motion.div>

      <motion.dl
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.75, ease: EASE }}
        className="mt-9 space-y-3.5 rounded-3xl bg-[#f7f8fa] px-6 py-5 text-left text-[14px]"
      >
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-baseline justify-between gap-6">
            <dt className="shrink-0 text-mute">{label}</dt>
            <dd className="truncate font-medium text-paper">{value}</dd>
          </div>
        ))}
      </motion.dl>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.9, ease: EASE }}>
        <button type="button" onClick={onStart} className={`mt-8 ${tossButton}`}>
          오늘의 질문 보러 가기
        </button>
        <p className="mt-3 text-[13px] text-dim">설정은 마이페이지에서 언제든 바꿀 수 있어요.</p>
      </motion.div>
    </motion.div>
  )
}

/** 물방울: 퍼지는 위치(x, y), 크기(px), 색 */
const BURST = [
  { x: -62, y: -38, s: 10, c: 'bg-toss' },
  { x: 58, y: -50, s: 8, c: 'bg-toss/60' },
  { x: 70, y: 18, s: 12, c: 'bg-toss/80' },
  { x: -70, y: 30, s: 7, c: 'bg-toss/50' },
  { x: -18, y: -68, s: 6, c: 'bg-toss/40' },
  { x: 26, y: 64, s: 9, c: 'bg-toss/70' },
  { x: -40, y: 62, s: 5, c: 'bg-toss/40' },
]
