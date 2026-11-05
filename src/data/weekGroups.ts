/**
 * 목록을 '이번 주 · 지난주 · 이전'으로 묶는다 (텍스트·화상 면접 목록 공용).
 * 날짜는 목업 형식 "11.04 (수)" (2026년). 기준일은 가장 최근 항목 날짜.
 * TODO: 서버 날짜(ISO)로 바꾸고 오늘(KST) 기준으로
 */
const toDate = (label: string) => {
  const m = label.match(/^(\d{2})\.(\d{2})/)
  return m ? new Date(2026, Number(m[1]) - 1, Number(m[2])) : new Date(0)
}
const mondayOf = (d: Date) => {
  const m = new Date(d)
  m.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  m.setHours(0, 0, 0, 0)
  return m
}

export function groupByWeek<T extends { date: string }>(items: T[], today: string) {
  const thisWeek = mondayOf(toDate(today)).getTime()
  const nameOf = (label: string) => {
    const w = mondayOf(toDate(label)).getTime()
    if (w >= thisWeek) return '이번 주'
    if (w >= thisWeek - 7 * 86_400_000) return '지난주'
    return '이전'
  }
  return items.reduce<{ name: string; rows: T[] }[]>((acc, r) => {
    const name = nameOf(r.date)
    if (acc.at(-1)?.name !== name) acc.push({ name, rows: [] })
    acc.at(-1)!.rows.push(r)
    return acc
  }, [])
}
