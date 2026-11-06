/** 질문 알림 설정 카드 (회원가입 2단계·마이페이지 공통) */

/** 카드 2장 선택: multiple이면 여러 개(체크박스, 왼쪽에 체크 표시), 아니면 하나(라디오). 테두리 없이 면 색으로만 선택을 보여 준다 */
export function ChoiceCards({
  options,
  isOn,
  onPick,
  multiple,
}: {
  options: readonly { value: string; label: string; sub?: string }[]
  isOn: (v: string) => boolean
  onPick: (v: string) => void
  multiple?: boolean
}) {
  return (
    <div role={multiple ? 'group' : 'radiogroup'} className="grid grid-cols-2 gap-2.5">
      {options.map((o) => {
        const on = isOn(o.value)
        return (
          <button
            key={o.value}
            type="button"
            role={multiple ? 'checkbox' : 'radio'}
            aria-checked={on}
            onClick={() => onPick(o.value)}
            className={`flex h-[54px] items-center justify-center gap-2 rounded-2xl px-4 transition-colors ${on ? 'bg-toss/[0.08] text-toss' : 'bg-tint/[0.04] text-soft hover:bg-tint/[0.07]'}`}
          >
            {multiple && (
              <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full transition-colors ${on ? 'bg-toss text-white' : 'border-[1.5px] border-dim'}`}>
                {on && (
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                )}
              </span>
            )}
            <span className={`text-[15px] ${on ? 'font-semibold' : 'font-medium'}`}>{o.label}</span>
            {o.sub && <span className="text-[13px] opacity-70">· {o.sub}</span>}
          </button>
        )
      })}
    </div>
  )
}
