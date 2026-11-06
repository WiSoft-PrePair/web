import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ThemeRoot } from '../components/AppShell'
import type { Tag } from '../data/questions'
import InterviewPrep, { type Analysis, type Settings } from './InterviewPrep'
import InterviewRoom from './InterviewSetup'

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

// 이력서를 올렸을 때의 목업 질문 (실제로는 이력서 분석 결과로 만든다)
const RESUME_FIRST: Record<Tag, string> = {
  직무: '이력서에 적은 결제 시스템 개선 프로젝트에서, 가장 중요하게 본 기술적 기준은 무엇이었나요?',
  경험: '이력서의 프로젝트 3개 중 가장 몰입했던 하나를 골라, 어떤 문제를 풀었는지 말씀해 주세요.',
  협업: '이력서에 적은 팀 프로젝트에서 의견이 갈렸던 순간이 있었나요? 어떻게 정리했나요?',
  컬처핏: '2년간의 경력 중 가장 일하기 좋았던 팀은 어떤 모습이었나요?',
}
const RESUME_FOLLOW_UPS = [
  '이력서에는 성과가 숫자로 적혀 있는데, 그 숫자는 어떻게 측정했나요?',
  '그 프로젝트에서 본인이 직접 결정한 부분은 어디까지였나요?',
  '같은 문제를 지금 다시 푼다면 무엇을 바꾸겠어요?',
  '이력서에 적지 않은 어려움이 있었다면 무엇이었나요?',
  '그 경험이 지원한 일에 어떻게 이어질까요?',
]

/** 고른 설정으로 이번 면접 질문: 첫 질문(이력서가 있으면 이력서 기반) → 꼬리 질문들 → 마무리 질문 */
const buildQuestions = (s: Settings) => {
  const withResume = s.resume !== null
  return [(withResume ? RESUME_FIRST : FIRST)[s.type], ...(withResume ? RESUME_FOLLOW_UPS : FOLLOW_UPS).slice(0, s.count - 2), CLOSING]
}

/**
 * 화상 면접: 1단계 면접 설정(InterviewPrep: 유형·질문 수·이력서 PDF) → 2단계 면접실(InterviewSetup: Zoom 같은 화면에서 기기 확인 → 그대로 면접) → 리포트 만드는 중 → 목록.
 * 이력서는 1단계에서 올리자마자 분석을 시작해(목업 3초), 기기를 확인하는 동안 끝나게 한다.
 */
type Step = 'prep' | 'room' | 'report'
const ANALYZE_MS = 3000

export default function MockInterview() {
  const [step, setStep] = useState<Step>('prep')
  const [settings, setSettings] = useState<Settings>({ type: '직무', count: 5, resume: null })
  const [analysis, setAnalysis] = useState<Analysis>('idle')
  const analyzeTimer = useRef(0)
  // 이력서 고르기·빼기: 고르면 바로 분석 시작 (TODO: interview-service 이력서 분석 API)
  const pickResume = (file: File | null) => {
    window.clearTimeout(analyzeTimer.current)
    setSettings((s) => ({ ...s, resume: file && { name: file.name, size: file.size } }))
    if (!file) return setAnalysis('idle')
    setAnalysis('analyzing')
    analyzeTimer.current = window.setTimeout(() => setAnalysis('done'), ANALYZE_MS)
  }
  useEffect(() => () => window.clearTimeout(analyzeTimer.current), [])

  if (step === 'prep') return <InterviewPrep settings={settings} analysis={analysis} onChange={setSettings} onResume={pickResume} onNext={() => setStep('room')} />
  if (step === 'room') return <InterviewRoom questions={buildQuestions(settings)} analyzing={analysis === 'analyzing'} onFinish={() => setStep('report')} />
  return <ReportLoading />
}

const REPORT_STEPS = ['표정과 말투, 시선 살펴보는 중', '답변의 논리와 구성 읽는 중', '다음 면접을 위한 피드백 쓰는 중']
const REPORT_MS = 6000

/**
 * 면접을 마친 뒤: 카드 안에 진행률(%)과 단계 목록(지금 단계 = 도는 원, 끝난 단계 = 체크)을 보여 주고, 다 차면 목록으로.
 * TODO: 실제로는 리포트 API 진행 상태에 맞추고, 결과 화면이 생기면 그쪽으로
 */
function ReportLoading() {
  const navigate = useNavigate()
  const [percent, setPercent] = useState(0)
  useEffect(() => {
    const begin = performance.now()
    const loop = { raf: 0 }
    const tick = (now: number) => {
      const p = Math.min(100, Math.round(((now - begin) / REPORT_MS) * 100))
      setPercent(p)
      if (p < 100) loop.raf = requestAnimationFrame(tick)
    }
    loop.raf = requestAnimationFrame(tick)
    const done = window.setTimeout(() => navigate('/app/interview'), REPORT_MS + 600)
    return () => {
      cancelAnimationFrame(loop.raf)
      window.clearTimeout(done)
    }
  }, [navigate])
  const phase = Math.min(REPORT_STEPS.length - 1, Math.floor((percent / 100) * REPORT_STEPS.length))
  const left = Math.max(1, Math.ceil(((100 - percent) / 100) * (REPORT_MS / 1000)))

  return (
    <ThemeRoot className="grid min-h-svh place-items-center !bg-[#f7f8fa] px-[var(--gutter)] text-soft">
      <div className="w-full max-w-[440px] rounded-[28px] bg-card px-9 pt-12 pb-11 text-center shadow-card max-sm:px-6">
        <svg viewBox="0 0 48 48" className="mx-auto h-14 w-14 text-toss" fill="currentColor" aria-hidden>
          <path d="M24 9c1.2 8 4.6 11.6 12.6 12.8-8 1.2-11.4 4.8-12.6 12.8-1.2-8-4.6-11.6-12.6-12.8C19.4 20.6 22.8 17 24 9Z" />
          <path d="M38 5c.5 3.4 2 4.9 5.4 5.4-3.4.5-4.9 2-5.4 5.4-.5-3.4-2-4.9-5.4-5.4C36 9.9 37.5 8.4 38 5Z" opacity=".6" />
          <path d="M10 31c.5 3 1.8 4.3 4.8 4.8-3 .5-4.3 1.8-4.8 4.8-.5-3-1.8-4.3-4.8-4.8 3-.5 4.3-1.8 4.8-4.8Z" opacity=".45" />
        </svg>
        <h1 className="mt-6 text-[24px] font-bold tracking-tight text-paper">리포트를 만들고 있어요</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-mute">면접 수고하셨어요. 잠시만 기다려 주세요.</p>

        <div className="mt-10 text-left">
          <div className="flex items-center justify-between text-[14px]">
            <span className="font-semibold text-toss tabular-nums">{percent}% 완료</span>
            <span className="text-mute tabular-nums">약 {left}초 남음</span>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-tint/[0.06]" role="progressbar" aria-label="리포트 만드는 중" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-toss transition-[width] duration-150" style={{ width: `${percent}%` }} />
          </div>

          <ol className="mt-8 space-y-[18px]" aria-live="polite">
            {REPORT_STEPS.map((label, i) => {
              const state = percent >= 100 || i < phase ? 'done' : i === phase ? 'now' : 'wait'
              return (
                <li key={label} className={`flex items-center gap-3 text-[15px] ${state === 'wait' ? 'text-mute' : 'font-medium text-paper'}`}>
                  {state === 'done' ? (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-toss text-white">
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="m5 12 5 5 9-10" />
                      </svg>
                    </span>
                  ) : state === 'now' ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-tint/10 border-t-toss" aria-hidden />
                  ) : (
                    <span className="h-5 w-5 rounded-full border-2 border-tint/10" aria-hidden />
                  )}
                  {label}
                </li>
              )
            })}
          </ol>
        </div>

        <button
          type="button"
          onClick={() => navigate('/app/interview')}
          className="mt-11 h-12 w-full max-w-[240px] rounded-2xl border border-line text-[15px] font-semibold text-paper transition-colors hover:bg-tint/[0.03]"
        >
          면접 목록으로
        </button>
      </div>
    </ThemeRoot>
  )
}
