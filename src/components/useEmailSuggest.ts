import { type KeyboardEvent, useState } from 'react'
import { domainSuggestions } from './emailDomains'

const MAX = 4

/** 이메일 칸 자동완성 상태: '@' 뒤를 적는 동안 완성된 주소 후보를 띄우고, ↑↓ Enter Esc로 고른다 */
export function useEmailSuggest(email: string, onPick: (email: string) => void, enabled: boolean) {
  const [focused, setFocused] = useState(false)
  const [active, setActive] = useState(0)
  // Esc로 닫은 입력값. 글자를 더 치면 다시 열린다
  const [dismissedFor, setDismissedFor] = useState<string | null>(null)

  const local = email.slice(0, email.lastIndexOf('@'))
  const items = domainSuggestions(email)
    .slice(0, MAX)
    .map((d) => `${local}@${d}`)
  const open = enabled && focused && dismissedFor !== email && items.length > 0
  const current = Math.min(active, items.length - 1)

  const pick = (value: string) => {
    onPick(value)
    setActive(0)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((current + step + items.length) % items.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(items[current])
    } else if (e.key === 'Escape') {
      setDismissedFor(email)
    }
  }

  return {
    open,
    items,
    active: current,
    setActive,
    pick,
    inputProps: {
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
      onKeyDown,
      'aria-autocomplete': 'list' as const,
      'aria-expanded': open,
    },
  }
}
