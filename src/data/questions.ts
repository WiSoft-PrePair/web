/** 텍스트 면접 목업 데이터 (메인·목록·상세 공통). TODO: interview-service 기록 API로 교체 */

export type Feedback = { score: number; good: string; lack: string; next: string }
/**
 * 질문 분류 (모든 직군 공통): 직무(개념·원리) / 경험(직접 한 일과 판단) / 협업(사람과 일한 방식) / 컬처핏(가치관·동기·태도).
 * 질문당 하나. "~한 경험이 있나요?"처럼 경험을 물으면 직무 내용이어도 경험으로 분류.
 */
export const TAGS = ['직무', '경험', '협업', '컬처핏'] as const
export type Tag = (typeof TAGS)[number]

/** 같은 질문에 쓴 이전 답변 하나 */
export type PastAnswer = { date: string; answer: string; feedback: Feedback }

/** answer·feedback = 가장 최근 답변. past = 그보다 앞서 쓴 답변들(오래된 순) */
/** parentId: 꼬리 질문에서 만든 질문이면 원래 질문 id */
export type QuestionRecord = { id: number; date: string; tag: Tag; question: string; answer?: string; feedback?: Feedback; past?: PastAnswer[]; parentId?: number }

const fb = (score: number, good: string, lack: string, next: string): Feedback => ({ score, good, lack, next })

/** 최신순. 0번이 오늘의 질문 */
export const QUESTIONS: QuestionRecord[] = [
  { id: 8, date: '11.05 (목)', tag: '직무', question: '트랜잭션 격리 수준을 낮췄을 때 생길 수 있는 문제를 실제 사례로 설명해 주세요.' },
  {
    id: 7,
    date: '11.04 (수)',
    tag: '직무',
    question: 'N+1 문제를 발견했을 때 어떤 순서로 원인을 좁혀 나가나요?',
    answer: '쿼리 로그로 반복 쿼리를 먼저 확인하고, 연관관계 로딩 전략을 본 뒤 fetch join이나 batch size로 해결합니다.',
    feedback: fb(82, '확인 → 원인 → 해결 순서가 분명해요.', 'fetch join과 batch size 중 무엇을 고를지 기준이 없어요.', '페이징이 있을 때와 없을 때를 나눠 선택 기준을 말해 보세요.'),
    past: [
      {
        date: '10.21 (수)',
        answer: '데이터를 많이 가져와서 느려지는 문제입니다.',
        feedback: fb(32, '문제가 성능과 관련 있다는 건 알고 있어요.', 'N+1이 무엇인지 정확히 설명하지 못했어요.', '쿼리가 몇 번 나가는지부터 정의해 보세요.'),
      },
      {
        date: '10.24 (토)',
        answer: '목록을 조회할 때 연관된 데이터를 하나씩 따로 조회해서 쿼리가 N번 더 나가는 문제입니다.',
        feedback: fb(44, 'N+1의 정의는 정확해요.', '질문은 원인을 좁히는 순서인데, 정의만 말했어요.', '발견 → 확인 → 해결 순서로 다시 구성해 보세요.'),
      },
      {
        date: '10.27 (화)',
        answer: '응답이 느려지면 로그를 보고, 같은 쿼리가 반복되면 N+1이라고 판단합니다.',
        feedback: fb(51, '로그부터 본다는 출발점이 좋아요.', '어떤 로그를 어떻게 켜는지가 빠졌어요.', 'SQL 로그나 쿼리 카운트처럼 구체적인 도구를 말해 보세요.'),
      },
      {
        date: '10.30 (금)',
        answer: 'SQL 로그를 켜서 같은 쿼리가 반복되는지 보고, 어떤 연관관계에서 생기는지 엔티티를 확인합니다.',
        feedback: fb(55, '확인 도구와 범위를 좁히는 흐름이 생겼어요.', '해결 방법이 빠져 있어요.', '원인을 찾은 뒤 어떻게 고쳤는지까지 이어 보세요.'),
      },
      {
        date: '11.02 (월)',
        answer: 'SQL 로그로 반복 쿼리를 찾고, 지연 로딩 때문인지 확인한 뒤 fetch join으로 고칩니다.',
        feedback: fb(57, '찾기부터 고치기까지 한 흐름으로 말했어요.', '왜 fetch join을 골랐는지 근거가 없어요.', '다른 방법과 비교해 고른 이유를 덧붙여 보세요.'),
      },
      {
        date: '11.04 (수) 오전',
        answer: 'N+1은 연관된 엔티티를 하나씩 조회해서 생기는 문제라 fetch join을 쓰면 됩니다.',
        feedback: fb(58, '문제 정의는 맞아요.', '원인을 어떻게 찾는지가 빠졌어요.', '로그·쿼리 수 확인처럼 찾는 순서부터 말해 보세요.'),
      },
      {
        date: '11.04 (수) 점심',
        answer: '쿼리 로그에서 같은 쿼리가 반복되는지 보고, 지연 로딩 때문이면 fetch join으로 한 번에 가져옵니다.',
        feedback: fb(71, '찾는 순서가 생겼어요.', '해결 방법이 하나뿐이에요.', 'batch size 같은 다른 방법과 비교해 보세요.'),
      },
    ],
  },
  {
    id: 6,
    date: '11.03 (화)',
    tag: '경험',
    question: '캐시를 도입했다가 오히려 문제가 생긴 경험이 있나요?',
    answer: '상품 정보를 캐시했는데 가격 변경이 늦게 반영돼 문의가 들어왔습니다. TTL을 줄이고 변경 시 삭제하도록 바꿨습니다.',
    feedback: fb(74, '실제 겪은 문제와 대응이 구체적이에요.', '왜 처음에 그 TTL을 골랐는지가 빠졌어요.', '도입 당시 판단과 바꾼 뒤 수치를 비교해 보세요.'),
    past: [
      {
        date: '11.03 (화) 오전',
        answer: '캐시를 쓰다가 데이터가 늦게 바뀌는 문제가 있었습니다.',
        feedback: fb(55, '경험을 솔직하게 꺼냈어요.', '무엇이 얼마나 늦었는지가 없어요.', '상황과 결과를 숫자로 말해 보세요.'),
      },
    ],
  },
  {
    id: 5,
    date: '11.02 (월)',
    tag: '직무',
    question: '서비스 간 통신을 동기에서 비동기로 바꿀 때 고려할 점은?',
    answer: '메시지 유실, 순서 보장, 중복 처리, 실패 시 재시도와 보상 트랜잭션을 고려해야 합니다.',
    feedback: fb(91, '핵심 고려 사항을 빠짐없이 짚었어요.', '각 항목을 어떻게 해결하는지는 짧아요.', '멱등성 키처럼 실제 해결 방법을 하나 붙여 보세요.'),
    past: [
      {
        date: '11.02 (월) 오전',
        answer: '비동기로 바꾸면 응답이 빨라지지만 실패 처리가 어려워집니다.',
        feedback: fb(66, '장단점을 함께 봤어요.', '고려할 점이 하나뿐이에요.', '유실·순서·중복을 나눠서 말해 보세요.'),
      },
      {
        date: '11.02 (월) 점심',
        answer: '메시지 유실과 중복 처리를 고려해야 하고, 재시도 정책이 필요합니다.',
        feedback: fb(78, '핵심 위험을 짚었어요.', '순서 보장과 보상 처리가 빠졌어요.', '실패했을 때 되돌리는 방법까지 이어 보세요.'),
      },
    ],
  },
  {
    id: 4,
    date: '11.01 (일)',
    tag: '경험',
    question: '본인이 설계한 API 중 가장 아쉬웠던 부분은 무엇인가요?',
    answer: '응답에 내부 엔티티를 그대로 노출해서 필드를 바꾸기 어려웠습니다.',
    feedback: fb(68, '문제를 솔직하게 짚었어요.', '어떻게 고쳤는지, 지금이라면 어떻게 할지가 없어요.', 'DTO 분리 후 달라진 점까지 이어서 말해 보세요.'),
  },
  { id: 3, date: '10.31 (토)', tag: '직무', question: '인덱스를 추가했는데 오히려 느려진 경우를 설명해 주세요.' },
  {
    id: 2,
    date: '10.30 (금)',
    tag: '직무',
    question: '대용량 트래픽에서 DB 커넥션이 부족할 때 어떻게 대응하나요?',
    answer: '커넥션 풀 크기를 늘리기 전에 느린 쿼리와 트랜잭션 범위를 먼저 확인합니다.',
    feedback: fb(79, '풀 크기부터 늘리지 않는 판단이 좋아요.', '모니터링 지표를 언급하지 않았어요.', '어떤 지표로 부족을 판단했는지 덧붙여 보세요.'),
    past: [
      {
        date: '10.30 (금) 오전',
        answer: '커넥션 풀 크기를 늘립니다.',
        feedback: fb(48, '바로 쓸 수 있는 방법을 말했어요.', '원인을 보지 않고 늘리기만 했어요.', '왜 부족해졌는지 먼저 확인하는 순서를 넣어 보세요.'),
      },
    ],
  },
]

// 페이지 확인용으로 오래된 기록을 더 채운다 (10.29부터 하루씩 거슬러)
const OLDER: [string, Tag][] = [
  ['프로세스와 스레드의 차이를 실제 서버 운영 관점에서 설명해 주세요.', '직무'],
  ['REST API에서 멱등성이 왜 중요한가요?', '직무'],
  ['로그만으로 장애 원인을 찾았던 경험이 있나요?', '경험'],
  ['JPA 영속성 컨텍스트가 주는 이점과 함정은?', '직무'],
  ['어떤 개발 문화를 가진 팀에서 일하고 싶나요?', '컬처핏'],
  ['Redis를 캐시 말고 다른 용도로 써 본 적이 있나요?', '경험'],
  ['테스트 코드가 오히려 개발 속도를 늦춘 경험이 있나요?', '경험'],
  ['대규모 데이터 마이그레이션을 무중단으로 하려면?', '직무'],
  ['메시지 큐에서 같은 메시지가 두 번 처리되면 어떻게 하나요?', '직무'],
  ['API 응답 속도가 갑자기 느려졌을 때 무엇부터 보나요?', '직무'],
  ['데드락을 실제로 겪어 본 적이 있나요?', '경험'],
  ['모놀리식에서 MSA로 바꿀 때 가장 먼저 분리할 것은?', '직무'],
  ['일정이 촉박할 때 팀원과 우선순위를 어떻게 정하나요?', '협업'],
  ['팀원과 기술적인 의견이 달랐을 때 어떻게 결론을 냈나요?', '협업'],
  ['쿼리 튜닝으로 가장 큰 효과를 본 경험은?', '경험'],
  ['개발자로서 가장 중요하게 생각하는 가치는 무엇인가요?', '컬처핏'],
  ['레이트 리밋을 직접 구현한다면 어떻게 하겠어요?', '직무'],
  ['코드 리뷰에서 가장 자주 받는 지적은 무엇인가요?', '협업'],
]
const DAYS = ['일', '월', '화', '수', '목', '금', '토']
OLDER.forEach(([question, tag], i) => {
  const d = new Date(2026, 9, 29 - i)
  const date = `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${DAYS[d.getDay()]})`
  const answered = i % 4 !== 2
  QUESTIONS.push({
    id: 1000 - i,
    date,
    tag,
    question,
    ...(answered && {
      answer: '그때 상황과 판단 근거, 결과를 순서대로 정리해 답했습니다.',
      feedback: fb(60 + ((i * 7) % 35), '상황 설명이 구체적이에요.', '판단 근거가 짧아요.', '다른 선택지와 비교해 보세요.'),
    }),
  })
})

/**
 * 꼬리 질문을 새 질문으로 추가하고 id를 돌려준다. 같은 문장이 이미 있으면 그 질문 id.
 * 목록에서는 오늘 질문 바로 아래에 들어간다. (목업: 새로고침하면 사라짐)
 * TODO: 질문 생성 API로 교체
 */
export function addFollowUpQuestion(parent: QuestionRecord, question: string): number {
  const exists = QUESTIONS.find((q) => q.question === question)
  if (exists) return exists.id
  const d = new Date()
  const date = `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${DAYS[d.getDay()]})`
  const id = Math.max(...QUESTIONS.map((q) => q.id)) + 1
  QUESTIONS.splice(1, 0, { id, date, tag: parent.tag, question, parentId: parent.id })
  return id
}

/** '11.04 (수) 오전' → '2026.11.04 (수)'. 시간대(오전·점심) 표기는 뺀다. TODO: API 날짜(ISO)로 바꾸면 연도는 거기서 */
export function fullDate(label: string) {
  const m = label.match(/^(\d{2})\.(\d{2}) \((.)\)/)
  return m ? `2026.${m[1]}.${m[2]} (${m[3]})` : label
}
