import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { useAppearance } from '../components/appearance'
import { AppShell } from '../components/AppShell'
import { primaryButtonClass } from '../components/auth'
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

const BARS = 24

/**
 * 화상 면접 준비: 카메라 미리보기 · 마이크 소리 확인 · 스피커 소리 듣기.
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

  const field = 'h-11 w-full appearance-none rounded-xl border border-line bg-ink pr-9 pl-3.5 text-[14px] text-paper outline-none transition-colors focus:border-mute disabled:opacity-40'

  return (
    <AppShell wide>
      <h1 className="sr-only">면접 준비</h1>

      <div className="mx-auto grid max-w-[1040px] gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12 lg:pt-4">
        {/* 왼쪽: 기기 세팅 (카메라 화면 + 카메라·마이크·스피커) */}
        <section aria-label="기기 세팅" className="min-w-0">
          <h2 className="mb-3 text-[14px] font-medium text-paper">기기 확인</h2>
          <div className="relative overflow-hidden rounded-2xl border border-line bg-ink-2">
            <div className="aspect-video" aria-hidden />
            <video ref={video} autoPlay playsInline muted className={`absolute inset-0 h-full w-full -scale-x-100 object-cover ${cam ? '' : 'hidden'}`} />
            {!cam && (
              <div className="absolute inset-0 grid place-items-center px-6 text-center">
                <p className="text-[14px] text-mute">{camStatus === 'loading' ? '카메라를 켜는 중…' : camStatus === 'denied' ? '카메라 권한이 꺼져 있어요' : '카메라를 찾지 못했어요'}</p>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <Field label="카메라" right={<StatusText ok={cam !== null} text={cam ? '켜짐' : camStatus === 'loading' ? '확인 중' : '없이 진행해요'} />}>
                <Select value={deviceOf(cam)} onChange={(id) => switchDevice('cam', id)} disabled={cams.length === 0} className={field} scheme={mode}>
                  {cams.length === 0 && <option value="">카메라 없음</option>}
                  {cams.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `카메라 ${i + 1}`}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="mt-3 flex h-6 items-center justify-between text-[13px]">
                <span className="text-mute">스피커</span>
                <button type="button" onClick={playChime} className="flex items-center gap-1.5 text-soft transition-colors hover:text-paper">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
                  </svg>
                  소리 들어보기
                </button>
              </div>
            </div>
            <Field label="마이크" right={<StatusText ok={ready} text={micStatus !== 'ok' && micStatus !== 'loading' ? '사용할 수 없어요' : heard ? '확인됨' : '아무 말이나 해 보세요'} />}>
              <Select value={deviceOf(mic)} onChange={(id) => switchDevice('mic', id)} disabled={mics.length === 0} className={field} scheme={mode}>
                {mics.length === 0 && <option value="">마이크 없음</option>}
                {mics.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `마이크 ${i + 1}`}
                  </option>
                ))}
              </Select>
              <div ref={meter} className="mt-3 flex h-6 items-center gap-[3px]" aria-hidden>
                {Array.from({ length: BARS }, (_, i) => (
                  <span key={i} data-on="false" className="h-full flex-1 rounded-full bg-tint/[0.08] transition-colors duration-75 data-[on=true]:bg-grass" />
                ))}
              </div>
            </Field>
          </div>
        </section>

        {/* 오른쪽: 질문 설정 */}
        <section aria-label="질문 설정" className="flex flex-col">
          <h2 className="mb-3 text-[14px] font-medium text-paper">면접 설정</h2>
          <Field label="질문 유형">
            <div role="radiogroup" aria-label="질문 유형" className="grid h-11 grid-cols-4 gap-1 rounded-xl border border-line bg-ink p-1">
              {TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={type === t}
                  onClick={() => setType(t)}
                  className={`rounded-lg text-[13px] whitespace-nowrap transition-colors ${type === t ? 'bg-paper font-medium text-ink' : 'text-soft hover:bg-tint/[0.05]'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
          <p className="mt-2.5 text-[12px] leading-relaxed text-mute">{type} 질문으로 시작해서, 내 답변에 맞춰 꼬리 질문이 이어져요.</p>

          <div className="mt-6">
            <Field label="질문 수">
              <div role="radiogroup" aria-label="질문 수" className="grid h-11 grid-cols-3 gap-1 rounded-xl border border-line bg-ink p-1">
                {COUNTS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={count === n}
                    onClick={() => setCount(n)}
                    className={`grid place-items-center rounded-lg whitespace-nowrap transition-colors ${count === n ? 'bg-paper text-ink' : 'text-soft hover:bg-tint/[0.05]'}`}
                  >
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-[14px] font-medium">{n}개</span>
                      <span className={`text-[12px] ${count === n ? 'opacity-60' : 'text-mute'}`}>약 {minutes(n)}분</span>
                    </span>
                  </button>
                ))}
              </div>
            </Field>
          </div>

          {/* 왼쪽이 더 길면 남는 공간은 여기로: 시작 버튼이 왼쪽 아래끝에 맞춰진다 */}
          <div className="min-h-7 flex-1" />

          {blocked && (
            <div className="rounded-xl bg-tint/[0.04] px-4 py-3.5 text-[13px] leading-relaxed text-soft">
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

          <button type="button" onClick={start} disabled={!ready} className={`mt-5 h-11 !py-0 ${primaryButtonClass}`}>
            면접 시작
          </button>
        </section>
      </div>
    </AppShell>
  )
}

function Field({ label, right, children }: { label: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[13px]">
        <span className="text-mute">{label}</span>
        {right}
      </div>
      {children}
    </div>
  )
}

/** 이름 줄 오른쪽 상태: 확인되면 체크 + 진한 글씨 */
function StatusText({ ok, text }: { ok: boolean; text: string }) {
  return (
    <span className={`flex items-center gap-1 text-[12px] ${ok ? 'text-paper' : 'text-mute'}`}>
      {ok && (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m5 12 5 5 9-10" />
        </svg>
      )}
      {text}
    </span>
  )
}

function Select({
  value,
  onChange,
  disabled,
  className,
  scheme,
  children,
}: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
  className: string
  scheme: string
  children: ReactNode
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={{ colorScheme: scheme }} className={`${className} truncate`}>
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

/** 스피커 확인용 짧은 두 음 */
function playChime() {
  const ctx = new AudioContext()
  ;[660, 880].forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = ctx.currentTime + i * 0.22
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.25, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.5)
  })
  window.setTimeout(() => void ctx.close(), 1200)
}
