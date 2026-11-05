import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { AppShell, PageTitle } from '../components/AppShell'
import { primaryButtonClass } from '../components/auth'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * 맞춤 면접 (화면만): 내 자료(이력서·포트폴리오 PDF)와 지원 공고(JD)를 넣으면 그에 맞춘 질문을 만든다.
 * 둘 중 하나만 있어도 되고, 둘 다 있으면 경험 × 공고 요구사항을 엮은 질문이 나온다.
 * 파일은 아직 어디에도 보내지 않는다. TODO: interview-service 공고 기반 질문 생성 API 연동, 자료 보관·삭제 정책
 */
export default function CustomInterview() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [jd, setJd] = useState('')
  const [notice, setNotice] = useState(false)
  const ready = file !== null || jd.trim() !== ''

  const pick = (f: File | undefined) => {
    if (f && f.type === 'application/pdf') setFile(f)
  }

  return (
    <AppShell>
      <PageTitle eyebrow="CUSTOM INTERVIEW" title="맞춤 면접" />
      <p className="mt-3 text-[14px] text-mute">내 자료와 지원 공고를 넣으면, 그에 맞춘 면접 질문을 만들어 드려요. 둘 중 하나만 있어도 괜찮아요.</p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {/* 내 자료 */}
        <section>
          <h2 className="mb-2 text-[13px] text-mute">내 자료</h2>
          {file ? (
            <div className="flex h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-line px-6 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-tint/[0.06] text-[12px] font-semibold text-soft">PDF</span>
              <p className="max-w-full truncate text-[14px] text-paper">{file.name}</p>
              <button type="button" onClick={() => setFile(null)} className="text-[13px] text-mute underline-offset-2 hover:text-paper hover:underline">
                다른 파일로 바꾸기
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                pick(e.dataTransfer.files[0])
              }}
              className="flex h-[220px] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line px-6 text-center transition-colors hover:border-mute"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-mute" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
              </svg>
              <span className="text-[14px] text-paper">이력서·포트폴리오 PDF 올리기</span>
              <span className="text-[12px] text-mute">눌러서 고르거나 여기로 끌어다 놓으세요</span>
            </button>
          )}
          <input ref={fileInput} type="file" accept="application/pdf" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </section>

        {/* 지원 공고 */}
        <section>
          <h2 className="mb-2 text-[13px] text-mute">지원 공고 (JD)</h2>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="공고 링크나 내용을 붙여 넣어 주세요"
            className="block h-[220px] w-full resize-none rounded-2xl border border-line bg-transparent px-4 py-3.5 text-[14px] leading-relaxed text-paper outline-none transition-colors placeholder:text-dim focus:border-mute"
          />
        </section>
      </div>

      <div className="mt-6 flex items-center justify-end gap-4">
        <p className="text-[13px] text-mute">{file && jd.trim() ? '내 경험과 공고 요구사항을 엮은 질문을 만들어요.' : ''}</p>
        <button type="button" disabled={!ready} onClick={() => setNotice(true)} className={`!w-auto px-6 ${primaryButtonClass}`}>
          질문 만들기
        </button>
      </div>

      <AnimatePresence>
        {notice && (
          <motion.p
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25, ease: EASE }}
            onAnimationComplete={() => window.setTimeout(() => setNotice(false), 1600)}
            className="fixed bottom-8 left-1/2 z-30 -translate-x-1/2 rounded-full bg-paper px-4 py-2.5 text-[13px] font-medium whitespace-nowrap text-ink"
          >
            질문 만들기는 준비 중이에요
          </motion.p>
        )}
      </AnimatePresence>
    </AppShell>
  )
}
