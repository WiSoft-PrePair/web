import { AnimatePresence, motion } from 'motion/react'
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { AppShell, PageTitle } from '../components/AppShell'
import { primaryButtonClass } from '../components/auth'
import { DEFAULT_ACCENT, setAppearance, useAppearance } from '../components/appearance'
import { FREQUENCY } from '../components/prefsOptions'

const EASE = [0.22, 1, 0.36, 1] as const

type Sheet = 'nickname' | 'job' | 'frequency' | 'mode' | 'accent' | null

/**
 * 마이페이지 (화면만, 토스식 목록): 행 = 이름 | 현재 값 + 화살표, 누르면 아래에서 편집 창.
 * 알림 채널은 스위치로 바로 적용. 저장 버튼 없이 바뀔 때마다 저장(목업은 토스트만).
 * TODO: GET /api/auth/me 로 채우고, 바뀔 때마다 member-service 수정 API 호출
 */
export default function MyPage() {
  const [nickname, setNickname] = useState('우민')
  const [job, setJob] = useState('백엔드 개발자 (Spring, 대용량 트래픽 경험 위주)')
  const [email, setEmail] = useState(true)
  const [kakao, setKakao] = useState(true)
  const [frequency, setFrequency] = useState<string>('every')
  const [sheet, setSheet] = useState<Sheet>(null)
  const { mode, accent } = useAppearance()
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number>(undefined)

  const notify = (text: string) => {
    setToast(text)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 1600)
  }

  // 알림 채널은 하나는 켜져 있어야 함 (서버 값: email | kakao | both)
  const toggleChannel = (which: 'email' | 'kakao') => {
    const on = which === 'email' ? email : kakao
    const other = which === 'email' ? kakao : email
    if (on && !other) return notify('알림 채널은 하나 이상 켜 두어야 해요')
    if (which === 'email') setEmail(!on)
    else setKakao(!on)
    notify('저장했어요')
  }

  const freq = FREQUENCY.find((f) => f.value === frequency)!
  const freqText = (f: (typeof FREQUENCY)[number]) => `${f.label} ${f.sub.replace(/[()]/g, '')}`

  return (
    <AppShell>
      <div className="mx-auto max-w-[560px]">
        <PageTitle eyebrow="MY PAGE" title="설정" />

        <Section title="내 정보">
          <ValueRow label="닉네임" value={nickname} onClick={() => setSheet('nickname')} />
          <ValueRow label="희망 직무" value={job} onClick={() => setSheet('job')} />
        </Section>

        <Section title="질문 알림">
          <SwitchRow label="이메일로 받기" on={email} onToggle={() => toggleChannel('email')} />
          <SwitchRow label="카카오톡으로 받기" on={kakao} onToggle={() => toggleChannel('kakao')} />
          <ValueRow label="알림 주기" value={freqText(freq)} onClick={() => setSheet('frequency')} />
        </Section>

        <Section title="화면">
          <ValueRow label="화면 모드" value={mode === 'light' ? '화이트' : '다크'} onClick={() => setSheet('mode')} />
          <ValueRow
            label="대표색"
            value={
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border border-line" style={{ backgroundColor: accent }} />
                <span className="font-display tracking-wide uppercase">{accent}</span>
              </span>
            }
            onClick={() => setSheet('accent')}
          />
        </Section>
      </div>

      <BottomSheet open={sheet === 'nickname'} title="닉네임" onClose={() => setSheet(null)}>
        <TextEdit
          initial={nickname}
          onDone={(v) => {
            setNickname(v)
            setSheet(null)
            notify('저장했어요')
          }}
        />
      </BottomSheet>
      <BottomSheet open={sheet === 'job'} title="희망 직무" onClose={() => setSheet(null)}>
        <TextEdit
          multiline
          hint="자유롭게 적을수록 질문이 더 잘 맞춰져요."
          initial={job}
          onDone={(v) => {
            setJob(v)
            setSheet(null)
            notify('저장했어요')
          }}
        />
      </BottomSheet>
      <BottomSheet open={sheet === 'frequency'} title="알림 주기" onClose={() => setSheet(null)}>
        <ul role="radiogroup" aria-label="알림 주기" className="-mx-2">
          {FREQUENCY.map((f) => {
            const on = f.value === frequency
            return (
              <li key={f.value}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => {
                    setFrequency(f.value)
                    setSheet(null)
                    notify('저장했어요')
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-2 py-3.5 text-left transition-colors hover:bg-tint/[0.04]"
                >
                  <span>
                    <span className={`text-[16px] ${on ? 'font-medium text-paper' : 'text-soft'}`}>{f.label}</span>
                    <span className="ml-2 text-[14px] text-mute">{f.sub.replace(/[()]/g, '')}</span>
                  </span>
                  {on && (
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-paper" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </BottomSheet>

      <BottomSheet open={sheet === 'mode'} title="화면 모드" onClose={() => setSheet(null)}>
        <ul role="radiogroup" aria-label="화면 모드" className="-mx-2">
          {(
            [
              ['light', '화이트'],
              ['dark', '다크'],
            ] as const
          ).map(([v, label]) => (
            <li key={v}>
              <button
                type="button"
                role="radio"
                aria-checked={mode === v}
                onClick={() => {
                  setAppearance({ mode: v })
                  setSheet(null)
                }}
                className="flex w-full items-center justify-between rounded-xl px-2 py-3.5 text-left transition-colors hover:bg-tint/[0.04]"
              >
                <span className={`text-[16px] ${mode === v ? 'font-medium text-paper' : 'text-soft'}`}>{label}</span>
                {mode === v && (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-paper" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      </BottomSheet>
      <BottomSheet open={sheet === 'accent'} title="대표색" onClose={() => setSheet(null)}>
        <AccentPicker value={accent} onChange={(c) => setAppearance({ accent: c })} onDone={() => setSheet(null)} />
      </BottomSheet>

      {/* 저장 알림 */}
      <AnimatePresence>
        {toast && (
          <motion.p
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="fixed bottom-8 left-1/2 z-30 -translate-x-1/2 rounded-full bg-paper px-4 py-2.5 text-[13px] font-medium whitespace-nowrap text-ink"
          >
            {toast}
          </motion.p>
        )}
      </AnimatePresence>
    </AppShell>
  )
}

/* ───────── 목록 ───────── */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-1 text-[13px] text-mute">{title}</h2>
      <div>{children}</div>
    </section>
  )
}

const rowClass = '-mx-3 flex w-[calc(100%+1.5rem)] items-center gap-4 rounded-xl px-3 py-3 text-left transition-colors hover:bg-tint/[0.04]'

function ValueRow({ label, value, onClick }: { label: string; value: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`group ${rowClass}`}>
      <span className="shrink-0 text-[16px] text-paper">{label}</span>
      <span className="ml-auto min-w-0 truncate text-[15px] text-mute">{value}</span>
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-dim transition-colors group-hover:text-soft" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m9 5 7 7-7 7" />
      </svg>
    </button>
  )
}

function SwitchRow({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onToggle} className={`justify-between ${rowClass}`}>
      <span className="text-[16px] text-paper">{label}</span>
      <span className={`relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-200 ${on ? 'bg-lime' : 'bg-tint/[0.14]'}`}>
        <motion.span
          className={`absolute top-[3px] left-[3px] h-5 w-5 rounded-full transition-colors duration-200 ${on ? 'bg-ink' : 'bg-mute'}`}
          initial={false}
          animate={{ x: on ? 18 : 0 }}
          transition={{ type: 'spring', stiffness: 600, damping: 35 }}
        />
      </span>
    </button>
  )
}

/* ───────── 편집 창 ───────── */

/** 모바일은 아래에서 올라오는 시트, 넓은 화면은 가운데 창 */
function BottomSheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
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
            aria-label={title}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="relative w-full max-w-[440px] rounded-t-3xl border border-line bg-ink-2 px-6 pt-6 pb-8 md:rounded-3xl md:pb-6"
          >
            <h2 className="mb-4 text-[18px] font-semibold text-paper">{title}</h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function TextEdit({ initial, onDone, multiline = false, hint }: { initial: string; onDone: (v: string) => void; multiline?: boolean; hint?: string }) {
  const [value, setValue] = useState(initial)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (value.trim()) onDone(value.trim())
  }
  const field = 'w-full rounded-xl border border-line bg-ink px-4 py-3 text-[16px] leading-6 text-paper outline-none transition-colors focus:border-mute'
  return (
    <form onSubmit={submit}>
      {multiline ? (
        <textarea autoFocus rows={3} value={value} onChange={(e) => setValue(e.target.value)} className={`${field} block resize-none`} />
      ) : (
        <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} className={field} />
      )}
      {hint && <p className="mt-2 text-xs text-mute">{hint}</p>}
      <button type="submit" disabled={!value.trim()} className={`mt-5 ${primaryButtonClass}`}>
        완료
      </button>
    </form>
  )
}

/** 대표색 고르기: 색상 선택기 + HEX 입력 + 미리보기(잔디·강조 글씨). 바꾸는 즉시 화면에 반영 */
function AccentPicker({ value, onChange, onDone }: { value: string; onChange: (c: string) => void; onDone: () => void }) {
  const [hex, setHex] = useState(value)
  const apply = (v: string) => {
    setHex(v)
    if (/^#[0-9a-f]{6}$/i.test(v)) onChange(v.toLowerCase())
  }
  return (
    <div>
      <div className="flex items-center gap-4">
        <label className="relative h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-line" style={{ backgroundColor: value }}>
          <input type="color" aria-label="색상 선택" value={value} onChange={(e) => apply(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        </label>
        <input
          aria-label="HEX 색상 코드"
          value={hex}
          onChange={(e) => apply(e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`)}
          maxLength={7}
          className="w-full rounded-xl border border-line bg-ink px-4 py-3 font-display text-[16px] tracking-wide text-paper uppercase outline-none transition-colors focus:border-mute"
        />
      </div>

      {/* 미리보기 */}
      <div className="mt-5 rounded-2xl border border-line px-4 py-4">
        <p className="font-display text-[12px] font-medium tracking-[0.08em] text-lime">TODAY&apos;S QUESTION</p>
        <div className="mt-3 flex gap-[3px]" aria-hidden>
          {Array.from({ length: 21 }, (_, i) => {
            const level = [0, 1, 2, 3, 1, 0, 2][i % 7]
            return <span key={i} className={`h-3 w-3 rounded-[3px] ${['bg-tint/[0.06]', 'bg-grass/30', 'bg-grass/60', 'bg-grass'][level]}`} />
          })}
        </div>
      </div>
      <p className="mt-2 text-[12px] text-mute">잔디는 고른 색 그대로, 글씨는 잘 읽히도록 자동으로 조금 진하게 맞춰요.</p>

      <div className="mt-5 flex gap-2">
        <button type="button" onClick={() => apply(DEFAULT_ACCENT)} className="rounded-xl px-4 py-3 text-sm text-mute transition-colors hover:text-paper">
          기본값
        </button>
        <button type="button" onClick={onDone} className={`flex-1 ${primaryButtonClass}`}>
          완료
        </button>
      </div>
    </div>
  )
}
