import { useSyncExternalStore } from 'react'

/**
 * 질문 북마크 (목업): 이 브라우저(localStorage)에만 저장.
 * TODO: 서버 API가 생기면 그쪽으로 옮긴다.
 */
const KEY = 'prepair-bookmarks'
const listeners = new Set<() => void>()

function read(): Set<number> {
  try {
    const raw = localStorage.getItem(KEY)
    return new Set(raw ? (JSON.parse(raw) as number[]) : [])
  } catch {
    return new Set()
  }
}

let ids = read()

export function toggleBookmark(id: number) {
  const next = new Set(ids)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  ids = next
  try {
    localStorage.setItem(KEY, JSON.stringify([...ids]))
  } catch {
    /* 저장이 막힌 환경이면 이번 방문 동안만 유지 */
  }
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** 북마크한 질문 id 집합 (바뀌면 다시 그린다) */
export function useBookmarks() {
  return useSyncExternalStore(subscribe, () => ids)
}
