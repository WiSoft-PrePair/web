import { type ConsentKey as Key, CONSENT_ITEMS as ITEMS, type useConsents } from './useConsents'

/** 맨 위 '전체 동의'(동그라미 + 굵은 글씨) → 얇은 선 → 항목은 칸 없이 체크 표시만. TODO: 약관 · 처리방침 본문이 생기면 항목 옆 '보기' */
export function Consents({ checked, setChecked }: Pick<ReturnType<typeof useConsents>, 'checked' | 'setChecked'>) {
  const all = ITEMS.every((i) => checked.has(i.key))
  const toggle = (k: Key) =>
    setChecked((s) => {
      const n = new Set(s)
      if (n.has(k)) n.delete(k)
      else n.add(k)
      return n
    })

  return (
    <div>
      <label className="flex cursor-pointer items-center gap-3 py-1">
        <input type="checkbox" className="peer sr-only" checked={all} onChange={() => setChecked(all ? new Set() : new Set(ITEMS.map((i) => i.key)))} />
        <span
          aria-hidden
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-toss/40 ${all ? 'border-toss bg-toss text-white' : 'border-dim bg-card text-transparent'}`}
        >
          <CheckIcon className="h-3.5 w-3.5" />
        </span>
        <span className="text-[15px] font-semibold text-paper">전체 동의</span>
      </label>
      <div className="mt-3.5 border-t border-line" />

      <ul className="mt-3.5 space-y-3">
        {ITEMS.map((i) => {
          const on = checked.has(i.key)
          return (
            <li key={i.key}>
              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" className="peer sr-only" checked={on} onChange={() => toggle(i.key)} />
                {/* 칸 없는 체크: 꺼지면 옅은 회색, 켜지면 토스 파랑 (위 동그라미와 가운데 맞추려고 폭 24px) */}
                <span
                  aria-hidden
                  className={`grid w-6 shrink-0 place-items-center rounded transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-toss/40 ${on ? 'text-toss' : 'text-tint/20'}`}
                >
                  <CheckIcon className="h-[18px] w-[18px]" />
                </span>
                <span className="text-[14px] text-soft">
                  <span className={i.required ? 'text-toss' : 'text-mute'}>{i.required ? '(필수)' : '(선택)'}</span> {i.label}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function CheckIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5 9-10" />
    </svg>
  )
}
