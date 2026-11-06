/**
 * 홈 '지금 뜨는 공고' 목업. 회사는 모두 가상(실제 회사·로고를 쓰지 않음), 직군은 고르게 섞음.
 * TODO: 채용 공고 공개 API(사람인·고용24 등) 연동 — 이용 조건·키 발급 확인 후. 다른 사이트 크롤링은 하지 않는다.
 */
export type JobPosting = {
  id: number
  company: string
  /** 로고 대신 쓰는 첫 글자 칸 색 */
  color: string
  title: string
  field: string
  type: string
  career: string
  location: string
  /** 마감까지 남은 날 (0 = 오늘 마감, null = 상시 채용) */
  dday: number | null
  url: string
}

export const JOB_POSTINGS: JobPosting[] = [
  { id: 1, company: '한빛커머스', color: '#3182f6', title: '백엔드 개발자 (Java/Spring)', field: '개발', type: '정규직', career: '경력 3년+', location: '서울', dday: 5, url: '' },
  { id: 2, company: '모아핀테크', color: '#00a37a', title: '신입 서비스 기획자', field: '기획', type: '정규직', career: '신입', location: '서울', dday: 12, url: '' },
  { id: 3, company: '그린로지스', color: '#f59e0b', title: '물류 운영 매니저', field: '운영', type: '정규직', career: '경력 무관', location: '경기', dday: 2, url: '' },
  { id: 4, company: '소담헬스케어', color: '#ec4899', title: '브랜드 마케터', field: '마케팅', type: '계약직', career: '경력 2년+', location: '서울', dday: 9, url: '' },
  { id: 5, company: '누리에듀', color: '#8b5cf6', title: '프로덕트 디자이너', field: '디자인', type: '정규직', career: '경력 1년+', location: '원격', dday: null, url: '' },
  { id: 6, company: '바른회계법인', color: '#0ea5e9', title: '재무회계 담당자 (신입)', field: '재무', type: '정규직', career: '신입', location: '부산', dday: 1, url: '' },
  { id: 7, company: '새봄푸드', color: '#16a34a', title: '식품 품질관리(QC) 담당자', field: '생산·품질', type: '정규직', career: '경력 2년+', location: '충북', dday: 7, url: '' },
  { id: 8, company: '하늘여행', color: '#06b6d4', title: '고객 경험(CX) 매니저', field: '고객지원', type: '정규직', career: '신입', location: '서울', dday: 14, url: '' },
  { id: 9, company: '온길모빌리티', color: '#ef4444', title: 'B2B 영업 담당자', field: '영업', type: '정규직', career: '경력 3년+', location: '판교', dday: 3, url: '' },
]
