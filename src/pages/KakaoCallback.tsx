import { motion } from 'motion/react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { AuthShell, BrandLogo, KakaoMark, bareInput, boxInput, boxWrap, tossButton } from '../components/auth'
import { BottomSheet } from '../components/BottomSheet'
import { Consents } from '../components/Consents'
import { useConsents } from '../components/useConsents'
import { Stepper } from '../components/Stepper'
import { Welcome } from '../components/Welcome'
import { kakaoCallback, kakaoRegister, peekKakaoState, takeKakaoState } from '../lib/api'

const EASE = [0.22, 1, 0.36, 1] as const
type NewMember = NonNullable<Awaited<ReturnType<typeof kakaoCallback>>>

/**
 * 카카오 로그인에서 돌아오는 곳 (/auth/kakao/callback?code&state).
 * 기존 회원이면 바로 /app, 새 회원이면 회원가입 2단계와 같은 '직무 설정'만 받고 가입을 끝낸다.
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
    // 로딩 → 직무 입력이 같은 위치에서 바뀌도록 둘 다 위에 붙인다 (오류·환영은 가운데)
    <AuthShell header={false} align={error || joined ? 'center' : 'top'}>
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

/** 새 카카오 회원: 직무 (회원가입 2단계와 같은 항목) */
type Joined = { job: string }

function Settings({ data, onDone }: { data: NewMember; onDone: (j: Joined) => void }) {
  const navigate = useNavigate()
  const [job, setJob] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const consents = useConsents()
  const canSubmit = job.trim()
  // 이메일 가입과 같게: '가입하기'를 누를 때 약관 동의를 바텀시트로 받는다
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
      await kakaoRegister({ registrationToken: data.registrationToken, job: job.trim() }, data.prefilledData)
      onDone({ job: job.trim() })
    } catch (err) {
      // 등록 토큰은 10분만 유효하다
      setError(err instanceof Error ? err.message : '가입하지 못했어요.')
      setBusy(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}>
      {/* 이메일 가입 2단계와 같은 단계 막대: 계정 생성은 카카오로 끝났으니 2/2. 막대는 표시만, ‹는 로그인으로 */}
      <Stepper step={2} canGoNext={false} locked onGo={() => {}} onBack={() => navigate('/login', { replace: true })} />
      <h1 className="sr-only">카카오 가입 · 직무 설정</h1>

      <form onSubmit={onSubmit} className="mt-10 space-y-6">
        {/* 카카오 계정 이메일: 이메일 가입의 '인증됨' 칸과 같은 모양. 바꿀 수 없고 커서·포커스도 가지 않는다 */}
        <div>
          <span className="block pl-1 text-[13px] font-medium text-soft">이메일</span>
          <div className={`mt-2 cursor-default ${boxWrap}`}>
            <input aria-label="이메일" type="email" value={data.prefilledData.email} readOnly tabIndex={-1} className={`${bareInput} pointer-events-none text-soft`} />
            <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-soft">
              <KakaoMark className="h-3.5 w-3.5" /> 카카오
            </span>
          </div>
        </div>
        <label className="block">
          <span className="block pl-1 text-[13px] font-medium text-soft">직무</span>
          <textarea
            aria-label="직무"
            rows={1}
            placeholder="예: 백엔드 개발자, 마케터"
            value={job}
            onChange={(e) => {
              setJob(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = `${e.target.scrollHeight}px`
            }}
            className={`mt-2 ${boxInput} block h-auto min-h-[54px] resize-none overflow-hidden py-[14px] leading-[24px]`}
          />
          <span className="mt-2.5 block pl-1 text-xs text-mute">적어 주신 직무에 맞는 질문을 매일 하나씩 드려요.</span>
        </label>
        <div className="pt-3">
          <button type="submit" disabled={!canSubmit || busy} className={tossButton}>
            {busy ? '가입하는 중…' : '가입하기'}
          </button>
          {error && (
            <p role="alert" className="mt-3 text-center text-[13px] text-[#f04452]">
              {error}
            </p>
          )}
        </div>
      </form>

      <BottomSheet open={consentOpen} title="약관에 동의해 주세요" desc="가입하기 전에 확인해 주세요." onClose={() => setConsentOpen(false)}>
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
          동의하고 가입하기
        </button>
      </BottomSheet>
    </motion.div>
  )
}
