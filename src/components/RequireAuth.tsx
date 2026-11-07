import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { fetchMe, useMember } from '../lib/api'

let checked = false

/**
 * /app 아래 화면: 로그인하지 않았으면 로그인으로 보내고, 로그인 뒤 원래 화면으로 돌아오게 next를 붙인다.
 * 페이지를 처음 열 때 한 번 /api/auth/me로 토큰이 살아 있는지 확인한다(만료면 재발급, 실패하면 세션이 지워져 로그인으로).
 */
export default function RequireAuth() {
  const member = useMember()
  const location = useLocation()
  useEffect(() => {
    if (!member || checked) return
    checked = true
    fetchMe().catch(() => {})
  }, [member])
  if (!member) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return <Outlet />
}
