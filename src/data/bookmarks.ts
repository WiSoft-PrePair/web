import { useSyncExternalStore } from 'react'

/**
 * 북마크 (목업): 이 브라우저(localStorage)에만 저장. 질문(텍스트 면접)과 화상 면접 기록을 따로 둔다.
 * TODO: 서버 API가 생기면 그쪽으로 옮긴다.
 */
function createBookmarkStore(key: string) {
  const listeners = new Set<() => void>()
  let ids: Set<number>
  try {
    const raw = localStorage.getItem(key)
    ids = new Set(raw ? (JSON.parse(raw) as number[]) : [])
  } catch {
    ids = new Set()
  }

  const toggle = (id: number) => {
    const next = new Set(ids)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    ids = next
    try {
      localStorage.setItem(key, JSON.stringify([...ids]))
    } catch {
      /* 저장이 막힌 환경이면 이번 방문 동안만 유지 */
    }
    listeners.forEach((fn) => fn())
  }
  const subscribe = (fn: () => void) => {
    listeners.add(fn)
    return () => listeners.delete(fn)
  }
  /** 북마크한 id 집합 (바뀌면 다시 그린다) */
  const use = () => useSyncExternalStore(subscribe, () => ids)
  return { toggle, use }
}

const questions = createBookmarkStore('prepair-bookmarks')
const interviews = createBookmarkStore('prepair-interview-bookmarks')

export const toggleBookmark = questions.toggle
export const useBookmarks = questions.use
export const toggleInterviewBookmark = interviews.toggle
export const useInterviewBookmarks = interviews.use
