import { useSyncExternalStore } from 'react'

/**
 * 로그인 후 화면의 겉모습: 화면 모드(라이트/다크) + 대표색(잔디색).
 * - 모드는 배경·글자색만 뒤집는다(index.css의 [data-theme="light"]).
 * - 대표색은 사용자가 자유롭게 고른다. 잔디에는 그대로, 글자·강조에는 배경에서 읽히도록 자동 보정한 색을 쓴다.
 * 이 브라우저(localStorage)에만 저장. TODO: 서버 사용자 설정으로 옮기기
 */
export type Mode = 'light' | 'dark'
export type Appearance = { mode: Mode; accent: string }

export const DEFAULT_ACCENT = '#e1ff6b' // 브랜드 라임(형광)
const KEY = 'prepair-appearance'
const listeners = new Set<() => void>()

function read(): Appearance {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Appearance>
    return {
      mode: v.mode === 'dark' ? 'dark' : 'light',
      accent: typeof v.accent === 'string' && /^#[0-9a-f]{6}$/i.test(v.accent) ? v.accent : DEFAULT_ACCENT,
    }
  } catch {
    return { mode: 'light', accent: DEFAULT_ACCENT }
  }
}

let state = read()

export function setAppearance(next: Partial<Appearance>) {
  state = { ...state, ...next }
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* 저장이 막힌 환경이면 이번 방문 동안만 */
  }
  listeners.forEach((fn) => fn())
}

export function useAppearance() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => state,
  )
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

/** 대표색으로 만든 커서 (라임 점 커서와 같은 모양) */
export function cursorFor(color: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><circle cx='8' cy='8' r='8' fill='${color}'/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 8 8, auto`
}
