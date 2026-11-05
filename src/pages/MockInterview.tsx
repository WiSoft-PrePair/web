import { motion } from 'motion/react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { AppHeader, ThemeRoot } from '../components/AppShell'
import InterviewSetup, { type Media } from './InterviewSetup'

// 목업 질문: 앞에서부터 (고른 개수 - 1)개 + 마지막 마무리 질문
const QUESTIONS = [
  '간단하게 자기소개 부탁드립니다.',
  '트랜잭션 격리 수준을 낮췄을 때 생길 수 있는 문제를 실제 사례로 설명해 주세요.',
  '방금 말씀하신 문제를 운영 중에 처음 발견했다면, 어떤 순서로 확인하시겠어요?',
  '그 상황에서 락을 쓰지 않고 해결할 방법도 있을까요?',
  '최근에 가장 몰입해서 해낸 일은 무엇이었나요?',
  '동료와 의견이 달랐을 때 어떻게 풀어 갔는지 말씀해 주세요.',
]
const CLOSING = '마지막으로 하고 싶은 말이 있다면 해 주세요.'

/**
 * 화상 면접: 먼저 기기 점검(InterviewSetup) → '면접 시작'을 누르면 면접 화면.
 * 큰 화면에 AI 면접관, 오른쪽 아래에 내 카메라, 아래에 자막과 조작 버튼.
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
  const questions = [...QUESTIONS.slice(0, media.count - 1), CLOSING]
  const video = useRef<HTMLVideoElement>(null)
  const [camOn, setCamOn] = useState(media.cam !== null)
  const [micOn, setMicOn] = useState(true)
  const [index, setIndex] = useState(0)
  const [meBig, setMeBig] = useState(false)
  const swap = () => setMeBig((v) => !v)
  const [seconds, setSeconds] = useState(0)

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
    setCamOn(!camOn)
  }
  const toggleMic = () => {
    media.mic.getAudioTracks().forEach((t) => (t.enabled = !micOn))
    setMicOn(!micOn)
  }

  const last = index === questions.length - 1
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <ThemeRoot className="flex h-svh flex-col text-soft [--side:var(--gutter)] lg:[--side:clamp(40px,6.25vw,120px)]">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-[var(--side)] pt-20 pb-10 xl:pt-24 xl:pb-14">
        {/* 상단 정보 */}
        <div className="flex items-center justify-between text-[13px]">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff5a5a]" aria-hidden />
            <span className="font-display tracking-[0.08em] text-paper">VIDEO INTERVIEW</span>
          </span>
          <span className="text-mute tabular-nums">
            질문 <span className="text-paper">{index + 1}</span> / {questions.length} · {mm}:{ss}
          </span>
        </div>

        {/* 화면 */}
        {/* 화면: 큰 칸과 작은 칸(오른쪽 아래). 작은 칸 더블클릭·전환 버튼으로 서로 바꾼다 */}
        <div className="relative mt-4 min-h-0 flex-1 overflow-hidden rounded-3xl border border-line bg-ink-2">
          <Tile big={!meBig} onSwap={swap} label="AI 면접관">
            <Interviewer compact={meBig} />
          </Tile>
          <Tile big={meBig} onSwap={swap} label="내 화면">
            <video ref={video} autoPlay playsInline muted className={`h-full w-full -scale-x-100 object-cover ${camOn ? '' : 'hidden'}`} />
            {!camOn && <div className="grid h-full place-items-center text-center text-[12px] text-mute">{media.cam ? '카메라 꺼짐' : '카메라 없음'}</div>}
            <span className="absolute bottom-2 left-2 rounded-md bg-ink/70 px-1.5 py-0.5 text-[11px] text-soft">나</span>
          </Tile>
        </div>

        {/* 자막(현재 질문) */}
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto mt-5 max-w-[860px] text-center text-[clamp(16px,1.5vw,20px)] leading-snug font-medium text-paper"
        >
          {questions[index]}
        </motion.p>

        {/* 조작 */}
        <div className="mt-5 flex items-center justify-center gap-3">
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
          <button
            type="button"
            onClick={() => (last ? navigate('/app') : setIndex((i) => i + 1))}
            className="h-12 rounded-full bg-paper px-6 text-sm font-semibold text-ink transition-opacity hover:opacity-90"
          >
            {last ? '면접 마치기' : '다음 질문'}
          </button>
          <button type="button" onClick={() => navigate('/app')} className="h-12 rounded-full border border-line px-5 text-sm text-mute transition-colors hover:border-[#ff5a5a] hover:text-[#ff5a5a]">
            나가기
          </button>
        </div>
      </main>
    </ThemeRoot>
  )
}

/** 큰 칸 ↔ 작은 칸 사이를 미끄러지듯 옮겨 간다 (motion layout) */
function Tile({ big, onSwap, label, children }: { big: boolean; onSwap: () => void; label: string; children: ReactNode }) {
  return (
    <motion.div
      layout
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onDoubleClick={onSwap}
      style={{ borderRadius: 16 }}
      className={`group absolute overflow-hidden select-none ${big ? 'inset-0 z-0' : 'right-4 bottom-4 z-10 aspect-video w-[min(28%,280px)] min-w-[140px] border border-line bg-ink shadow-lg shadow-black/10'}`}
    >
      {children}
      {!big && (
        <button
          type="button"
          onClick={onSwap}
          aria-label={`${label} 크게 보기`}
          title="크게 보기 (더블클릭)"
          className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-ink/70 text-soft opacity-0 transition-opacity group-hover:opacity-100 hover:text-paper focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
      )}
    </motion.div>
  )
}

/** AI 면접관: 라임 원이 숨 쉬듯 커졌다 작아지고, 아래에 음성 파형. 작은 칸에서는 원만 */
function Interviewer({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid h-full place-items-center">
      <div className="flex flex-col items-center">
        <div className={`relative grid place-items-center ${compact ? 'h-14 w-14' : 'h-[clamp(96px,14vw,168px)] w-[clamp(96px,14vw,168px)]'}`}>
          <motion.span className="absolute inset-0 rounded-full bg-lime/15" animate={{ scale: [1, 1.18, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />
          <span className={`relative grid h-[62%] w-[62%] place-items-center rounded-full bg-lime font-display font-bold text-ink ${compact ? 'text-[15px]' : 'text-[clamp(22px,2.6vw,36px)]'}`}>
            P
          </span>
        </div>
        {!compact && (
          <>
            <div className="mt-6 flex h-6 items-center gap-1" aria-hidden>
              {Array.from({ length: 14 }, (_, i) => (
                <motion.span
                  key={i}
                  className="w-1 rounded-full bg-lime/70"
                  animate={{ height: [4, 8 + ((i * 7) % 16), 4] }}
                  transition={{ duration: 0.9 + (i % 4) * 0.15, repeat: Infinity, ease: 'easeInOut', delay: i * 0.05 }}
                />
              ))}
            </div>
            <p className="mt-3 text-[13px] text-mute">AI 면접관</p>
          </>
        )}
      </div>
    </div>
  )
}

function RoundButton({ label, active, onClick, children }: { label: string; active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`grid h-12 w-12 place-items-center rounded-full border transition-colors ${active ? 'border-line text-paper hover:border-mute' : 'border-transparent bg-tint/[0.08] text-mute'}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
    </button>
  )
}
