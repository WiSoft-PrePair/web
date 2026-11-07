import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

const EASE = [0.22, 1, 0.36, 1] as const

/** 모바일은 아래에서 올라오는 시트(손잡이 막대), 넓은 화면은 가운데 창. 제목 + 한 줄 설명 + 오른쪽 위 닫기 */
export function BottomSheet({ open, title, desc, onClose, children }: { open: boolean; title: string; desc?: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // 본문 판(.app-panel) 안에 두면 헤더 아래에 깔려서, body에 바로 그린다 (색 토큰을 위해 data-theme만 붙임)
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          data-theme="light"
          className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button type="button" aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-black/35" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 32, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 32, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="relative w-full max-w-[420px] sm:[zoom:0.9] rounded-t-[28px] bg-card px-6 pt-3 pb-7 shadow-[0_24px_64px_-24px_rgba(16,24,40,0.4)] md:rounded-[28px] md:pt-6 md:pb-6"
          >
            <span aria-hidden className="mx-auto mb-4 block h-1 w-10 rounded-full bg-tint/15 md:hidden" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[19px] font-semibold tracking-tight text-paper">{title}</h2>
                {desc && <p className="mt-1 text-[14px] text-mute">{desc}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="-mt-1 -mr-2 grid h-9 w-9 shrink-0 place-items-center rounded-full text-mute transition-colors hover:bg-tint/[0.06] hover:text-paper"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <div className="mt-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
