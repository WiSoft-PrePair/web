import { AnimatePresence, motion } from 'motion/react'
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { useAppearance } from '../components/appearance'
import { AppShell, PageTitle } from '../components/AppShell'
import { primaryButtonClass } from '../components/auth'
import { addJob, deadlineLabel, daysLeft, type Job, moveJob, removeJob, type Stage, STAGES, useJobs } from '../data/jobs'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * 공고 관리 (칸반): 공고를 추가·삭제하고, 단계별 열에 카드를 끌어다 옮긴다.
 * 이 브라우저(localStorage)에만 저장. TODO: 저장 API(새 기능, 백엔드 없음)
 */
export default function Jobs() {
  const jobs = useJobs()
  const [dragging, setDragging] = useState<number | null>(null)
  const [over, setOver] = useState<Stage | null>(null)
  const [adding, setAdding] = useState(false)
  const [undo, setUndo] = useState<{ company: string; restore: () => void } | null>(null)
  const undoTimer = useRef<number>(undefined)

  const moveTo = (stage: Stage) => {
    if (dragging === null) return
    moveJob(dragging, stage)
    setDragging(null)
    setOver(null)
  }

  const remove = (j: Job) => {
    const restore = removeJob(j.id)
    setUndo({ company: j.company, restore })
    window.clearTimeout(undoTimer.current)
    undoTimer.current = window.setTimeout(() => setUndo(null), 4000)
  }

  useEffect(() => () => window.clearTimeout(undoTimer.current), [])

  return (
    <AppShell wide>
      <PageTitle
        eyebrow="JOBS"
        title="공고 관리"
        right={
          <button type="button" onClick={() => setAdding(true)} className="rounded-xl border border-line px-4 py-2.5 text-sm text-paper transition-colors hover:border-mute">
            + 공고 추가
          </button>
        }
      />

      <div className="-mx-[var(--side)] mt-8 overflow-x-auto px-[var(--side)] pb-4 [scrollbar-width:none]">
        <div className="grid min-w-[1100px] grid-cols-5 gap-3">
          {STAGES.map((s) => {
            const items = jobs.filter((j) => j.stage === s.key)
            return (
              <section
                key={s.key}
                aria-label={s.label}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOver(s.key)
                }}
                onDragLeave={() => setOver((o) => (o === s.key ? null : o))}
                onDrop={() => moveTo(s.key)}
                className={`flex min-h-[60svh] flex-col rounded-2xl border p-2.5 transition-colors ${over === s.key ? 'border-grass/60 bg-grass/[0.04]' : 'border-line'}`}
              >
                <h2 className="flex items-center justify-between px-1.5 pt-1 pb-3 text-[13px]">
                  <span className="text-soft">{s.label}</span>
                  <span className="text-mute tabular-nums">{items.length}</span>
                </h2>
                <ul className="space-y-2">
                  <AnimatePresence initial={false}>
                    {items.map((j) => (
                      <motion.li key={j.id} layout layoutId={`job-${j.id}`} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3, ease: EASE }}>
                        <JobCard job={j} dragging={dragging === j.id} onDragStart={() => setDragging(j.id)} onDragEnd={() => (setDragging(null), setOver(null))} onRemove={() => remove(j)} />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </section>
            )
          })}
        </div>
      </div>

      <AddJobDialog open={adding} onClose={() => setAdding(false)} />

      {/* 삭제 알림 + 되돌리기 */}
      <AnimatePresence>
        {undo && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="fixed bottom-8 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 rounded-full bg-paper py-2 pr-2 pl-4 text-[13px] whitespace-nowrap text-ink"
          >
            <span className="font-medium">{undo.company} 공고를 삭제했어요</span>
            <button
              type="button"
              onClick={() => {
                undo.restore()
                setUndo(null)
              }}
              className="rounded-full px-3 py-1 font-semibold underline-offset-2 hover:underline"
            >
              되돌리기
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  )
}

function JobCard({ job, dragging, onDragStart, onDragEnd, onRemove }: { job: Job; dragging: boolean; onDragStart: () => void; onDragEnd: () => void; onRemove: () => void }) {
  const urgent = job.deadline !== undefined && daysLeft(job.deadline) >= 0
  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} className={`group relative rounded-xl bg-ink-2 p-3.5 transition-opacity ${dragging ? 'opacity-40' : ''}`}>
      <button
        type="button"
        aria-label={`${job.company} 공고 삭제`}
        onClick={onRemove}
        className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full text-dim opacity-0 transition-all group-hover:opacity-100 hover:bg-tint/[0.06] hover:text-soft focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <p className="pr-6 text-[15px] font-medium text-paper">{job.company}</p>
      <p className="mt-0.5 text-[13px] text-soft">{job.role}</p>
      {(job.deadline || job.memo) && (
        <p className="mt-3 flex items-baseline justify-between gap-3 text-[12px]">
          <span className="min-w-0 truncate text-mute">{job.memo}</span>
          {job.deadline && <span className={`shrink-0 ${urgent ? 'text-lime' : 'text-mute'}`}>{deadlineLabel(job.deadline)}</span>}
        </p>
      )}
    </div>
  )
}

/** 공고 추가 창: 회사명·직무 필수, 단계·마감일·메모 선택. Esc·바깥 클릭으로 닫힘 */
function AddJobDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-20 flex items-end justify-center md:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-black/60" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="공고 추가"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="relative w-full max-w-[480px] rounded-t-3xl border border-line bg-ink-2 px-7 pt-6 pb-8 md:rounded-3xl md:pb-7"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-paper">공고 추가</h2>
              <button
                type="button"
                aria-label="닫기"
                onClick={onClose}
                className="-mr-2 grid h-9 w-9 place-items-center rounded-full text-mute transition-colors hover:bg-tint/[0.06] hover:text-paper"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <JobForm onDone={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function JobForm({ onDone }: { onDone: () => void }) {
  const { mode } = useAppearance()
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [stage, setStage] = useState<Stage>('wish')
  const [deadline, setDeadline] = useState('')
  const [memo, setMemo] = useState('')
  const ok = company.trim() !== '' && role.trim() !== ''

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!ok) return
    addJob({ company: company.trim(), role: role.trim(), stage, deadline: deadline || undefined, memo: memo.trim() || undefined })
    onDone()
  }

  // 모든 입력 요소는 높이 44px · 글자 14px · 모서리 12px로 맞춘다
  const field = 'h-11 w-full rounded-xl border border-line bg-ink px-3.5 text-[14px] text-paper outline-none transition-colors placeholder:text-dim focus:border-mute'

  return (
    <form onSubmit={submit} className="mt-6">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="회사명">
            <input autoFocus value={company} onChange={(e) => setCompany(e.target.value)} className={field} />
          </Field>
          <Field label="직무">
            <input value={role} onChange={(e) => setRole(e.target.value)} className={field} />
          </Field>
        </div>

        <fieldset>
          <legend className="mb-2 text-[13px] text-mute">단계</legend>
          <div className="grid h-11 grid-cols-5 gap-1 rounded-xl border border-line bg-ink p-1">
            {STAGES.map((s) => (
              <button
                key={s.key}
                type="button"
                aria-pressed={stage === s.key}
                onClick={() => setStage(s.key)}
                className={`rounded-lg text-[13px] whitespace-nowrap transition-colors ${stage === s.key ? 'bg-paper font-medium text-ink' : 'text-soft hover:bg-tint/[0.05]'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <Field label="마감일" optional>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={{ colorScheme: mode }} className={field} />
          </Field>
          <Field label="메모" optional>
            <input value={memo} onChange={(e) => setMemo(e.target.value)} className={field} />
          </Field>
        </div>
      </div>

      <button type="submit" disabled={!ok} className={`mt-7 h-11 !py-0 ${primaryButtonClass}`}>
        추가하기
      </button>
    </form>
  )
}

function Field({ label, optional = false, children }: { label: string; optional?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-baseline gap-1.5 text-[13px] text-mute">
        {label}
        {optional && <span className="text-[12px] text-dim">선택</span>}
      </span>
      {children}
    </label>
  )
}
