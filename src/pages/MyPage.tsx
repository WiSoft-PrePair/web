import { AnimatePresence, motion } from 'motion/react'
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { AppShell, PageTitle } from '../components/AppShell'
import { BottomSheet } from '../components/BottomSheet'
import { tossButton } from '../components/auth'
import { ChoiceCards } from '../components/prefs'
import { FREQUENCY } from '../components/prefsOptions'
import { ApiError, changePassword, fetchMe, type Frequency, type Member, updateProfile, useMember } from '../lib/api'

const EASE = [0.22, 1, 0.36, 1] as const

type Sheet = 'nickname' | 'job' | 'frequency' | 'password' | null

/**
 * 마이페이지 (토스식 목록): 묶음별 흰 카드(내 정보: 이메일(보기만)·닉네임·희망 직무 · 질문 알림). 로그아웃·회원 탈퇴는 헤더 프로필 메뉴로 옮김. 넓은 화면은 90% 크기.
 * 행 = 이름 | 현재 값 + 화살표, 누르면 편집 창(모바일은 아래에서, 넓은 화면은 가운데).
 * 알림 채널은 스위치로 바로 적용. 저장 버튼 없이 바뀔 때마다 PATCH /api/members 로 저장.
 */
export default function MyPage() {
  // 화면 값은 로그인 세션의 내 정보에서 바로 읽는다. 들어올 때 서버의 최신 값으로 한 번 맞추고, 바꾸면 서버에 저장 → 세션 갱신 → 다시 그림
  const member = useMember()
  useEffect(() => {
    fetchMe().catch(() => {})
  }, [])
  const nickname = member?.nickname ?? ''
  const accountEmail = member?.email ?? ''
  const job = member?.job ?? ''
  const email = member?.notification !== 'kakao'
  const kakao = member?.notification === 'kakao' || member?.notification === 'both'
  const frequency = member?.frequency ?? 'every'
  const [sheet, setSheet] = useState<Sheet>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number>(undefined)

  const notify = (text: string) => {
    setToast(text)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 1600)
  }

  const save = (patch: Parameters<typeof updateProfile>[0]) =>
    updateProfile(patch).then(
      () => notify('저장했어요'),
      () => notify('저장하지 못했어요. 다시 시도해 주세요'),
    )

  // 알림 채널은 하나는 켜져 있어야 함 (서버 값: email | kakao | both)
  const toggleChannel = (which: 'email' | 'kakao') => {
    const on = which === 'email' ? email : kakao
    const other = which === 'email' ? kakao : email
    if (on && !other) return notify('알림 채널은 하나 이상 켜 두어야 해요')
    const nextEmail = which === 'email' ? !on : email
    const nextKakao = which === 'kakao' ? !on : kakao
    const notification: Member['notification'] = nextEmail && nextKakao ? 'both' : nextKakao ? 'kakao' : 'email'
    save({ notification })
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
          {/* 이메일로 가입한 사람만: 카카오 가입자는 비밀번호를 정한 적이 없다 */}
          {member?.provider === 'email' && <ValueRow label="비밀번호 변경" value="" onClick={() => setSheet('password')} />}
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
            setSheet(null)
            save({ nickname: v })
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
            setSheet(null)
            save({ job: v })
          }}
        />
      </BottomSheet>
      <BottomSheet open={sheet === 'password'} title="비밀번호 변경" desc="지금 비밀번호를 확인한 뒤 바꿔 드려요." onClose={() => setSheet(null)}>
        <PasswordEdit
          onCancel={() => setSheet(null)}
          onDone={() => {
            setSheet(null)
            notify('비밀번호를 바꿨어요')
          }}
        />
      </BottomSheet>
      <BottomSheet open={sheet === 'frequency'} title="알림 주기" desc="질문을 받을 때를 골라 주세요." onClose={() => setSheet(null)}>
        {/* 회원가입과 같은 선택 카드: 고르면 바로 저장하고 닫힌다 */}
        <ChoiceCards
          options={FREQUENCY}
          isOn={(v) => v === frequency}
          onPick={(v) => {
            setSheet(null)
            if (v !== frequency) save({ frequency: v as Frequency })
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

/** 비밀번호 변경: 지금 비밀번호 · 새 비밀번호(8자 이상), 아래 취소 · 변경. 지금 비밀번호가 틀리면 칸 아래에 알려 준다 */
function PasswordEdit({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const canSave = current.length >= 8 && next.length >= 8 && current !== next && !busy
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    setBusy(true)
    setError('')
    try {
      await changePassword(current, next)
      onDone()
    } catch (err) {
      setError(err instanceof ApiError && err.code === 'INVALID_PASSWORD' ? '지금 비밀번호가 맞지 않아요.' : err instanceof Error ? err.message : '비밀번호를 바꾸지 못했어요.')
      setBusy(false)
    }
  }
  const field = 'w-full rounded-2xl border border-transparent bg-tint/[0.04] px-4 py-3.5 text-[16px] leading-6 text-paper outline-none transition-colors placeholder:text-dim focus:border-dim focus:bg-card'
  return (
    <form onSubmit={submit} className="space-y-2">
      <input autoFocus type="password" autoComplete="current-password" aria-label="지금 비밀번호" placeholder="지금 비밀번호" value={current} onChange={(e) => setCurrent(e.target.value)} className={field} />
      <input type="password" autoComplete="new-password" aria-label="새 비밀번호" placeholder="새 비밀번호 (8자 이상)" value={next} onChange={(e) => setNext(e.target.value)} className={field} />
      {error ? (
        <p role="alert" className="px-1 pt-1 text-[13px] text-[#f04452]">
          {error}
        </p>
      ) : (
        current && next && current === next && <p className="px-1 pt-1 text-[13px] text-mute">지금과 다른 비밀번호로 정해 주세요.</p>
      )}
      <div className="grid grid-cols-[1fr_2fr] gap-2 pt-4">
        <button type="button" onClick={onCancel} className="h-[54px] rounded-2xl bg-tint/[0.05] text-[16px] font-semibold text-soft transition-colors hover:bg-tint/[0.08]">
          취소
        </button>
        <button type="submit" disabled={!canSave} className={tossButton}>
          {busy ? '바꾸는 중…' : '변경'}
        </button>
      </div>
    </form>
  )
}
