import { motion } from 'motion/react'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ThemeRoot } from '../components/AppShell'
import { minutes } from '../data/interviewSettings'
import { Spinner } from './InterviewPrep'

type Status = 'loading' | 'ok' | 'denied' | 'none' | 'unsupported'

const stop = (s: MediaStream | null | undefined) => s?.getTracks().forEach((t) => t.stop())

/** 권한 거부 / 기기 없음 / 기타를 구분 */
function statusOf(e: unknown): Status {
  const name = e instanceof DOMException ? e.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied'
  return 'none'
}

/** 작은 소리 막대 칸 수 */
const BARS = 5
/** 질문을 띄운 뒤 면접관이 읽는 시간 (목업) */
const SPEAK_SEC = 3

/**
 * 화상 면접 2단계 · 면접실 (밝은 흰 화면): 기기 확인과 면접을 한 화면에서.
 * 왼쪽 위 질문 카드, 가운데 AI 면접관 원 + 상태 문구 + 버튼(시작 전 = 면접 시작, 시작 뒤 = 답변 완료), 오른쪽 아래 내 카메라(작게),
 * 아래 가운데 마이크·스피커·카메라 알약(장치 이름 ▾) + 종료.
 * 면접 시작을 누르면 전체 화면으로 바꾼다(브라우저가 막으면 그냥 진행). 끝나거나 나가면 전체 화면을 푼다.
 * 마이크에서 소리가 잡혀야 시작할 수 있다. 카메라는 없어도 진행 가능. 이력서 분석이 덜 끝났으면 끝날 때까지 시작을 잠깐 막는다.
 * TODO: interview-service 연동(질문·꼬리질문·TTS), 답변 녹음·음성 인식
 */
export default function InterviewRoom({ questions, analyzing, onFinish }: { questions: string[]; analyzing: boolean; onFinish: () => void }) {
  const navigate = useNavigate()
  const video = useRef<HTMLVideoElement>(null)
  const meter = useRef<HTMLDivElement>(null)

  const [cam, setCam] = useState<MediaStream | null>(null)
  const [mic, setMic] = useState<MediaStream | null>(null)
  const [camStatus, setCamStatus] = useState<Status>('loading')
  const [micStatus, setMicStatus] = useState<Status>('loading')
  const [cams, setCams] = useState<MediaDeviceInfo[]>([])
  const [mics, setMics] = useState<MediaDeviceInfo[]>([])
  const [heard, setHeard] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [camOn, setCamOn] = useState(true)
  const [micOn, setMicOn] = useState(true)

  // 면접 진행 상태
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [seconds, setSeconds] = useState(0)
  // 지금 질문을 시작한 시각 (답변 시간 = 전체 - 이 값)
  const [questionStart, setQuestionStart] = useState(0)

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

  // 지금 쓰는 스트림: 화면을 떠날 때 끈다
  const live = useRef<{ cam: MediaStream | null; mic: MediaStream | null }>({ cam: null, mic: null })
  useEffect(() => {
    live.current = { cam, mic }
  }, [cam, mic])
  useEffect(
    () => () => {
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

  // 진행 시간 (면접 시작 뒤부터)
  useEffect(() => {
    if (!started) return
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(t)
  }, [started])

  const switchDevice = useCallback(async (kind: 'cam' | 'mic', deviceId: string) => {
    const constraints = kind === 'cam' ? { video: { deviceId: { exact: deviceId } } } : { audio: { deviceId: { exact: deviceId } } }
    try {
      const s = await navigator.mediaDevices.getUserMedia(constraints)
      if (kind === 'cam') {
        setCam((old) => (stop(old), s))
        setCamStatus('ok')
        setCamOn(true)
      } else {
        setMic((old) => (stop(old), s))
        setMicStatus('ok')
        setMicOn(true)
        setHeard(false)
      }
    } catch (e) {
      ;(kind === 'cam' ? setCamStatus : setMicStatus)(statusOf(e))
    }
  }, [])

  // 끄고 켜기: 장치를 놓지 않고 트랙만 멈춘다 (다시 켤 때 권한·지연 없음)
  const toggleCam = () => {
    if (!cam) return
    cam.getVideoTracks().forEach((t) => (t.enabled = !camOn))
    playToggle(!camOn)
    setCamOn(!camOn)
  }
  const toggleMic = () => {
    if (!mic) return
    mic.getAudioTracks().forEach((t) => (t.enabled = !micOn))
    playToggle(!micOn)
    setMicOn(!micOn)
  }

  const deviceOf = (s: MediaStream | null) => s?.getTracks()[0]?.getSettings().deviceId ?? ''
  const blocked = camStatus === 'denied' || micStatus === 'denied' || micStatus === 'unsupported' || micStatus === 'none'
  const ready = mic !== null && heard

  const start = () => {
    if (!ready || analyzing) return
    // 버튼을 누른 순간에만 전체 화면 요청이 허용된다. 거절되거나 지원하지 않으면 그냥 진행
    document.documentElement.requestFullscreen?.().catch(() => {})
    setStarted(true)
  }
  const exitFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
  }
  const leave = () => {
    exitFullscreen()
    navigate('/app/interview')
  }
  const last = index === questions.length - 1
  const next = () => {
    if (!started) return
    // 면접이 끝나면 카메라·마이크를 바로 끄고 리포트 화면으로
    if (last) {
      stop(cam)
      stop(mic)
      exitFullscreen()
      return onFinish()
    }
    setIndex(index + 1)
    setQuestionStart(seconds)
  }
  const speaking = started && seconds - questionStart < SPEAK_SEC

  // 스페이스 키로도 다음으로 (버튼에 포커스가 있으면 버튼 자체 동작에 맡긴다)
  useEffect(() => {
    if (!started) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat || (e.target as HTMLElement).closest('button, input, textarea, select')) return
      e.preventDefault()
      next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // 작은 소리 막대: 소리 크기만큼 칸이 찬다
  const meterBars = (ref: typeof meter) => (
    <div ref={ref} className="flex h-3 items-end gap-[2px]" aria-hidden>
      {Array.from({ length: BARS }, (_, i) => (
        <span key={i} data-on="false" style={{ height: `${40 + i * 15}%` }} className="w-[3px] rounded-full bg-tint/15 transition-colors duration-75 data-[on=true]:bg-toss" />
      ))}
    </div>
  )

  // 가운데 원 아래 상태 문구
  const status = !started
    ? blocked
      ? micStatus === 'unsupported'
        ? '이 브라우저에서는 카메라와 마이크를 쓸 수 없어요. 최신 Chrome이나 Safari로 열어 주세요.'
        : micStatus === 'none'
          ? '마이크를 찾지 못했어요. 마이크를 연결한 뒤 다시 시도해 주세요.'
          : '카메라와 마이크 권한이 필요해요. 주소창 왼쪽 아이콘에서 허용해 주세요.'
      : ready
        ? '준비가 모두 끝났어요. 시작하면 전체 화면으로 바뀌어요.'
        : '마이크가 잘 들리는지 아무 말이나 해 볼까요?'
    : speaking
      ? '면접관이 질문을 읽고 있어요. 차분히 들어 주세요.'
      : '이제 답변할 차례예요. 편하게 말해 주세요.'

  return (
    <ThemeRoot className="relative h-svh overflow-hidden text-soft">
      {/* 왼쪽 위: 질문 카드 (시작 전에는 면접 안내) */}
      <section
        aria-live="polite"
        className="absolute top-6 left-6 w-[min(440px,calc(100vw-48px))] rounded-3xl border border-line bg-[#f7f8fa] p-5 max-md:top-4 max-md:left-4 max-md:w-[calc(100vw-32px)]"
      >
        {started ? (
          <>
            <p className="flex items-baseline gap-1 pl-1 font-semibold text-paper">
              <span className="text-[17px]">질문 {index + 1}</span>
              <span className="text-[13px] font-medium text-mute">/{questions.length}</span>
            </p>
            <p className="mt-2.5 pl-1 text-[12px] text-mute">질문 내용</p>
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-2 rounded-2xl bg-tint/[0.04] px-4 py-3 text-[14px] leading-[1.65] break-keep text-paper"
            >
              {questions[index]}
            </motion.div>
          </>
        ) : (
          // 시작 전: 몇 개 · 얼마나 걸리는지 + 진행 방법 세 줄 (색 없이 연한 번호 + 글)
          <>
            <p className="text-[17px] font-semibold text-paper">곧 면접을 시작해요</p>
            <p className="mt-1 text-[13px] text-mute">
              질문 {questions.length}개 · 약 {minutes(questions.length)}분
            </p>
            <ol className="mt-4 space-y-2 text-[14px] text-soft">
              {['면접관이 질문을 읽어 드려요.', '편하게 말로 답해 주세요.', '다 말했으면 답변 완료를 눌러 주세요.'].map((t, i) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="w-3 shrink-0 text-[13px] text-mute tabular-nums">{i + 1}</span>
                  {t}
                </li>
              ))}
            </ol>
          </>
        )}
      </section>

      {/* 가운데: AI 면접관 원 + 상태 + 버튼 */}
      <main className="grid h-full place-items-center px-6">
        <div className="flex flex-col items-center">
          <div className="relative grid h-36 w-36 place-items-center">
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full bg-toss/15 blur-xl"
              animate={speaking ? { scale: [1, 1.18, 1], opacity: [0.5, 1, 0.5] } : { scale: 1, opacity: 0 }}
              transition={speaking ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.5 }}
            />
            <span className={`relative grid h-32 w-32 place-items-center rounded-full border-2 bg-white transition-colors duration-300 ${started && !speaking ? 'border-toss' : 'border-toss/30'}`}>
              <Wave active={speaking} />
            </span>
          </div>
          <p className="mt-6 text-[15px] text-mute">{status}</p>
          {blocked && micStatus !== 'unsupported' && (
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className="mt-2 text-[14px] font-medium text-paper underline underline-offset-4">
              다시 시도
            </button>
          )}

          <div className="mt-8 h-11">
            {started ? (
              speaking ? null : (
                // 답변 완료 + 아래 가운데 작은 안내 (자리를 차지하지 않게 겹쳐 둬서 위아래가 움직이지 않는다)
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="relative flex flex-col items-center">
                  <button type="button" onClick={next} aria-keyshortcuts="Space" className="h-11 rounded-xl bg-toss px-6 text-[15px] font-semibold text-white transition-colors hover:bg-toss-hover">
                    {last ? '면접 마치기' : '답변 완료'}
                  </button>
                  <p className="absolute top-full mt-2.5 text-[12px] whitespace-nowrap text-mute/80 max-md:hidden">스페이스바를 눌러도 다음으로 넘어가요.</p>
                </motion.div>
              )
            ) : (
              <button
                type="button"
                onClick={start}
                disabled={!ready || analyzing}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-toss px-6 text-[15px] font-semibold text-white transition-colors hover:bg-toss-hover disabled:cursor-not-allowed disabled:opacity-30"
              >
                {analyzing ? (
                  <>
                    <Spinner /> 이력서 분석 마무리 중…
                  </>
                ) : (
                  '면접 시작'
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* 오른쪽 아래: 내 카메라 (작게) */}
      <div className="absolute right-6 bottom-24 aspect-[4/3] w-[clamp(140px,18vw,260px)] overflow-hidden rounded-2xl bg-[#e9edf2] shadow-card max-md:right-4 max-md:bottom-[88px] max-md:w-28">
        <video ref={video} autoPlay playsInline muted className={`h-full w-full -scale-x-100 object-cover ${cam && camOn ? '' : 'hidden'}`} />
        {!(cam && camOn) && (
          <div className="grid h-full place-items-center px-3 text-center text-[12px] text-mute">
            {camStatus === 'loading' ? '카메라를 켜는 중…' : !cam ? (camStatus === 'denied' ? '카메라 권한이 꺼져 있어요' : '카메라 없음') : '카메라 꺼짐'}
          </div>
        )}
        <span className="absolute bottom-2 left-2 rounded bg-black/40 px-1.5 py-0.5 text-[11px] text-white">나</span>
      </div>

      {/* 아래 가운데: 마이크 · 스피커 · 카메라 알약 + 종료 */}
      <footer className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-2 px-4">
        <DevicePill icon={MIC_ICON} off={!micOn} label="마이크" devices={mics} value={deviceOf(mic)} onPick={(id) => switchDevice('mic', id)} onToggle={toggleMic}>
          {meterBars(meter)}
        </DevicePill>
        <button
          type="button"
          onClick={() => {
            if (playing) return
            setPlaying(true)
            playChime(
              () => {},
              () => setPlaying(false),
            )
          }}
          className={`${PILL} max-sm:hidden`}
          title="눌러서 소리 들어 보기"
        >
          <PillIcon d={SPEAKER_ICON} />
          <span className="max-w-[110px] truncate">{playing ? '소리 나는 중' : '스피커 확인'}</span>
        </button>
        <DevicePill icon={CAM_ICON} off={!camOn || !cam} label="카메라" devices={cams} value={deviceOf(cam)} onPick={(id) => switchDevice('cam', id)} onToggle={toggleCam} />
        <button
          type="button"
          onClick={leave}
          aria-label="면접 나가기"
          title="면접 나가기"
          className="ml-2 grid h-11 w-11 place-items-center rounded-full bg-[#f04452] text-white transition-colors hover:bg-[#e03a48]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
            <path d="M12 9c-2.6 0-5.1.5-7.3 1.6-.8.4-1.2 1.2-1.1 2.1l.3 1.8c.1.7.8 1.2 1.5 1.1l2.9-.5c.6-.1 1.1-.6 1.2-1.2l.2-1.5c1.5-.4 3.1-.4 4.6 0l.2 1.5c.1.6.6 1.1 1.2 1.2l2.9.5c.7.1 1.4-.4 1.5-1.1l.3-1.8c.1-.9-.3-1.7-1.1-2.1C17.1 9.5 14.6 9 12 9Z" />
          </svg>
        </button>
      </footer>
    </ThemeRoot>
  )
}

const PILL = 'flex h-11 items-center gap-2 rounded-full bg-tint/[0.05] px-4 text-[14px] text-soft transition-colors hover:bg-tint/[0.08]'
const CAM_ICON = 'M3 7.5A1.5 1.5 0 0 1 4.5 6h9A1.5 1.5 0 0 1 15 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 16.5v-9Z M15 10.5l6-3.5v10l-6-3.5'
const MIC_ICON = 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z M19 11a7 7 0 0 1-14 0M12 18v3'
const SPEAKER_ICON = 'M4 9.5h3.5L12 5.5v13l-4.5-4H4v-5Z M16 9a4 4 0 0 1 0 6 M18.5 6.5a7.5 7.5 0 0 1 0 11'

function PillIcon({ d, off }: { d: string; off?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-[18px] w-[18px] shrink-0 ${off ? 'text-[#f04452]' : 'text-soft'}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
      {off && <path d="M4 4l16 16" />}
    </svg>
  )
}

/** 장치 알약: 아이콘(누르면 켜고 끄기) · 장치 이름 ▾(누르면 장치 목록, 투명 select를 덮음) */
function DevicePill({
  icon,
  off,
  label,
  devices,
  value,
  onPick,
  onToggle,
  children,
}: {
  icon: string
  off: boolean
  label: string
  devices: MediaDeviceInfo[]
  value: string
  onPick: (id: string) => void
  onToggle: () => void
  children?: ReactNode
}) {
  const name = devices.find((d) => d.deviceId === value)?.label || (devices.length ? `${label} 1` : `${label} 없음`)
  return (
    <div className="flex h-11 items-center rounded-full bg-tint/[0.05] text-[14px] text-soft">
      <button
        type="button"
        onClick={onToggle}
        aria-label={off ? `${label} 켜기` : `${label} 끄기`}
        title={off ? `${label} 켜기` : `${label} 끄기`}
        className="flex h-full items-center gap-1.5 rounded-l-full pr-1 pl-4 transition-colors hover:bg-tint/[0.05]"
      >
        <PillIcon d={icon} off={off} />
        {children}
      </button>
      <label className="relative flex h-full items-center gap-1.5 rounded-r-full pr-3.5 pl-1.5 transition-colors hover:bg-tint/[0.05] max-sm:pr-3 max-sm:pl-1">
        <span className="max-w-[110px] truncate max-sm:hidden">{name}</span>
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-mute" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
        <select
          aria-label={`${label} 장치 선택`}
          value={value}
          onChange={(e) => onPick(e.target.value)}
          disabled={devices.length === 0}
          className="absolute inset-0 w-full cursor-pointer opacity-0 disabled:cursor-default"
        >
          {devices.map((d, i) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `${label} ${i + 1}`}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

function Wave({ active }: { active: boolean }) {
  return (
    <div className="flex h-9 items-center gap-[6px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-[7px] rounded-full bg-toss"
          animate={active ? { height: [10, i === 1 ? 34 : 20, 10] } : { height: i === 1 ? 26 : 10 }}
          transition={active ? { duration: 0.7 + i * 0.12, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 } : { duration: 0.4 }}
        />
      ))}
    </div>
  )
}

/** 마이크·카메라를 켜고 끌 때 짧은 '띠링': 켜면 올라가는 두 음, 끄면 내려가는 두 음 */
function playToggle(on: boolean) {
  const ctx = new AudioContext()
  const notes = on ? [880, 1320] : [1320, 880]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = ctx.currentTime + i * 0.09
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.12, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.2)
  })
  window.setTimeout(() => void ctx.close(), 500)
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
