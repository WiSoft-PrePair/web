import { type DragEvent, type ReactNode, useRef, useState } from 'react'
import { ThemeRoot } from '../components/AppShell'
import { COUNTS, minutes, TAG_DESC } from '../data/interviewSettings'
import { TAGS, type Tag } from '../data/questions'

/** 면접 설정: 질문 유형 · 질문 수 · 이력서 PDF(선택) */
export type Settings = { type: Tag; count: number; resume: { name: string; size: number } | null }
export type Analysis = 'idle' | 'analyzing' | 'done'

const MAX_MB = 10

/**
 * 화상 면접 1단계 · 면접 설정 (목업). 다음 단계는 기기 확인(InterviewSetup).
 * PDF를 올리면 바로 분석을 시작하고(부모가 관리), 기기를 확인하는 동안 끝나도록 한다.
 * TODO: 이력서 업로드·분석 API(interview-service) 연동, 파일은 분석 뒤 보관하지 않는 방향 검토(개인정보)
 */
export default function InterviewPrep({
  settings,
  analysis,
  onChange,
  onResume,
  onNext,
}: {
  settings: Settings
  analysis: Analysis
  onChange: (s: Settings) => void
  onResume: (file: File | null) => void
  onNext: () => void
}) {
  const { type, count, resume } = settings
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = (file: File | undefined) => {
    if (!file) return
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return setError('PDF 파일만 올릴 수 있어요')
    if (file.size > MAX_MB * 1024 * 1024) return setError(`${MAX_MB}MB 이하 파일만 올릴 수 있어요`)
    setError(null)
    onResume(file)
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    pick(e.dataTransfer.files[0])
  }

  // 고른 칸: 토스 파랑 옅은 바탕 + 파랑 글자 (회원가입 선택 카드와 같은 규칙)
  // 패널의 은은한 배경 위에서 회색 반투명 칸은 떠 보여서, 흰 바탕 + 얇은 테두리로 바닥에 붙인다
  const choice = (on: boolean) => `rounded-2xl border text-left transition-colors ${on ? 'border-toss bg-toss/[0.05] text-toss' : 'border-line bg-card text-paper hover:border-dim'}`

  return (
    <ThemeRoot className="flow-root min-h-svh text-soft">
      <header className="fixed inset-x-0 top-0 z-10 flex h-[52px] items-center justify-center bg-ink">
        <StepDots step={1} />
      </header>

      {/* 다른 앱 화면과 같은 둥근 패널 (이 화면엔 메뉴 줄이 없어 좁은 화면에서도 52px 아래에서 시작) */}
      <div className="app-panel max-md:!mt-[52px] max-md:[--panel-h:calc(100svh-52px)]">
        {/* 제목·설명을 위에, 입력은 그 아래 가운데 (세로도 가운데) */}
        <main className="mx-auto flex w-full max-w-[640px] flex-col justify-center gap-8 px-[var(--gutter)] pt-12 pb-16 lg:min-h-[calc(100svh-52px)] lg:px-0 lg:py-10">
          <div className="text-center">
            <h1 className="text-[clamp(24px,2.4vw,32px)] leading-[1.35] font-semibold tracking-tight text-paper">어떤 면접을 볼까요?</h1>
            <p className="mt-1.5 text-[15px] leading-relaxed break-keep text-mute">질문 유형과 개수를 고르세요. 이력서를 올리면 내 경험에 맞춘 질문을 받아요.</p>
          </div>

          <section aria-label="면접 설정">
            <Field label="질문 유형">
              <div role="radiogroup" aria-label="질문 유형" className="grid grid-cols-2 gap-2">
                {TAGS.map((t) => (
                  <button key={t} type="button" role="radio" aria-checked={type === t} onClick={() => onChange({ ...settings, type: t })} className={`${choice(type === t)} px-4 py-2.5`}>
                    <span className="block text-[14px] font-semibold">{t}</span>
                    <span className={`mt-0.5 block text-[13px] leading-snug break-keep ${type === t ? 'text-toss/80' : 'text-mute'}`}>{TAG_DESC[t]}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 pl-1 text-[13px] leading-relaxed text-mute">
                {resume ? `${type} 질문을 이력서 내용에 맞춰 드리고, 답변에 따라 꼬리 질문이 이어져요.` : `${type} 질문으로 시작해서, 내 답변에 맞춰 꼬리 질문이 이어져요.`}
              </p>
            </Field>
            <Field label="질문 수" className="mt-7">
              <div role="radiogroup" aria-label="질문 수" className="grid grid-cols-3 gap-2">
                {COUNTS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={count === n}
                    onClick={() => onChange({ ...settings, count: n })}
                    className={`${choice(count === n)} grid h-11 place-items-center`}
                  >
                    <span className="flex items-baseline gap-1.5 whitespace-nowrap">
                      <span className="text-[14px] font-semibold">{n}개</span>
                      <span className={`text-[13px] ${count === n ? 'text-toss/80' : 'text-mute'}`}>약 {minutes(n)}분</span>
                    </span>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="이력서 · 포트폴리오" optional className="mt-7">
              <input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => (pick(e.target.files?.[0]), (e.target.value = ''))} />
              {resume ? (
                // 올린 파일: 이름 · 크기 · 분석 상태 · 빼기
                <div className="flex h-[84px] items-center gap-4 rounded-2xl border border-line bg-card px-5">
                  <DocIcon />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-paper">{resume.name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[13px] text-mute">
                      {analysis === 'analyzing' ? (
                        <>
                          <Spinner /> 이력서를 분석하고 있어요…
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-toss" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="m5 12 5 5 9-10" />
                          </svg>
                          <span className="text-soft">분석 완료 · 프로젝트 3개, 경력 2년을 찾았어요</span>
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="파일 빼기"
                    onClick={() => onResume(null)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-mute transition-colors hover:bg-tint/[0.06] hover:text-paper"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                      <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  </button>
                </div>
              ) : (
                // 끌어다 놓거나 눌러서 고르기
                <button
                  type="button"
                  onClick={() => input.current?.click()}
                  onDragOver={(e) => (e.preventDefault(), setDragging(true))}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={`flex h-[84px] w-full items-center gap-4 rounded-2xl border border-dashed px-5 text-left transition-colors ${dragging ? 'border-toss bg-toss/[0.05]' : 'border-dim bg-card hover:border-toss/60 hover:bg-toss/[0.03]'}`}
                >
                  <DocIcon />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-paper">PDF를 끌어다 놓거나 눌러서 골라 주세요</span>
                    <span className="mt-1 block text-[13px] text-mute">PDF · {MAX_MB}MB 이하</span>
                  </span>
                </button>
              )}
              <p className="mt-3 pl-1 text-[13px] leading-relaxed text-mute">올리면 이력서를 바탕으로 질문해요. 없으면 고른 유형의 기본 질문으로 진행해요.</p>
              {error && <p className="mt-2 pl-1 text-[13px] text-[#f04452]">{error}</p>}
            </Field>

            <button type="button" onClick={onNext} className="mt-8 h-[54px] w-full rounded-2xl bg-cta text-[15px] font-semibold text-white transition-colors hover:bg-cta-hover">
              다음 · 기기 확인
            </button>
          </section>
        </main>
      </div>
    </ThemeRoot>
  )
}

function Field({ label, optional, className = '', children }: { label: string; optional?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <h2 className="mb-3 flex items-center gap-1.5 pl-1 text-[15px] font-semibold text-paper">
        {label}
        {/* 안 해도 되는 항목: 이름 옆에 (선택) */}
        {optional && <span className="text-[13px] font-normal text-mute">(선택)</span>}
      </h2>
      {children}
    </div>
  )
}

/** 1·2단계 표시 (헤더 가운데) */
export function StepDots({ step }: { step: 1 | 2 }) {
  return (
    <ol aria-label={`${step} / 2단계`} className="flex items-center gap-1.5">
      {[1, 2].map((n) => (
        <li key={n} className={`h-1.5 rounded-full transition-all duration-300 ${n === step ? 'w-6 bg-toss' : n < step ? 'w-1.5 bg-soft' : 'w-1.5 bg-tint/20'}`} />
      ))}
    </ol>
  )
}

export function Spinner() {
  return <span aria-hidden className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-tint/15 border-t-toss" />
}

function DocIcon() {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-toss/[0.08] text-toss">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z M14 3v5h5 M9 13h6 M9 17h4" />
      </svg>
    </span>
  )
}
