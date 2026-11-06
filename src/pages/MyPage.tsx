import { AnimatePresence, motion } from 'motion/react'
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AppShell, PageTitle } from '../components/AppShell'
import { tossButton } from '../components/auth'
import { ChoiceCards } from '../components/prefs'
import { FREQUENCY } from '../components/prefsOptions'

const EASE = [0.22, 1, 0.36, 1] as const

type Sheet = 'nickname' | 'job' | 'frequency' | null

/**
 * 마이페이지 (화면만, 토스식 목록): 묶음별 흰 카드(내 정보: 이메일(보기만)·닉네임·희망 직무 · 질문 알림). 로그아웃·회원 탈퇴는 헤더 프로필 메뉴로 옮김. 넓은 화면은 90% 크기.
 * 행 = 이름 | 현재 값 + 화살표, 누르면 편집 창(모바일은 아래에서, 넓은 화면은 가운데).
 * 알림 채널은 스위치로 바로 적용. 저장 버튼 없이 바뀔 때마다 저장(목업은 토스트만).
 * TODO: GET /api/auth/me 로 채우고, 바뀔 때마다 member-service 수정 API 호출
 */
export default function MyPage() {
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
      {/* 넓은 화면은 전체를 90% 크기로 (모바일은 입력칸 확대 문제로 그대로) */}
      <div className="mx-auto max-w-[560px] sm:[zoom:0.9]">
        <PageTitle title="마이페이지" />

        <Section title="내 정보">
          {/* 로그인 이메일은 바꿀 수 없어 보기만 (화살표 없음) */}
          <InfoRow label="이메일" value={accountEmail} />
          <ValueRow label="닉네임" value={nickname} onClick={() => setSheet('nickname')} />
          <ValueRow label="희망 직무" value={job} onClick={() => setSheet('job')} />
        </Section>

        <Section title="질문 알림">
          <SwitchRow label="이메일로 받기" on={email} onToggle={() => toggleChannel('email')} />
          <SwitchRow label="카카오톡으로 받기" on={kakao} onToggle={() => toggleChannel('kakao')} />
          <ValueRow label="알림 주기" value={freqText(freq)} onClick={() => setSheet('frequency')} />
        </Section>

      </div>

      <BottomSheet open={sheet === 'nickname'} title="닉네임 바꾸기" desc="면접과 알림에서 이 이름으로 불러 드려요." onClose={() => setSheet(null)}>
        <TextEdit
          initial={nickname}
          max={12}
          placeholder="어떻게 불러 드릴까요?"
          onCancel={() => setSheet(null)}
          onDone={(v) => {
            setNickname(v)
            setSheet(null)
            notify('저장했어요')
          }}
        />
      </BottomSheet>
      <BottomSheet open={sheet === 'job'} title="희망 직무" desc="자유롭게 적을수록 질문이 더 잘 맞춰져요." onClose={() => setSheet(null)}>
        <TextEdit
          multiline
          max={100}
          placeholder="예: 백엔드 개발자 (Spring, 대용량 트래픽)"
          initial={job}
          onCancel={() => setSheet(null)}
          onDone={(v) => {
            setJob(v)
            setSheet(null)
            notify('저장했어요')
          }}
        />
      </BottomSheet>
      <BottomSheet open={sheet === 'frequency'} title="알림 주기" desc="질문을 받을 때를 골라 주세요." onClose={() => setSheet(null)}>
        {/* 회원가입과 같은 선택 카드: 고르면 바로 저장하고 닫힌다 */}
        <ChoiceCards
          options={FREQUENCY}
          isOn={(v) => v === frequency}
          onPick={(v) => {
            setFrequency(v)
            setSheet(null)
            notify('저장했어요')
          }}
        />
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 px-3.5 py-3.5">
      <span className="shrink-0 text-[16px] text-paper">{label}</span>
      <span className="ml-auto min-w-0 truncate text-[15px] text-mute">{value}</span>
    </div>
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

/** 모바일은 아래에서 올라오는 시트(손잡이 막대), 넓은 화면은 가운데 창. 제목 + 한 줄 설명 + 오른쪽 위 닫기 */
function BottomSheet({ open, title, desc, onClose, children }: { open: boolean; title: string; desc?: string; onClose: () => void; children: ReactNode }) {
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
        <motion.div data-theme="light" className="fixed inset-0 z-50 flex items-end justify-center md:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <button type="button" aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-black/35" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 32, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 32, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="relative w-full max-w-[420px] rounded-t-[28px] bg-card px-6 pt-3 pb-7 shadow-[0_24px_64px_-24px_rgba(16,24,40,0.4)] md:rounded-[28px] md:pt-6 md:pb-6"
          >
            <span aria-hidden className="mx-auto mb-4 block h-1 w-10 rounded-full bg-tint/15 md:hidden" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[19px] font-semibold tracking-tight text-paper">{title}</h2>
                {desc && <p className="mt-1 text-[14px] text-mute">{desc}</p>}
              </div>
              <button type="button" onClick={onClose} aria-label="닫기" className="-mt-1 -mr-2 grid h-9 w-9 shrink-0 place-items-center rounded-full text-mute transition-colors hover:bg-tint/[0.06] hover:text-paper">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <div className="mt-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** 글 고치기: 회색 칸 + 글자 수, 아래 취소 · 저장 (바뀐 게 없거나 비면 저장 막음) */
function TextEdit({
  initial,
  onDone,
  onCancel,
  multiline = false,
  max,
  placeholder,
}: {
  initial: string
  onDone: (v: string) => void
  onCancel: () => void
  multiline?: boolean
  max: number
  placeholder?: string
}) {
  const [value, setValue] = useState(initial)
  const trimmed = value.trim()
  const canSave = trimmed !== '' && trimmed !== initial.trim()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (canSave) onDone(trimmed)
  }
  const field = 'w-full rounded-2xl border border-transparent bg-tint/[0.04] px-4 py-3.5 text-[16px] leading-6 text-paper outline-none transition-colors placeholder:text-dim focus:border-dim focus:bg-card'
  return (
    <form onSubmit={submit}>
      {multiline ? (
        <textarea autoFocus rows={3} maxLength={max} placeholder={placeholder} value={value} onChange={(e) => setValue(e.target.value)} className={`${field} block resize-none`} />
      ) : (
        <input autoFocus maxLength={max} placeholder={placeholder} value={value} onChange={(e) => setValue(e.target.value)} className={field} />
      )}
      <p className="mt-2 text-right text-[12px] text-mute tabular-nums">
        {value.length} / {max}
      </p>
      <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2">
        <button type="button" onClick={onCancel} className="h-[54px] rounded-2xl bg-tint/[0.05] text-[16px] font-semibold text-soft transition-colors hover:bg-tint/[0.08]">
          취소
        </button>
        <button type="submit" disabled={!canSave} className={tossButton}>
          저장
        </button>
      </div>
    </form>
  )
}
