/** 질문 알림 설정 선택지 (회원가입·마이페이지 공통) */
export const CHANNELS = [
  { value: 'email', label: '이메일' },
  { value: 'kakao', label: '카카오톡' },
] as const
export const FREQUENCY = [
  { value: 'every', label: '매일', sub: '오전 8시' },
  { value: 'weekly', label: '매주', sub: '월요일 오전 8시' },
] as const
export type Channel = (typeof CHANNELS)[number]['value']
