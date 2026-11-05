/**
 * 질문별 메모 (목업): 이 브라우저(localStorage)에만 저장.
 * TODO: 서버 API가 생기면 그쪽으로 옮긴다.
 */
const KEY = 'prepair-memos'

function readAll(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

export function readMemo(id: number): string {
  return readAll()[id] ?? ''
}

export function saveMemo(id: number, text: string) {
  try {
    const all = readAll()
    if (text.trim()) all[id] = text
    else delete all[id]
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* 저장이 막힌 환경이면 이번 방문 동안만 유지 */
  }
}
