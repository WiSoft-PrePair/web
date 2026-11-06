import { motion } from 'motion/react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ThemeRoot } from '../components/AppShell'
import type { Tag } from '../data/questions'
import InterviewSetup, { type Media } from './InterviewSetup'

// 목업 질문: 고른 유형의 첫 질문 → 꼬리 질문들 → 마지막 마무리 질문
const FIRST: Record<Tag, string> = {
  직무: '지원한 직무에서 가장 중요한 역량은 무엇이라고 생각하나요?',
  경험: '최근에 가장 몰입해서 해낸 일은 무엇이었나요?',
  협업: '동료와 의견이 달랐을 때 어떻게 풀어 갔는지 말씀해 주세요.',
  컬처핏: '일할 때 가장 중요하게 생각하는 가치는 무엇인가요?',
}
const FOLLOW_UPS = [
  '방금 말씀하신 내용에서, 본인이 직접 맡은 부분은 무엇이었나요?',
  '그때 다른 선택지는 없었나요? 왜 그 방법을 골랐나요?',
  '결과는 어땠고, 그걸 어떻게 확인했나요?',
  '다시 한다면 무엇을 다르게 하겠어요?',
  '그 경험이 지원한 일에 어떻게 이어질까요?',
]
const CLOSING = '마지막으로 하고 싶은 말이 있다면 해 주세요.'

/**
 * 화상 면접: 먼저 기기 점검(InterviewSetup) → '면접 시작'을 누르면 면접 화면.
 * 헤더 없이 집중: 위쪽 녹화 시간·진행 점·나가기 / 왼쪽 큰 질문 + AI 면접관 표시 + 답변 시간 + 답변 완료 버튼 / 오른쪽 내 카메라 크게/ 아래 막대에 마이크·카메라.
 * TODO: interview-service 연동(질문·꼬리질문·TTS), 답변 녹음·음성 인식
 */
export default function MockInterview() {
  const [media, setMedia] = useState<Media | null>(null)
  // 면접 화면을 떠날 때 카메라·마이크 끄기 (장치는 이 컴포넌트가 끝까지 들고 있다)
  const held = useRef<Media | null>(null)
  useEffect(() => {
    held.current = media
  }, [media])
  useEffect(
    () => () => {
      const m = held.current
      if (m) [m.cam, m.mic].forEach((s) => s?.getTracks().forEach((t) => t.stop()))
    },
    [],
  )
  return media ? <Live media={media} /> : <InterviewSetup onStart={setMedia} />
}

function Live({ media }: { media: Media }) {
  const navigate = useNavigate()
  const questions = [FIRST[media.type], ...FOLLOW_UPS.slice(0, media.count - 2), CLOSING]
  const video = useRef<HTMLVideoElement>(null)
  const [camOn, setCamOn] = useState(media.cam !== null)
  const [micOn, setMicOn] = useState(true)
  const [index, setIndex] = useState(0)
  const [seconds, setSeconds] = useState(0)
  // 지금 질문을 시작한 시각 (답변 시간 = 전체 - 이 값)
  const [questionStart, setQuestionStart] = useState(0)

  // 진행 시간 (시작 버튼을 누른 뒤부터)
  useEffect(() => {
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(t)
  }, [])

  // 준비 화면에서 넘겨받은 카메라 연결
  useEffect(() => {
    if (video.current) video.current.srcObject = media.cam
  }, [media])

  // 끄고 켜기: 장치를 놓지 않고 트랙만 멈춘다 (다시 켤 때 권한·지연 없음)
  const toggleCam = () => {
    if (!media.cam) return
    media.cam.getVideoTracks().forEach((t) => (t.enabled = !camOn))
    playToggle(!camOn)
    setCamOn(!camOn)
  }
  const toggleMic = () => {
    media.mic.getAudioTracks().forEach((t) => (t.enabled = !micOn))
    playToggle(!micOn)
    setMicOn(!micOn)
  }
  const next = () => {
    if (index === questions.length - 1) return navigate('/app/interview')
    setIndex(index + 1)
    setQuestionStart(seconds)
  }

  const last = index === questions.length - 1
  const kind = index === 0 ? `${media.type} 질문` : last ? '마무리 질문' : '꼬리 질문'

  return (
    <ThemeRoot className="flex min-h-svh flex-col lg:h-svh text-soft [--side:var(--gutter)] lg:[--side:clamp(40px,6.25vw,120px)]">
      {/* 면접 중에는 헤더 없이: 위쪽 줄에 녹화 시간 · 진행 점 · 나가기만 */}
      <header className="flex items-center justify-between px-[var(--side)] py-5 text-[13px]">
        <span className="flex items-center gap-2 text-paper tabular-nums">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff5a5a]" aria-hidden />
          {clock(seconds)}
        </span>
        <ol aria-label={`질문 ${index + 1} / ${questions.length}`} className="flex items-center gap-1.5">
          {questions.map((_, i) => (
            <li key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-6 bg-grass' : i < index ? 'w-1.5 bg-soft' : 'w-1.5 bg-tint/20'}`} />
          ))}
        </ol>
        <button type="button" onClick={() => navigate('/app/interview')} className="text-mute transition-colors hover:text-[#ff5a5a]">
          나가기
        </button>
      </header>

      {/* 왼쪽: 질문 (주인공) / 오른쪽: 내 카메라 크게 */}
      <main className="mx-auto grid w-full max-w-[1280px] min-h-0 flex-1 gap-10 px-[var(--side)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center">
        <section aria-live="polite" className="flex flex-col">
          <p className="text-[13px] text-mute">
            질문 {index + 1} / {questions.length} · {kind}
          </p>
          <motion.h1
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 text-[clamp(24px,2.4vw,34px)] leading-[1.35] font-semibold tracking-tight text-paper text-balance break-keep"
          >
            {questions[index]}
          </motion.h1>

          {/* AI 면접관: 질문을 읽는 동안 파형이 움직인다 */}
          <div className="mt-8 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-grass font-display text-[14px] font-bold text-(--accent-on)">P</span>
            <Wave />
            <span className="text-[13px] text-mute">AI 면접관</span>
          </div>

          <p className="mt-8 text-[13px] text-mute tabular-nums">
            답변 시간 <span className="text-paper">{clock(seconds - questionStart)}</span>
          </p>
        </section>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line bg-ink-2 lg:aspect-auto lg:h-[min(62svh,560px)]">
          <video ref={video} autoPlay playsInline muted className={`h-full w-full -scale-x-100 object-cover ${camOn ? '' : 'hidden'}`} />
          {!camOn && <div className="grid h-full place-items-center text-center text-[13px] text-mute">{media.cam ? '카메라 꺼짐' : '카메라 없음'}</div>}
          <span className="absolute bottom-3 left-3 rounded-md bg-black/45 px-2 py-0.5 text-[12px] text-white/80 backdrop-blur-sm">나</span>
        </div>
      </main>

      {/* 아래 조작 막대 (Zoom·Meet처럼 영상 밖). 높이는 준비 화면의 빈 자리와 같아서 카메라 위치·크기가 그대로 */}
      <div className="flex h-[104px] items-center justify-center gap-3 px-[var(--side)]">
        <RoundButton label={micOn ? '마이크 끄기' : '마이크 켜기'} active={micOn} onClick={toggleMic}>
          <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
          <path d="M19 11a7 7 0 0 1-14 0M12 18v3" />
          {!micOn && <path d="M4 4l16 16" />}
        </RoundButton>
        <RoundButton label={camOn ? '카메라 끄기' : '카메라 켜기'} active={camOn} onClick={toggleCam}>
          <rect x="3" y="6" width="13" height="12" rx="2" />
          <path d="m16 10 5-3v10l-5-3" />
          {!camOn && <path d="M4 4l16 16" />}
        </RoundButton>
        <button type="button" onClick={next} className="h-12 rounded-full bg-cta px-6 text-sm font-semibold text-white transition-colors hover:bg-cta-hover">
          {last ? '면접 마치기' : '답변 완료 · 다음 질문'}
        </button>
      </div>
    </ThemeRoot>
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

/** 초 → mm:ss */
const clock = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`

/** AI 면접관 음성 파형 (목업: 늘 움직인다) */
function Wave() {
  return (
    <div className="flex h-5 items-center gap-[3px]" aria-hidden>
      {Array.from({ length: 12 }, (_, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-grass"
          animate={{ height: [4, 6 + ((i * 7) % 14), 4] }}
          transition={{ duration: 0.9 + (i % 4) * 0.15, repeat: Infinity, ease: 'easeInOut', delay: i * 0.05 }}
        />
      ))}
    </div>
  )
}

/** 아래 막대의 둥근 조작 버튼: 켜져 있으면 테두리, 꺼지면 빨강 */
function RoundButton({ label, active, onClick, children }: { label: string; active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`grid h-12 w-12 place-items-center rounded-full border transition-colors ${active ? 'border-line text-paper hover:border-mute' : 'border-transparent bg-[#ff5a5a] text-white hover:bg-[#ff4747]'}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
    </button>
  )
}
