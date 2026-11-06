/**
 * 로그인 후 화면의 겉모습: 화면 모드 + 대표색(잔디색). 지금은 화이트 + 하늘 파랑으로 고정.
 * - 모드는 배경·글자색만 뒤집는다(index.css의 [data-theme="light"]).
 * - 대표색은 잔디에는 그대로, 글자·강조에는 배경에서 읽히도록 자동 보정한 색을 쓴다.
 */
export type Mode = 'light' | 'dark'
export type Appearance = { mode: Mode; accent: string }

export const DEFAULT_ACCENT = '#4a90f0' // 하늘 파랑 (2026-11-06 #2f80ed에서 조금 연하게)
/** 화면 모드·대표색은 고정 (화이트 + 하늘 파랑). 사용자 설정은 2026-11-06에 없앴다 */
const FIXED: Appearance = { mode: 'light', accent: DEFAULT_ACCENT }

export function useAppearance() {
  return FIXED
}

/* ───────── 색 계산 ───────── */

const hexToRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const rgbToHex = (rgb: number[]) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`

function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

/** 배경 위에서 글자로 읽히도록(대비 4.5:1 이상) 같은 색 계열을 검정 또는 흰색 쪽으로 섞는다 */
export function readableOn(color: string, bg: string, target = 4.5) {
  if (contrast(color, bg) >= target) return color
  const toward = luminance(bg) > 0.5 ? [0, 0, 0] : [255, 255, 255]
  const base = hexToRgb(color)
  for (let t = 0.05; t <= 1; t += 0.05) {
    const mixed = rgbToHex(base.map((v, i) => v + (toward[i] - v) * t))
    if (contrast(mixed, bg) >= target) return mixed
  }
  return rgbToHex(toward)
}

/** 대표색 위에 올릴 글자색: 더 잘 읽히는 쪽(검정/흰색) */
export function onAccent(color: string) {
  return contrast(color, '#111111') >= contrast(color, '#ffffff') ? '#111111' : '#ffffff'
}

/** 화면 모드별 배경색 (index.css와 같은 값) */
export const BG: Record<Mode, string> = { light: '#ffffff', dark: '#111111' }
