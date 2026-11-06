/** 화상 면접 질문 수와 예상 시간 (질문당 약 2분) */
export const COUNTS = [3, 5, 7] as const
export const minutes = (n: number) => n * 2

/** 질문 유형별로 무엇을 묻는지 (설정 화면 카드의 설명 줄) */
export const TAG_DESC = {
  직무: '맡을 일에 필요한 지식과 기술',
  경험: '해 온 프로젝트와 그 안에서 한 일',
  협업: '함께 일하는 방식과 갈등 해결',
  컬처핏: '일하는 가치관과 회사와의 맞음',
} as const
