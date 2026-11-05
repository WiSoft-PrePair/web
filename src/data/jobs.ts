import { useSyncExternalStore } from 'react'

/**
 * 공고 목록 (목업): 이 브라우저(localStorage)에만 저장.
 * TODO: 서버 API가 생기면 그쪽으로 옮긴다.
 */
export type Stage = 'wish' | 'applied' | 'docs' | 'interview' | 'result'
export type Job = { id: number; company: string; role: string; stage: Stage; deadline?: string; memo?: string }

export const STAGES: { key: Stage; label: string }[] = [
  { key: 'wish', label: '지원 예정' },
  { key: 'applied', label: '지원 완료' },
  { key: 'docs', label: '서류 통과' },
  { key: 'interview', label: '면접' },
  { key: 'result', label: '결과' },
]

// 처음 방문했을 때 보여 줄 예시 (회사명은 가상)
const SAMPLE: Job[] = [
  { id: 1, company: '가나다페이', role: '백엔드 엔지니어', stage: 'wish', deadline: '2026-11-08' },
  { id: 2, company: '라마커머스', role: '서버 개발자 (주문)', stage: 'wish', deadline: '2026-11-14' },
  { id: 3, company: '바사모빌리티', role: 'Backend Engineer', stage: 'applied', memo: '11.01 지원' },
  { id: 4, company: '아자헬스케어', role: '플랫폼 백엔드', stage: 'applied', memo: '10.28 지원' },
  { id: 5, company: '차카뱅크', role: '코어뱅킹 서버', stage: 'docs', memo: '코딩테스트 11.09' },
  { id: 6, company: '타파게임즈', role: '게임 서버', stage: 'interview', memo: '1차 면접 11.12' },
  { id: 7, company: '하랩스', role: '백엔드 (신입)', stage: 'result', memo: '불합격' },
]

const KEY = 'prepair-jobs'
const listeners = new Set<() => void>()

function read(): Job[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Job[]) : SAMPLE
  } catch {
    return SAMPLE
  }
}

let jobs = read()

function commit(next: Job[]) {
  jobs = next
  try {
    localStorage.setItem(KEY, JSON.stringify(jobs))
  } catch {
    /* 저장이 막힌 환경이면 이번 방문 동안만 유지 */
  }
  listeners.forEach((fn) => fn())
}

export function addJob(job: Omit<Job, 'id'>) {
  const id = Math.max(0, ...jobs.map((j) => j.id)) + 1
  commit([...jobs, { ...job, id }])
}

/** 지우고, 되돌릴 때 쓸 함수를 돌려준다 (원래 자리로 복구) */
export function removeJob(id: number) {
  const index = jobs.findIndex((j) => j.id === id)
  if (index < 0) return () => {}
  const removed = jobs[index]
  commit(jobs.filter((j) => j.id !== id))
  return () => {
    if (jobs.some((j) => j.id === id)) return
    commit([...jobs.slice(0, index), removed, ...jobs.slice(index)])
  }
}

export function moveJob(id: number, stage: Stage) {
  commit(jobs.map((j) => (j.id === id ? { ...j, stage } : j)))
}

export function useJobs() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => jobs,
  )
}

/** 마감일까지 남은 날 (오늘 = 0, 지났으면 음수) */
export function daysLeft(deadline: string, today = new Date()) {
  const [y, m, d] = deadline.split('-').map(Number)
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((new Date(y, m - 1, d).getTime() - start.getTime()) / 86_400_000)
}

export function deadlineLabel(deadline: string) {
  const n = daysLeft(deadline)
  return n > 0 ? `마감 D-${n}` : n === 0 ? '오늘 마감' : '마감 지남'
}
