import type { Tag } from './questions'

/**
 * 화상 면접 기록 (목업, 최신순).
 * tag: 그 면접에서 주로 다룬 질문 유형 (텍스트 면접과 같은 분류)
 * TODO: interview-service 세션 API (InterviewSession: totalQuestionCount 등)로 교체
 */
export type InterviewRecord = { id: number; date: string; tag: Tag; count: number; minutes: number; score?: number; first: string }

const RECENT: InterviewRecord[] = [
  { id: 6, tag: '경험', date: '11.05 (목)', count: 5, minutes: 11, score: 78, first: '최근에 가장 몰입해서 해낸 일은 무엇이었나요?' },
  { id: 5, tag: '협업', date: '11.03 (화)', count: 3, minutes: 6, score: 71, first: '동료와 의견이 달랐을 때 어떻게 풀어 갔나요?' },
  { id: 4, tag: '컬처핏', date: '11.01 (일)', count: 7, minutes: 16, score: 83, first: '간단하게 자기소개 부탁드립니다.' },
  { id: 3, tag: '컬처핏', date: '10.29 (목)', count: 5, minutes: 9, first: '지원한 이유를 말씀해 주세요.' },
  { id: 2, tag: '경험', date: '10.27 (화)', count: 5, minutes: 12, score: 64, first: '가장 어려웠던 문제를 어떻게 해결했나요?' },
  { id: 1, tag: '직무', date: '10.22 (목)', count: 3, minutes: 5, score: 58, first: '간단하게 자기소개 부탁드립니다.' },
]

// 더 이전 기록 (목업): 10.20부터 이틀 간격으로 거슬러 올라간다
const OLDER_FIRSTS: [Tag, string][] = [
  ['컬처핏', '우리 회사에 지원한 이유는 무엇인가요?'],
  ['경험', '실패했던 경험과 거기서 배운 점을 말해 주세요.'],
  ['협업', '팀에서 맡았던 역할과 기여를 설명해 주세요.'],
  ['직무', '이 직무에서 가장 중요한 역량은 무엇이라고 생각하나요?'],
  ['경험', '마감이 촉박했던 일을 어떻게 끝냈나요?'],
  ['컬처핏', '일할 때 가장 중요하게 생각하는 가치는 무엇인가요?'],
  ['협업', '피드백을 받아들이기 어려웠던 적이 있나요?'],
  ['직무', '최근에 새로 배운 것을 업무에 적용해 본 경험이 있나요?'],
  ['경험', '스스로 문제를 찾아 개선한 경험이 있나요?'],
  ['컬처핏', '5년 뒤 어떤 모습이고 싶나요?'],
  ['협업', '의견이 다른 동료를 설득한 경험을 말해 주세요.'],
  ['직무', '지원한 직무의 하루 일과를 어떻게 그리고 있나요?'],
  ['경험', '가장 자랑스러운 성과는 무엇인가요?'],
  ['컬처핏', '스트레스를 받을 때 어떻게 관리하나요?'],
]
const WEEK = ['일', '월', '화', '수', '목', '금', '토']
const OLDER: InterviewRecord[] = OLDER_FIRSTS.map(([tag, first], i) => {
  const d = new Date(2026, 9, 20 - i * 2)
  const date = `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${WEEK[d.getDay()]})`
  const count = [3, 5, 7][i % 3]
  return { id: 100 - i, tag, date, count, minutes: count * 2 + (i % 3), score: i % 5 === 3 ? undefined : 55 + ((i * 7) % 35), first }
})

export const INTERVIEWS: InterviewRecord[] = [...RECENT, ...OLDER]
