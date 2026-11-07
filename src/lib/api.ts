import { useSyncExternalStore } from 'react'

/**
 * member-service API 연동.
 * 개발: vite 프록시가 /api 를 member-service(7200)로 넘긴다. 배포: VITE_API_URL(게이트웨이 주소)을 앞에 붙인다.
 * 응답은 { statusCode, data, message } / 실패는 { statusCode, error: { code, message } }.
 */
const BASE = import.meta.env.VITE_API_URL ?? ''

/** provider: 어떻게 로그인했는지 (카카오 가입자는 비밀번호를 모르므로 비밀번호 변경을 숨긴다) */
export type Member = {
  memberId: string
  email?: string
  nickname?: string
  job?: string
  notification?: Notification
  frequency?: Frequency
  provider?: 'email' | 'kakao'
}
type Session = { accessToken: string; refreshToken: string; member: Member }

// ── 세션: localStorage에 두고, 바뀌면 구독 중인 화면(헤더 등)을 다시 그린다 ──
const KEY = 'prepair.session'
const listeners = new Set<() => void>()
let cached: Session | null | undefined

function read(): Session | null {
  if (cached !== undefined) return cached
  try {
    cached = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Session | null
  } catch {
    cached = null
  }
  return cached
}
function write(next: Session | null) {
  cached = next
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next))
    else localStorage.removeItem(KEY)
  } catch {
    // 저장이 막힌 브라우저(사생활 보호 모드 등)에서는 이번 탭 동안만 유지
  }
  listeners.forEach((l) => l())
}

export const session = {
  get: read,
  set: (s: Session) => write(s),
  updateMember: (m: Partial<Member>) => {
    const s = read()
    if (s) write({ ...s, member: { ...s.member, ...m } })
  },
  clear: () => write(null),
}

/** 지금 로그인한 회원 (없으면 null). 세션이 바뀌면 다시 그린다 */
export function useMember(): Member | null {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => read()?.member ?? null,
  )
}

// ── 요청 ──
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

type Options = { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown; auth?: boolean }

async function send<T>(path: string, { method = 'GET', body, auth = false }: Options, token?: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { ...(body !== undefined && { 'Content-Type': 'application/json' }), ...(auth && token && { Authorization: `Bearer ${token}` }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'NETWORK', '서버에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요.')
  }
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, json?.error?.code ?? 'UNKNOWN', json?.error?.message ?? '요청을 처리하지 못했어요.')
  return json?.data as T
}

// access token이 만료되면(401) refresh token으로 한 번만 새로 받고 다시 요청한다. 동시에 여러 요청이 401이어도 재발급은 한 번
let refreshing: Promise<string | null> | null = null
function refreshAccessToken(): Promise<string | null> {
  refreshing ??= (async () => {
    const s = read()
    if (!s) return null
    try {
      const t = await send<{ accessToken: string; refreshToken: string }>('/api/auth/refresh', { method: 'POST', body: { refreshToken: s.refreshToken } })
      write({ ...s, accessToken: t.accessToken, refreshToken: t.refreshToken })
      return t.accessToken
    } catch {
      write(null)
      return null
    }
  })().finally(() => (refreshing = null))
  return refreshing
}

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  if (!options.auth) return send<T>(path, options)
  try {
    return await send<T>(path, options, read()?.accessToken)
  } catch (e) {
    if (!(e instanceof ApiError) || e.status !== 401) throw e
    const token = await refreshAccessToken()
    if (!token) throw e
    return send<T>(path, options, token)
  }
}

// ── 회원 · 인증 ──
type Tokens = { accessToken: string; refreshToken: string }
export type Notification = 'email' | 'kakao' | 'both'
export type Frequency = 'every' | 'weekly'

export async function login(email: string, password: string) {
  const r = await api<Tokens & { member_info: Member }>('/api/auth/login', { method: 'POST', body: { email, password } })
  const { memberId, nickname, job, notification, frequency } = r.member_info
  session.set({ accessToken: r.accessToken, refreshToken: r.refreshToken, member: { memberId, email, nickname, job, notification, frequency, provider: 'email' } })
}

export async function logout() {
  const s = read()
  session.clear()
  // 서버에서 refresh token을 지운다. 실패해도 이 브라우저에서는 이미 로그아웃
  if (s) await api('/api/auth/logout', { method: 'POST', body: { refreshToken: s.refreshToken } }).catch(() => {})
}

/** 새로고침 뒤에도 토큰이 살아 있는지 확인하고 이메일을 채운다 */
export async function fetchMe() {
  const me = await api<Omit<Member, 'provider'>>('/api/auth/me', { auth: true })
  // 서버에 없는 값(undefined)으로 덮어쓰지 않는다
  session.updateMember(Object.fromEntries(Object.entries(me).filter(([, v]) => v !== undefined && v !== null)))
  return me
}

/** 마이페이지에서 바꾼 값 저장 (닉네임 · 직무 · 알림 채널 · 주기 중 바뀐 것만). 성공하면 세션도 바로 맞춘다 */
export async function updateProfile(patch: Partial<Pick<Member, 'nickname' | 'job' | 'notification' | 'frequency'>>) {
  await api('/api/members', { method: 'PATCH', body: patch, auth: true })
  session.updateMember(patch)
}

// 비밀번호 찾기: 가입된 이메일로 코드 → 코드 + 새 비밀번호로 바로 변경 (임시 비밀번호 없음)
export const sendResetCode = (email: string) => api('/api/members/email', { method: 'POST', body: { email, purpose: 'PASSWORD_RESET' } })
export const resetPassword = (email: string, verificationCode: string, newPassword: string) => api('/api/members/password-reset', { method: 'POST', body: { email, verificationCode, newPassword } })

/** 마이페이지 비밀번호 변경 (이메일 가입자만). 현재 비밀번호가 틀리면 INVALID_PASSWORD */
export const changePassword = (currentPassword: string, newPassword: string) => api('/api/members/password', { method: 'PATCH', body: { currentPassword, newPassword }, auth: true })

export const sendSignupCode = (email: string) => api('/api/members/email', { method: 'POST', body: { email, purpose: 'REGISTER' } })
export const verifySignupCode = (email: string, code: string) => api('/api/members/email-verify', { method: 'POST', body: { email, code } })
export const register = (body: { email: string; password: string; nickname: string; job: string; notification: Notification; frequency: Frequency }) =>
  api<{ id: string }>('/api/members/register', { method: 'POST', body })

// ── 카카오 ──
const KAKAO_STATE = 'prepair.kakao-state'
export const kakaoRedirectUri = () => `${window.location.origin}/auth/kakao/callback`

/** 카카오 로그인 화면으로 보낸다. state를 만들어 두고 돌아왔을 때 같은지 확인한다(다른 사이트가 시작한 로그인 막기) */
export async function startKakaoLogin() {
  const state = crypto.randomUUID()
  sessionStorage.setItem(KAKAO_STATE, state)
  const q = new URLSearchParams({ state, redirectUri: kakaoRedirectUri() })
  const { url } = await api<{ url: string }>(`/api/auth/kakao/url?${q}`)
  window.location.assign(url)
}

export const peekKakaoState = () => sessionStorage.getItem(KAKAO_STATE)

export function takeKakaoState() {
  const s = sessionStorage.getItem(KAKAO_STATE)
  sessionStorage.removeItem(KAKAO_STATE)
  return s
}

type KakaoLogin = Tokens & { isNewMember: false; memberId: string; nickname?: string }
type KakaoNew = { isNewMember: true; registrationToken: string; prefilledData: { email: string; nickname: string } }

/** 카카오에서 돌아온 code 처리: 기존 회원이면 바로 로그인, 새 회원이면 가입에 쓸 등록 토큰을 돌려준다 */
export async function kakaoCallback(code: string): Promise<KakaoNew | null> {
  const r = await api<KakaoLogin | KakaoNew>('/api/auth/kakao/callback', { method: 'POST', body: { code, redirectUri: kakaoRedirectUri() } })
  if (r.isNewMember) return r
  session.set({ accessToken: r.accessToken, refreshToken: r.refreshToken, member: { memberId: r.memberId, nickname: r.nickname, provider: 'kakao' } })
  return null
}

export async function kakaoRegister(body: { registrationToken: string; job: string; notification: Notification; frequency: Frequency }, prefilled: { email: string; nickname: string }) {
  const r = await api<Tokens & { memberId: string; nickname?: string }>('/api/auth/kakao/register', { method: 'POST', body })
  session.set({
    accessToken: r.accessToken,
    refreshToken: r.refreshToken,
    member: { memberId: r.memberId, email: prefilled.email, nickname: r.nickname ?? prefilled.nickname, job: body.job, notification: body.notification, frequency: body.frequency, provider: 'kakao' },
  })
}
