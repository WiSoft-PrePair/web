import { AnimatePresence, motion } from 'motion/react'
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import { AppShell, PageTitle } from '../components/AppShell'
import { tossButton } from '../components/auth'
import { FREQUENCY } from '../components/prefsOptions'

const EASE = [0.22, 1, 0.36, 1] as const

type Sheet = 'nickname' | 'job' | 'frequency' | null

/**
 * 마이페이지 (화면만, 토스식 목록): 프로필 카드 → 묶음별 흰 카드(내 정보 · 질문 알림 · 계정) → 회원 탈퇴.
 * 행 = 이름 | 현재 값 + 화살표, 누르면 편집 창(모바일은 아래에서, 넓은 화면은 가운데).
 * 알림 채널은 스위치로 바로 적용. 저장 버튼 없이 바뀔 때마다 저장(목업은 토스트만).
 * TODO: GET /api/auth/me 로 채우고, 바뀔 때마다 member-service 수정 API 호출
 */
export default function MyPage() {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('우민')
  const accountEmail = 'woomin@example.com' // 목업
  const [job, setJob] = useState('백엔드 개발자 (Spring, 대용량 트래픽 경험 위주)')
  const [email, setEmail] = useState(true)
  const [kakao, setKakao] = useState(true)
  const [frequency, setFrequency] = useState<string>('every')
  const [sheet, setSheet] = useState<Sheet>(null)
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
        <PageTitle title="마이페이지" />

        {/* 프로필: 닉네임 + 이메일 (프로필 사진은 두지 않음) */}
        <div className="mt-8 rounded-3xl bg-card p-6 shadow-card">
          <span className="block min-w-0">
            <span className="block truncate text-[20px] font-semibold text-paper">{nickname}</span>
            <span className="mt-0.5 block truncate text-[14px] text-mute">{accountEmail}</span>
          </span>
        </div>

        <Section title="내 정보">
          <ValueRow label="닉네임" value={nickname} onClick={() => setSheet('nickname')} />
          <ValueRow label="희망 직무" value={job} onClick={() => setSheet('job')} />
        </Section>

        <Section title="질문 알림">
          <SwitchRow label="이메일로 받기" on={email} onToggle={() => toggleChannel('email')} />
          <SwitchRow label="카카오톡으로 받기" on={kakao} onToggle={() => toggleChannel('kakao')} />
          <ValueRow label="알림 주기" value={freqText(freq)} onClick={() => setSheet('frequency')} />
        </Section>

        <Section title="계정">
          <ValueRow label="비밀번호 변경" value="" onClick={() => notify('비밀번호 변경은 준비 중이에요')} />
          {/* TODO: POST /api/auth/logout 연동 */}
          <ValueRow label="로그아웃" value="" onClick={() => navigate('/login')} />
        </Section>

        {/* 탈퇴는 눈에 덜 띄게 카드 밖 아래에 */}
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={() => notify('회원 탈퇴는 준비 중이에요')} className="px-1 text-[13px] text-mute underline-offset-4 transition-colors hover:text-soft hover:underline">
            회원 탈퇴
          </button>
        </div>

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
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-toss" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
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
            className="fixed bottom-8 left-1/2 z-30 -translate-x-1/2 rounded-full border border-line bg-card px-4 py-2 text-[13px] whitespace-nowrap text-paper shadow-[0_10px_30px_-8px_rgba(0,0,0,0.35)]"
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
    <section className="mt-8">
      <h2 className="mb-2 px-1 text-[13px] font-medium text-mute">{title}</h2>
      <div className="rounded-2xl bg-card p-1.5 shadow-card">{children}</div>
    </section>
  )
}

const rowClass = 'flex w-full items-center gap-4 rounded-xl px-3.5 py-3.5 text-left transition-colors hover:bg-tint/[0.04]'

function ValueRow({ label, value, onClick }: { label: string; value: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`group ${rowClass}`}>
      <span className="shrink-0 text-[16px] text-paper">{label}</span>
      {value && <span className="ml-auto min-w-0 truncate text-[15px] text-mute">{value}</span>}
      <svg viewBox="0 0 24 24" className={`${value ? '' : 'ml-auto '}h-4 w-4 shrink-0 text-dim transition-colors group-hover:text-soft`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m9 5 7 7-7 7" />
      </svg>
    </button>
  )
}

function SwitchRow({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onToggle} className={`justify-between ${rowClass}`}>
      <span className="text-[16px] text-paper">{label}</span>
      <span className={`relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-200 ${on ? 'bg-toss' : 'bg-tint/[0.14]'}`}>
        <motion.span
          className={`absolute top-[3px] left-[3px] h-5 w-5 rounded-full transition-colors duration-200 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.2)]`}
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

  // 본문 판(.app-panel) 안에 두면 헤더 아래에 깔려서, body에 바로 그린다 (색 토큰을 위해 data-theme만 붙임)
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div data-theme="light" className="fixed inset-0 z-50 flex items-end justify-center md:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-black/40" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="relative w-full max-w-[440px] rounded-t-3xl bg-card px-6 pt-6 pb-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] md:rounded-3xl md:pb-6"
          >
            <h2 className="mb-4 text-[18px] font-semibold text-paper">{title}</h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function TextEdit({ initial, onDone, multiline = false, hint }: { initial: string; onDone: (v: string) => void; multiline?: boolean; hint?: string }) {
  const [value, setValue] = useState(initial)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (value.trim()) onDone(value.trim())
  }
  const field = 'w-full rounded-2xl border border-line bg-card px-5 py-[14px] text-[16px] leading-6 text-paper outline-none transition-colors focus:border-dim'
  return (
    <form onSubmit={submit}>
      {multiline ? (
        <textarea autoFocus rows={3} value={value} onChange={(e) => setValue(e.target.value)} className={`${field} block resize-none`} />
      ) : (
        <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} className={field} />
      )}
      {hint && <p className="mt-2 text-xs text-mute">{hint}</p>}
      <button type="submit" disabled={!value.trim()} className={`mt-5 ${tossButton}`}>
        완료
      </button>
    </form>
  )
}
