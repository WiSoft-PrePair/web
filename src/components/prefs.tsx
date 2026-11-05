/** 질문 알림 설정 카드 (회원가입 2단계·마이페이지 공통) */

/** 카드 2장 선택: multiple이면 여러 개(체크박스), 아니면 하나(라디오) */
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
    <div role={multiple ? 'group' : 'radiogroup'} className="mt-2.5 grid grid-cols-2 gap-2.5">
      {options.map((o) => {
        const on = isOn(o.value)
        return (
          <button
            key={o.value}
            type="button"
            role={multiple ? 'checkbox' : 'radio'}
            aria-checked={on}
            onClick={() => onPick(o.value)}
            className={`rounded-xl border px-4 py-3 text-center transition-colors ${on ? 'border-paper' : 'border-line hover:border-mute'}`}
          >
            <span className={`text-[15px] ${on ? 'font-medium text-paper' : 'text-soft'}`}>{o.label}</span>
            {o.sub && <span className="ml-1.5 text-[13px] text-mute">{o.sub}</span>}
          </button>
        )
      })}
    </div>
  )
}
