/** 회원가입 이메일 칸의 도메인 도움말: '@' 뒤 자동완성 후보와 오타 추정 */
export const EMAIL_DOMAINS: readonly string[] = ['naver.com', 'gmail.com', 'daum.net', 'kakao.com', 'hanmail.net', 'nate.com']

function domainOf(email: string) {
  const at = email.lastIndexOf('@')
  return at < 1 ? null : email.slice(at + 1).toLowerCase()
}

/** '@' 뒤를 입력하는 중이면 앞부분이 맞는 도메인 후보. 이미 완성된 도메인이면 없음 */
export function domainSuggestions(email: string): string[] {
  const typed = domainOf(email)
  if (typed === null || EMAIL_DOMAINS.includes(typed)) return []
  return EMAIL_DOMAINS.filter((d) => d.startsWith(typed))
}

/** 다 적은 도메인이 흔한 도메인과 두 글자 이내로 다르면 그 도메인 (gmial.com → gmail.com) */
export function domainTypo(email: string): string | null {
  const typed = domainOf(email)
  if (typed === null || !typed.includes('.') || EMAIL_DOMAINS.includes(typed)) return null
  return EMAIL_DOMAINS.find((d) => editDistance(typed, d) <= 2) ?? null
}

/** 한 글자 넣기·빼기·바꾸기를 몇 번 해야 같아지는지 */
function editDistance(a: string, b: string) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[b.length]
}
