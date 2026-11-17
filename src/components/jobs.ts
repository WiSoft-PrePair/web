/** 선택할 수 있는 직무 (서버 Job 코드와 같은 목록). 분야 순서(웹 → 모바일 → 게임 → 데이터·AI → 인프라 → 기타)로 놓아 비슷한 직무끼리 붙어 있게 한다 */
export const JOBS = [
  { code: 'BACKEND', title: '백엔드 개발자' },
  { code: 'FRONTEND', title: '프론트엔드 개발자' },
  { code: 'FULLSTACK', title: '풀스택 개발자' },
  { code: 'ANDROID', title: 'Android 개발자' },
  { code: 'IOS', title: 'iOS 개발자' },
  { code: 'CROSS_PLATFORM', title: '크로스플랫폼 앱 개발자' },
  { code: 'GAME_CLIENT', title: '게임 클라이언트 개발자' },
  { code: 'GAME_SERVER', title: '게임 서버 개발자' },
  { code: 'AI_ML', title: 'AI/ML 엔지니어' },
  { code: 'DATA_ENGINEER', title: '데이터 엔지니어' },
  { code: 'DEVOPS', title: 'DevOps 엔지니어' },
  { code: 'SECURITY', title: '보안 엔지니어' },
  { code: 'DBA', title: 'DBA' },
  { code: 'EMBEDDED', title: '임베디드 개발자' },
  { code: 'QA', title: 'QA 엔지니어' },
] as const

/** 서버로 보내는 직무 코드 (예: 'BACKEND') */
export type JobCode = (typeof JOBS)[number]['code']

/** 코드 → 화면 이름. 목록에 없는 값(예전 자유 입력)은 그대로 보여 준다 */
export function jobTitle(code: string) {
  return JOBS.find((j) => j.code === code)?.title ?? code
}
