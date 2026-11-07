import { useState } from 'react'

/** 인증번호 6칸: 보이지 않는 입력칸 하나 위에 둥근 사각 칸 6개를 그린다. 6자리가 차면 자동 확인 */
export function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(true)
  return (
    <label className="relative grid grid-cols-6 gap-2">
      <input
        aria-label="인증번호 6자리"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="absolute inset-0 h-full w-full cursor-text opacity-0"
      />
      {Array.from({ length: 6 }, (_, i) => {
        const current = focused && i === Math.min(value.length, 5)
        return (
          <span
            key={i}
            className={`grid h-[54px] place-items-center rounded-2xl border bg-card font-display text-xl font-semibold text-paper transition-colors ${
              current ? 'border-dim' : i < value.length ? 'border-soft/40' : 'border-line'
            }`}
          >
            {value[i] ?? ''}
          </span>
        )
      })}
    </label>
  )
}
