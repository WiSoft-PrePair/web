import { useState } from 'react'

/** 가입 동의 항목 (회원가입 · 카카오 첫 가입 공통). 마케팅은 선택이고, 약관 동의에 묶지 않고 따로 체크한다 */
export const CONSENT_ITEMS = [
  { key: 'terms', label: '이용약관 동의', required: true },
  { key: 'privacy', label: '개인정보 수집·이용 동의', required: true },
  { key: 'age', label: '만 14세 이상입니다', required: true },
  { key: 'marketing', label: '혜택·이벤트 알림 받기', required: false },
] as const
export type ConsentKey = (typeof CONSENT_ITEMS)[number]['key']

/** 동의 상태: 필수를 모두 체크했는지(requiredOk)와 화면에 넘길 값 */
export function useConsents() {
  const [checked, setChecked] = useState<Set<ConsentKey>>(new Set())
  const requiredOk = CONSENT_ITEMS.every((i) => !i.required || checked.has(i.key))
  return { checked, setChecked, requiredOk, marketing: checked.has('marketing') }
}
