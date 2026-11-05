import { AnimatePresence, motion } from 'motion/react'
import { type FormEvent, type ReactNode, useState } from 'react'
import { useNavigate } from 'react-router'
import { ChoiceCards } from '../components/prefs'
import { CHANNELS, type Channel, FREQUENCY } from '../components/prefsOptions'
import { AuthShell, EyeToggle, bareInput, lineInput, primaryButtonClass } from '../components/auth'

const EASE = [0.22, 1, 0.36, 1] as const
/** 가입 후 인사 화면을 보여 주는 시간 */
const WELCOME_MS = 2000
/** 단계 내용 넘김: 앞으로 가면 오른쪽에서 들어와 왼쪽으로, 뒤로 가면 반대 */
const SLIDE = {
  enter: (d: number) => ({ opacity: 0, x: d * 28 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d * -28 }),
}

/**
 * 회원가입: 2단계 (1. 계정: 이메일 인증·비밀번호·닉네임 / 2. 질문 설정: 희망 직무·받는 곳·주기) → 완료. 화면만, API 연동은 아직.
 * 필드는 member-service 가입 API와 같다:
 *   POST /api/members/email (purpose REGISTER) → POST /api/members/email-verify
 *   → POST /api/members/register { email, password(8+), nickname, job, notification(email|kakao|both), frequency(every|weekly) }
 * 카카오는 로그인 화면에만 둔다. 신규 카카오 사용자는 OAuth 콜백 후 '질문 설정' 값만 추가로 받는다 (POST /api/auth/kakao/register).
 */


type Verify = 'idle' | 'sent' | 'verified'

export default function Signup() {
  const navigate = useNavigate()
  // 1: 계정 → 2: 질문 설정 → 완료
  const [step, setStep] = useState<1 | 2 | 'loading'>(1)
  const [showPassword, setShowPassword] = useState(false)

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [verify, setVerify] = useState<Verify>('idle')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [job, setJob] = useState('')
  const [channels, setChannels] = useState<Channel[]>([])
  // 서버 값으로: 둘 다 고르면 both
  const notification = channels.length === 2 ? 'both' : channels[0]
  const [frequency, setFrequency] = useState<string>()

  // 단계 이동 방향(앞으로 1, 뒤로 -1): 내용이 그 방향으로 밀려 나가고 들어온다
  const [dir, setDir] = useState(1)
  const go = (n: 1 | 2) => {
    setDir(typeof step !== 'number' || n > step ? 1 : -1)
    setStep(n)
  }

  const emailValid = /^\S+@\S+\.\S+$/.test(email)
  const accountValid = verify === 'verified' && password.length >= 8 && !!nickname.trim()
  const canSubmit = accountValid && job.trim() && notification && frequency

  const sendCode = () => {
    // TODO: POST /api/members/email { email, purpose: 'REGISTER' }
    setVerify('sent')
    setCode('')
  }
  // 6자리를 다 입력하면 자동으로 확인한다
  const onCodeChange = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 6)
    setCode(digits)
    // TODO: POST /api/members/email-verify { email, code }
    if (digits.length === 6) setVerify('verified')
  }
  const onNext = (e: FormEvent) => {
    e.preventDefault()
    if (accountValid) go(2)
  }
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    // TODO: POST /api/members/register
    // 인사 + 로딩을 잠깐 보여 준 뒤 메인으로 (목업: 실제로는 API 응답에 맞춰)
    setStep('loading')
    window.setTimeout(() => navigate('/app'), WELCOME_MS)
  }

  return (
    <AuthShell align={typeof step === 'number' ? 'top' : 'center'}>
      <AnimatePresence mode="wait">
        {typeof step === 'number' ? (
          <motion.div key="steps" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: EASE }}>
            {/* 단계 막대는 그대로 두고(채움·제목만 바뀜), 아래 내용만 옆으로 넘긴다 */}
            <Stepper
              step={step}
              canGoNext={accountValid}
              onGo={go}
              onBack={step === 1 ? () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/')) : () => go(1)}
            />
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              {step === 1 ? (
          <motion.div key="form" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28, ease: EASE }}>
            <h1 className="sr-only">회원가입 · 계정</h1>

            <form onSubmit={onNext} className="mt-12 space-y-7">
              <Field label="이메일">
                <div className="flex items-center gap-3 border-b border-line transition-colors focus-within:border-lime">
                  <input
                    aria-label="이메일"
                    type="email"
                    autoComplete="email"
                    value={email}
                    readOnly={verify === 'verified'}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (verify !== 'idle') setVerify('idle')
                    }}
                    className={`${bareInput} read-only:text-soft`}
                  />
                  {verify === 'verified' ? (
                    <span className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-lime">
                      <Check className="h-3.5 w-3.5" /> 인증됨
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={!emailValid}
                      onClick={sendCode}
                      className="shrink-0 text-sm font-medium text-lime transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:text-dim disabled:hover:opacity-100"
                    >
                      {verify === 'sent' ? '다시 받기' : '인증하기'}
                    </button>
                  )}
                </div>
              </Field>

              <AnimatePresence initial={false}>
                {verify === 'sent' && (
                  <Field key="code" label="인증번호" appear>
                    <OtpInput value={code} onChange={onCodeChange} />
                  </Field>
                )}
              </AnimatePresence>

              <Field label="비밀번호">
                <div className="flex items-center gap-3 border-b border-line transition-colors focus-within:border-lime">
                  <input
                    aria-label="비밀번호"
                    placeholder="8자 이상"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={bareInput}
                  />
                  <EyeToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                </div>
              </Field>

              <Field label="닉네임">
                <input aria-label="닉네임" placeholder="어떻게 불러 드릴까요?" autoComplete="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} className={lineInput} />
              </Field>

              <div className="pt-3">
                <button type="submit" disabled={!accountValid} className={primaryButtonClass}>
                  다음
                </button>
              </div>
            </form>
          </motion.div>
              ) : (
          <motion.div key="settings" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28, ease: EASE }}>
            <h1 className="sr-only">회원가입 · 질문 설정</h1>

            <form onSubmit={onSubmit} className="mt-12 space-y-7">
              <Field label="희망 직무" hint="자유롭게 적을수록 질문이 더 잘 맞춰져요.">
                <textarea
                  aria-label="희망 직무"
                  rows={1}
                  placeholder="예: 대용량 트래픽을 다루는 백엔드 개발자"
                  value={job}
                  onChange={(e) => {
                    setJob(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = `${e.target.scrollHeight}px`
                  }}
                  className={`${lineInput} resize-none overflow-hidden`}
                />
              </Field>

              <Field label="알림 채널" hint="둘 다 선택할 수 있어요.">
                <ChoiceCards
                  multiple
                  options={CHANNELS}
                  isOn={(v) => channels.includes(v as Channel)}
                  onPick={(v) => setChannels((cs) => (cs.includes(v as Channel) ? cs.filter((c) => c !== v) : [...cs, v as Channel]))}
                />
              </Field>

              <Field label="알림 주기">
                <ChoiceCards options={FREQUENCY} isOn={(v) => frequency === v} onPick={setFrequency} />
              </Field>

              <div className="pt-3">
                <button type="submit" disabled={!canSubmit} className={primaryButtonClass}>
                  가입하기
                </button>
                <p className="mt-3 text-center text-xs text-dim">가입하면 이용약관과 개인정보 처리방침에 동의하게 됩니다.</p>
              </div>
            </form>
          </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div key="welcome" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }} className="text-center">
            <h1 className="text-[26px] font-semibold tracking-tight">{nickname}님, 반가워요</h1>
            {/* 얇은 로딩 바: 다 차면 메인으로 */}
            <div className="mx-auto mt-8 h-[3px] w-40 overflow-hidden rounded-full bg-white/[0.08]" role="progressbar" aria-label="불러오는 중">
              <motion.div
                className="h-full rounded-full bg-lime"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: WELCOME_MS / 1000, ease: [0.65, 0, 0.35, 1] }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </AuthShell>
  )
}

/** 인증번호 6칸: 보이지 않는 입력칸 하나 위에 둥근 사각 칸 6개를 그린다. 6자리가 차면 자동 확인 */
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(true)
  return (
    <label className="relative mt-2.5 grid grid-cols-6 gap-2">
      <input
        aria-label="인증번호 6자리"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="absolute inset-0 h-full w-full cursor-text opacity-0"
      />
      {Array.from({ length: 6 }, (_, i) => {
        const current = focused && i === Math.min(value.length, 5)
        return (
          <span
            key={i}
            className={`grid h-12 place-items-center rounded-xl border bg-ink-2 font-display text-xl font-semibold text-paper transition-colors ${
              current ? 'border-lime' : i < value.length ? 'border-mute' : 'border-line'
            }`}
          >
            {value[i] ?? ''}
          </span>
        )
      })}
    </label>
  )
}

/** 단계 표시: 폼 폭만큼의 얇은 막대 두 칸. 지금 단계까지 흰색으로 채워진다. 막대를 눌러 이동(2단계는 계정 정보를 다 채운 뒤에만) */
function Stepper({ step, canGoNext, onGo, onBack }: { step: 1 | 2; canGoNext: boolean; onGo: (s: 1 | 2) => void; onBack: () => void }) {
  const steps = [
    { n: 1 as const, label: '1단계: 계정' },
    { n: 2 as const, label: '2단계: 질문 설정' },
  ]
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        aria-label="이전"
        className="-ml-2 mb-4 grid h-9 w-9 place-items-center rounded-full text-soft transition-colors hover:bg-white/[0.06] hover:text-paper"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
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
            {step === 1 ? '계정 만들기' : '질문 설정'}
          </motion.span>
        </AnimatePresence>
        <span className="text-sm text-mute">
          <span className="text-paper">{step}</span> / 2
        </span>
      </div>
    <nav aria-label="가입 단계" className="flex gap-2">
      {steps.map(({ n, label }) => {
        const filled = step >= n
        const enabled = n === 1 || canGoNext
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
            <span className="relative block h-[3px] overflow-hidden rounded-full bg-white/[0.08]">
              <motion.span
                className="absolute inset-0 origin-left rounded-full bg-lime"
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

/** 박스 대신 밑줄 하나만 있는 입력칸 */

function Field({ label, hint, hintTone, appear = false, children }: { label: string; hint?: string; hintTone?: 'lime'; appear?: boolean; children: ReactNode }) {
  return (
    <motion.div
      layout="position"
      transition={{ duration: 0.35, ease: EASE }}
      initial={appear ? { opacity: 0, y: -6 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, transition: { duration: 0.2 } }}
    >
      <span className="block text-[13px] text-soft">{label}</span>
      {children}
      {hint && <span className={`mt-2.5 block text-xs ${hintTone === 'lime' ? 'text-lime' : 'text-mute'}`}>{hint}</span>}
    </motion.div>
  )
}


function Check({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}
