import { motion } from 'motion/react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { AuthShell, BrandLogo, boxInput, tossButton } from '../components/auth'
import { BottomSheet } from '../components/BottomSheet'
import { Consents } from '../components/Consents'
import { useConsents } from '../components/useConsents'
import { Welcome } from '../components/Welcome'
import { ChoiceCards } from '../components/prefs'
import { CHANNELS, type Channel, FREQUENCY } from '../components/prefsOptions'
import { type Frequency, type Notification, kakaoCallback, kakaoRegister, peekKakaoState, takeKakaoState } from '../lib/api'

const EASE = [0.22, 1, 0.36, 1] as const
type NewMember = NonNullable<Awaited<ReturnType<typeof kakaoCallback>>>

/**
 * 카카오 로그인에서 돌아오는 곳 (/auth/kakao/callback?code&state).
 * 기존 회원이면 바로 /app, 새 회원이면 회원가입 2단계와 같은 '질문 설정'만 받고 가입을 끝낸다.
 */
export default function KakaoCallback() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // 주소만 보고 알 수 있는 실패는 처음부터 오류로 (카카오 취소, code 없음, 내가 시작한 로그인이 아님)
  const [error, setError] = useState(() => {
    if (params.get('error')) return '카카오 로그인을 취소했어요.'
    if (!params.get('code')) return '카카오에서 받은 정보가 없어요. 다시 시도해 주세요.'
    // 다른 사이트가 보낸 code로 로그인되는 것 막기
    if (params.get('state') !== peekKakaoState()) return '로그인 요청을 확인하지 못했어요. 다시 시도해 주세요.'
    return ''
  })
  const [newMember, setNewMember] = useState<NewMember | null>(null)
  // 새 회원이 가입을 마치면 이메일 가입과 같은 환영 화면을 보여 준다
  const [joined, setJoined] = useState<Joined | null>(null)
  // code는 한 번만 쓸 수 있다: 개발 모드(StrictMode)에서 effect가 두 번 돌아도 한 번만 보낸다
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    takeKakaoState()
    const code = params.get('code')
    if (error || !code) return
    kakaoCallback(code)
      .then((r) => (r ? setNewMember(r) : navigate('/app', { replace: true })))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '카카오 로그인에 실패했어요.'))
  }, [params, navigate, error])

  return (
    <AuthShell header={false}>
      <div className="sm:mx-auto sm:max-w-[400px] sm:[zoom:0.9]">
        {error ? (
          <div className="text-center">
            <h1 className="flex justify-center">
              <BrandLogo size={24} />
            </h1>
            <p role="alert" className="mt-8 text-[15px] leading-relaxed text-soft">
              {error}
            </p>
            <Link to="/login" replace className={`mt-8 grid place-items-center ${tossButton}`}>
              로그인으로 돌아가기
            </Link>
          </div>
        ) : joined ? (
          <Welcome {...joined} nickname={newMember?.prefilledData.nickname ?? ''} onStart={() => navigate('/app', { replace: true })} />
        ) : newMember ? (
          <Settings data={newMember} onDone={setJoined} />
        ) : (
          <div className="flex flex-col items-center gap-5 text-[15px] text-mute" aria-live="polite">
            <span aria-hidden className="h-6 w-6 animate-spin rounded-full border-2 border-tint/15 border-t-toss" />
            카카오 계정으로 로그인하고 있어요
          </div>
        )}
      </div>
    </AuthShell>
  )
}

/** 새 카카오 회원: 희망 직무 · 알림 채널 · 알림 주기 (회원가입 2단계와 같은 항목) */
type Joined = { job: string; frequency?: string; notification?: string }

function Settings({ data, onDone }: { data: NewMember; onDone: (j: Joined) => void }) {
  const [job, setJob] = useState('')
  const [channels, setChannels] = useState<Channel[]>([])
  const [frequency, setFrequency] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const notification = channels.length === 2 ? 'both' : channels[0]
  const consents = useConsents()
  const canSubmit = job.trim() && notification && frequency
  // 이메일 가입과 같게: '시작하기'를 누를 때 약관 동의를 바텀시트로 받는다
  const [consentOpen, setConsentOpen] = useState(false)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit || busy) return
    if (consents.requiredOk) submit()
    else setConsentOpen(true)
  }
  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      await kakaoRegister({ registrationToken: data.registrationToken, job: job.trim(), notification: notification as Notification, frequency: frequency as Frequency }, data.prefilledData)
      onDone({ job: job.trim(), frequency, notification })
    } catch (err) {
      // 등록 토큰은 10분만 유효하다
      setError(err instanceof Error ? err.message : '가입하지 못했어요.')
      setBusy(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}>
      {/* 맨 위 줄: 왼쪽 로그인으로 돌아가기(다른 카카오 계정으로 다시), 가운데 작은 로고 — 회원가입과 같은 모양 */}
      <div className="relative flex h-9 items-center justify-center">
        <Link
          to="/login"
          replace
          aria-label="로그인으로 돌아가기"
          className="absolute left-0 -ml-2 grid h-9 w-9 place-items-center rounded-full text-soft transition-colors hover:bg-tint/[0.06] hover:text-paper"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <BrandLogo size={17} />
      </div>
      <h1 className="mt-8 text-[24px] leading-snug font-semibold tracking-tight text-paper">
        {data.prefilledData.nickname}님,
        <br />
        질문 설정만 하면 끝나요
      </h1>
      <p className="mt-2 text-[14px] text-mute">{data.prefilledData.email}</p>

      <form onSubmit={onSubmit} className="mt-10 space-y-6">
        <label className="block">
          <span className="block pl-1 text-[13px] font-medium text-soft">희망 직무</span>
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
            className={`mt-2 ${boxInput} block h-auto min-h-[54px] resize-none overflow-hidden py-[14px] leading-[24px]`}
          />
          <span className="mt-2.5 block pl-1 text-xs text-mute">자유롭게 적을수록 질문이 더 잘 맞춰져요.</span>
        </label>
        <div>
          <span className="block pl-1 text-[13px] font-medium text-soft">알림 채널</span>
          <div className="mt-2">
            <ChoiceCards
              multiple
              options={CHANNELS}
              isOn={(v) => channels.includes(v as Channel)}
              onPick={(v) => setChannels((cs) => (cs.includes(v as Channel) ? cs.filter((c) => c !== v) : [...cs, v as Channel]))}
            />
          </div>
          <span className="mt-2.5 block pl-1 text-xs text-mute">둘 다 선택할 수 있어요.</span>
        </div>
        <div>
          <span className="block pl-1 text-[13px] font-medium text-soft">알림 주기</span>
          <div className="mt-2">
            <ChoiceCards options={FREQUENCY} isOn={(v) => frequency === v} onPick={setFrequency} />
          </div>
        </div>
        <div className="pt-3">
          <button type="submit" disabled={!canSubmit || busy} className={tossButton}>
            {busy ? '가입하는 중…' : '시작하기'}
          </button>
          {error && (
            <p role="alert" className="mt-3 text-center text-[13px] text-[#f04452]">
              {error}
            </p>
          )}
        </div>
      </form>

      <BottomSheet open={consentOpen} title="약관에 동의해 주세요" desc="PrePair를 시작하기 전에 확인해 주세요." onClose={() => setConsentOpen(false)}>
        <Consents checked={consents.checked} setChecked={consents.setChecked} />
        <button
          type="button"
          disabled={!consents.requiredOk}
          onClick={() => {
            setConsentOpen(false)
            submit()
          }}
          className={`mt-5 ${tossButton}`}
        >
          동의하고 시작하기
        </button>
      </BottomSheet>
    </motion.div>
  )
}
