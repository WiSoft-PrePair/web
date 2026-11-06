import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useAppearance } from '../components/appearance'
import { ThemeRoot } from '../components/AppShell'
import { TAGS, type Tag } from '../data/questions'

/** 면접 시작 시 넘기는 것: 켜 둔 카메라·마이크 + 고른 질문 수 */
export type Media = { cam: MediaStream | null; mic: MediaStream; count: number; type: Tag }

/** 질문 수와 예상 시간 (질문당 약 2분) */
const COUNTS = [3, 5, 7] as const
const minutes = (n: number) => n * 2
type Status = 'loading' | 'ok' | 'denied' | 'none' | 'unsupported'

const stop = (s: MediaStream | null | undefined) => s?.getTracks().forEach((t) => t.stop())

/** 권한 거부 / 기기 없음 / 기타를 구분 */
function statusOf(e: unknown): Status {
  const name = e instanceof DOMException ? e.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied'
  return 'none'
}

const BARS = 16

/**
 * 화상 면접 준비: 면접 진행 화면과 같은 틀. 왼쪽(질문 자리)에 면접 설정, 그 아래 카메라·마이크 선택, 오른쪽(같은 자리·크기)에 내 카메라, 아래 막대에 소리 들어보기 · 면접 시작.
 * 마이크에서 소리가 잡혀야 시작할 수 있다. 카메라는 없어도 진행 가능.
 * 시작하면 켜 둔 카메라·마이크를 면접 화면에 그대로 넘긴다(넘긴 뒤 끄는 건 면접 화면 몫).
 */
export default function InterviewSetup({ onStart }: { onStart: (m: Media) => void }) {
  const { mode } = useAppearance()
  const video = useRef<HTMLVideoElement>(null)
  const meter = useRef<HTMLDivElement>(null)
  const handedOff = useRef(false)

  const [cam, setCam] = useState<MediaStream | null>(null)
  const [mic, setMic] = useState<MediaStream | null>(null)
  const [camStatus, setCamStatus] = useState<Status>('loading')
  const [micStatus, setMicStatus] = useState<Status>('loading')
  const [cams, setCams] = useState<MediaDeviceInfo[]>([])
  const [mics, setMics] = useState<MediaDeviceInfo[]>([])
  const [heard, setHeard] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [count, setCount] = useState<number>(5)
  // 질문 유형: 하나만 고른다. 그 유형으로 첫 질문을 하고, 답변에 맞춰 꼬리 질문으로 이어진다
  const [type, setType] = useState<Tag>('직무')
  const [playing, setPlaying] = useState(false)
  const [heardSpeaker, setHeardSpeaker] = useState(false)
  const speakerMeter = useRef<HTMLDivElement>(null)

  // 처음(과 '다시 시도') 권한 요청: 한 번에 요청하고, 실패하면 하나씩 다시
  useEffect(() => {
    let cancelled = false
    const keep = (kind: 'cam' | 'mic', s: MediaStream | null, status: Status) => {
      if (cancelled) return stop(s)
      if (kind === 'cam') {
        setCam((prev) => (stop(prev), s))
        setCamStatus(status)
      } else {
        setMic((prev) => (stop(prev), s))
        setMicStatus(status)
      }
    }
    ;(async () => {
      const md = navigator.mediaDevices
      if (!md?.getUserMedia) {
        keep('cam', null, 'unsupported')
        keep('mic', null, 'unsupported')
        return
      }
      try {
        const both = await md.getUserMedia({ video: true, audio: true })
        keep('cam', new MediaStream(both.getVideoTracks()), 'ok')
        keep('mic', new MediaStream(both.getAudioTracks()), 'ok')
      } catch {
        const [v, a] = await Promise.allSettled([md.getUserMedia({ video: true }), md.getUserMedia({ audio: true })])
        keep('cam', v.status === 'fulfilled' ? v.value : null, v.status === 'fulfilled' ? 'ok' : statusOf(v.reason))
        keep('mic', a.status === 'fulfilled' ? a.value : null, a.status === 'fulfilled' ? 'ok' : statusOf(a.reason))
      }
      if (cancelled) return
      const list = await md.enumerateDevices()
      if (cancelled) return
      setCams(list.filter((d) => d.kind === 'videoinput' && d.deviceId))
      setMics(list.filter((d) => d.kind === 'audioinput' && d.deviceId))
    })()
    return () => {
      cancelled = true
    }
  }, [attempt])

  // 지금 쓰는 스트림: 화면을 떠날 때(시작으로 넘긴 경우 제외) 끈다
  const live = useRef<{ cam: MediaStream | null; mic: MediaStream | null }>({ cam: null, mic: null })
  useEffect(() => {
    live.current = { cam, mic }
  }, [cam, mic])
  useEffect(
    () => () => {
      if (handedOff.current) return
      stop(live.current.cam)
      stop(live.current.mic)
    },
    [],
  )

  useEffect(() => {
    if (video.current) video.current.srcObject = cam
  }, [cam])

  // 마이크 소리 막대 (매 프레임 DOM만 갱신)
  useEffect(() => {
    if (!mic) return
    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 1024
    ctx.createMediaStreamSource(mic).connect(analyser)
    const buf = new Float32Array(analyser.fftSize)
    const loop = { raf: 0, loud: 0 }
    const tick = () => {
      analyser.getFloatTimeDomainData(buf)
      let sum = 0
      for (const v of buf) sum += v * v
      const level = Math.min(1, Math.sqrt(sum / buf.length) * 9)
      const lit = Math.round(level * BARS)
      meter.current?.querySelectorAll('span').forEach((el, i) => (el.dataset.on = String(i < lit)))
      // 잠깐 튄 잡음이 아니라 몇 프레임 이어지는 소리일 때 확인
      loop.loud = level > 0.22 ? loop.loud + 1 : 0
      if (loop.loud > 6) setHeard(true)
      loop.raf = requestAnimationFrame(tick)
    }
    loop.raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(loop.raf)
      void ctx.close()
    }
  }, [mic])

  const switchDevice = useCallback(async (kind: 'cam' | 'mic', deviceId: string) => {
    const constraints = kind === 'cam' ? { video: { deviceId: { exact: deviceId } } } : { audio: { deviceId: { exact: deviceId } } }
    try {
      const s = await navigator.mediaDevices.getUserMedia(constraints)
      if (kind === 'cam') {
        setCam((old) => (stop(old), s))
        setCamStatus('ok')
      } else {
        setMic((old) => (stop(old), s))
        setMicStatus('ok')
        setHeard(false)
      }
    } catch (e) {
      ;(kind === 'cam' ? setCamStatus : setMicStatus)(statusOf(e))
    }
  }, [])

  const deviceOf = (s: MediaStream | null) => s?.getTracks()[0]?.getSettings().deviceId ?? ''
  const blocked = camStatus === 'denied' || micStatus === 'denied' || micStatus === 'unsupported' || micStatus === 'none'
  const ready = mic !== null && heard

  const start = () => {
    if (!mic || !ready) return
    handedOff.current = true
    onStart({ cam, mic, count, type })
  }

  const field = 'h-11 w-full appearance-none rounded-xl border border-line bg-card pr-9 pl-3.5 text-[16px] text-paper sm:text-[14px] outline-none transition-colors focus:border-mute disabled:opacity-40'

  return (
    <ThemeRoot className="flex min-h-svh flex-col lg:h-svh text-soft [--side:var(--gutter)] lg:[--side:clamp(40px,6.25vw,120px)]">
      {/* 면접 진행 화면과 같은 틀: 헤더 없이 위 한 줄 */}
      <header className="flex items-center justify-between px-[var(--side)] py-5 text-[13px]">
        <Link to="/app/interview" className="flex items-center gap-1 text-mute transition-colors hover:text-paper">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
          화상 면접
        </Link>
        {/* 진행 화면과 같은 자리의 진행 점: 아직 시작 전이라 모두 회색 */}
        <ol aria-label={`질문 ${count}개, 시작 전`} className="flex items-center gap-1.5">
          {Array.from({ length: count }, (_, i) => (
            <li key={i} className="h-1.5 w-1.5 rounded-full bg-tint/20" />
          ))}
        </ol>
        <span className="w-[72px]" aria-hidden />
      </header>

      <main className="mx-auto grid w-full max-w-[1280px] min-h-0 flex-1 gap-10 px-[var(--side)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center">
        {/* 왼쪽 (진행 화면의 질문 자리): 면접 설정 */}
        <section aria-label="면접 설정" className="flex flex-col">
          <h1 className="text-[clamp(24px,2.4vw,34px)] leading-[1.35] font-semibold tracking-tight text-paper">어떤 면접을 볼까요?</h1>

          <div className="mt-8">
            <Field label="질문 유형">
              <div role="radiogroup" aria-label="질문 유형" className="grid h-11 grid-cols-4 gap-1 rounded-xl border border-line bg-card p-1">
                {TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={type === t}
                    onClick={() => setType(t)}
                    className={`rounded-lg text-[13px] whitespace-nowrap transition-colors ${type === t ? 'bg-tint/[0.12] font-medium text-paper' : 'text-mute hover:bg-tint/[0.05] hover:text-soft'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>
            <p className="mt-2.5 text-[12px] leading-relaxed text-mute">{type} 질문으로 시작해서, 내 답변에 맞춰 꼬리 질문이 이어져요.</p>
          </div>

          <div className="mt-6">
            <Field label="질문 수">
              <div role="radiogroup" aria-label="질문 수" className="grid h-11 grid-cols-3 gap-1 rounded-xl border border-line bg-card p-1">
                {COUNTS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={count === n}
                    onClick={() => setCount(n)}
                    className={`grid place-items-center rounded-lg whitespace-nowrap transition-colors ${count === n ? 'bg-tint/[0.12] text-paper' : 'text-mute hover:bg-tint/[0.05] hover:text-soft'}`}
                  >
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-[14px] font-medium">{n}개</span>
                      <span className={`text-[12px] text-mute`}>약 {minutes(n)}분</span>
                    </span>
                  </button>
                ))}
              </div>
            </Field>
          </div>

          {/* 기기 확인: 면접 설정과 소제목으로 나눈다 */}
          <h2 className="mt-9 text-[14px] font-medium text-paper">기기 확인</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <Select
                value={deviceOf(cam)}
                onChange={(id) => switchDevice('cam', id)}
                disabled={cams.length === 0}
                className={field}
                scheme={mode}
                label="카메라"
                icon={
                  <>
                    <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h9A1.5 1.5 0 0 1 15 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 16.5v-9Z M15 10.5l6-3.5v10l-6-3.5" />
                  </>
                }
              >
                {cams.length === 0 && <option value="">카메라 없음</option>}
                {cams.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `카메라 ${i + 1}`}
                  </option>
                ))}
              </Select>
              {/* 스피커: 마이크 확인 표시와 같은 말투 (해 보세요 → 확인됨). 확인 뒤에도 다시 누르면 또 들린다 */}
              <button
                type="button"
                onClick={() => {
                  if (playing) return
                  setPlaying(true)
                  playChime(
                    (level) => {
                      const lit = Math.round(level * BARS)
                      speakerMeter.current?.querySelectorAll('span').forEach((el, i) => (el.dataset.on = String(i < lit)))
                    },
                    () => {
                      setPlaying(false)
                      setHeardSpeaker(true)
                    },
                  )
                }}
                className={`mt-2 flex items-center gap-1 text-[12px] transition-colors hover:text-paper ${heardSpeaker || playing ? 'text-paper' : 'text-mute'}`}
              >
                {heardSpeaker && !playing && (
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                )}
                {playing ? '소리 나는 중…' : heardSpeaker ? '스피커 확인됨' : '눌러서 소리를 들어 보세요'}
              </button>
              {/* 스피커 소리 막대: 내보내는 소리 크기만큼 찬다 (마이크 막대와 같은 줄) */}
              <div ref={speakerMeter} className="mt-2.5 flex h-1.5 items-center gap-[3px]" aria-hidden>
                {Array.from({ length: BARS }, (_, i) => (
                  <span key={i} data-on="false" className="h-full flex-1 rounded-full bg-tint/10 transition-colors duration-75 data-[on=true]:bg-grass" />
                ))}
              </div>
            </div>
            <div>
              <Select
                value={deviceOf(mic)}
                onChange={(id) => switchDevice('mic', id)}
                disabled={mics.length === 0}
                className={field}
                scheme={mode}
                label="마이크"
                icon={
                  <>
                    <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z M19 11a7 7 0 0 1-14 0M12 18v3" />
                  </>
                }
              >
                {mics.length === 0 && <option value="">마이크 없음</option>}
                {mics.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `마이크 ${i + 1}`}
                  </option>
                ))}
              </Select>
              <Status ok={ready} text={micStatus !== 'ok' && micStatus !== 'loading' ? '마이크 사용 불가' : heard ? '마이크 확인됨' : '아무 말이나 해 보세요'} />
              {/* 마이크 소리 막대: 마이크 칸에만 */}
              <div ref={meter} className="mt-2.5 flex h-1.5 items-center gap-[3px]" aria-hidden>
                {Array.from({ length: BARS }, (_, i) => (
                  <span key={i} data-on="false" className="h-full flex-1 rounded-full bg-tint/10 transition-colors duration-75 data-[on=true]:bg-grass" />
                ))}
              </div>
            </div>
          </div>

          {blocked && (
            <div className="mt-6 rounded-xl bg-tint/[0.04] px-4 py-3.5 text-[13px] leading-relaxed text-soft">
              {micStatus === 'unsupported' ? (
                '이 브라우저에서는 카메라·마이크를 쓸 수 없어요. 최신 Chrome이나 Safari로 열어 주세요.'
              ) : (
                <>
                  {micStatus === 'none' ? '마이크를 찾지 못했어요. 마이크를 연결한 뒤 다시 시도해 주세요.' : '주소창 왼쪽 아이콘을 눌러 카메라·마이크를 허용한 뒤 다시 시도해 주세요.'}
                  <button type="button" onClick={() => setAttempt((n) => n + 1)} className="mt-2 block font-medium text-paper underline underline-offset-2">
                    다시 시도
                  </button>
                </>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={start}
            disabled={!ready}
            className="mt-10 h-12 w-full rounded-xl bg-cta text-sm font-semibold text-white transition-colors hover:bg-cta-hover disabled:cursor-not-allowed disabled:opacity-30"
          >
            면접 시작
          </button>
        </section>

        {/* 오른쪽 (진행 화면과 같은 자리·크기): 내 카메라 + 기기 선택 */}
        <section aria-label="기기 확인" className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line bg-ink-2 lg:aspect-auto lg:h-[min(62svh,560px)]">
          <video ref={video} autoPlay playsInline muted className={`h-full w-full -scale-x-100 object-cover ${cam ? '' : 'hidden'}`} />
          {!cam && (
            <div className="absolute inset-0 grid place-items-center px-6 text-center">
              <p className="text-[14px] text-mute">{camStatus === 'loading' ? '카메라를 켜는 중…' : camStatus === 'denied' ? '카메라 권한이 꺼져 있어요' : '카메라를 찾지 못했어요'}</p>
            </div>
          )}
        </section>
      </main>

      {/* 진행 화면의 조작 막대 높이만큼 비워 둔다: 시작해도 카메라 위치·크기가 그대로 */}
      <div aria-hidden className="hidden h-[104px] lg:block" />
    </ThemeRoot>
  )
}

function Field({ label, right, children }: { label: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[14px] font-medium text-paper">{label}</h2>
        {right}
      </div>
      {children}
    </div>
  )
}

/** 선택칸 아래 확인 상태: 확인되면 체크 + 진한 글씨 */
function Status({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p className={`mt-2 flex items-center gap-1 text-[12px] ${ok ? 'text-paper' : 'text-mute'}`}>
      {ok && (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m5 12 5 5 9-10" />
        </svg>
      )}
      {text}
    </p>
  )
}

function Select({
  value,
  onChange,
  disabled,
  className,
  scheme,
  label,
  icon,
  children,
}: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
  className: string
  scheme: string
  label: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="relative">
      {icon && (
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-mute"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {icon}
        </svg>
      )}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{ colorScheme: scheme }}
        className={`${className} truncate ${icon ? '!pl-10' : ''}`}
      >
        {children}
      </select>
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-mute"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
}

/** 스피커 확인용 짧은 두 음. 내보내는 소리의 크기(0~1)를 매 프레임 onLevel로 알려 주고, 끝나면 onEnd */
function playChime(onLevel: (level: number) => void, onEnd: () => void) {
  const ctx = new AudioContext()
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 512
  analyser.connect(ctx.destination)
  ;[660, 880].forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = ctx.currentTime + i * 0.22
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.25, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
    osc.connect(gain).connect(analyser)
    osc.start(t)
    osc.stop(t + 0.5)
  })
  const buf = new Float32Array(analyser.fftSize)
  const loop = { raf: 0 }
  const tick = () => {
    analyser.getFloatTimeDomainData(buf)
    let sum = 0
    for (const v of buf) sum += v * v
    onLevel(Math.min(1, Math.sqrt(sum / buf.length) * 6))
    loop.raf = requestAnimationFrame(tick)
  }
  loop.raf = requestAnimationFrame(tick)
  window.setTimeout(() => {
    cancelAnimationFrame(loop.raf)
    onLevel(0)
    onEnd()
    void ctx.close()
  }, 1000)
}
