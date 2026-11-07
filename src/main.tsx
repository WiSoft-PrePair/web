import { MotionConfig } from 'motion/react'
import { type ComponentType, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import RequireAuth from './components/RequireAuth'


/**
 * 첫 화면(랜딩)만 바로 싣고, 나머지 화면은 들어갈 때 따로 받는다(라우트별 코드 분할).
 * 라우터가 다음 화면 코드를 다 받은 뒤 넘어가므로 빈 화면이 깜빡이지 않는다.
 */
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await load()).default })

const router = createBrowserRouter([
  { path: '/', lazy: page(() => import('./pages/Landing')) },
  { path: '/login', lazy: page(() => import('./pages/Login')) },
  { path: '/signup', lazy: page(() => import('./pages/Signup')) },
  { path: '/password-reset', lazy: page(() => import('./pages/ResetPassword')) },
  { path: '/auth/kakao/callback', lazy: page(() => import('./pages/KakaoCallback')) },
  {
    element: <RequireAuth />,
    children: [
      { path: '/app', lazy: page(() => import('./pages/ServiceHome')) },
      { path: '/app/answer', lazy: page(() => import('./pages/AnswerList')) },
      { path: '/app/answer/:id', lazy: page(() => import('./pages/TextAnswer')) },
      { path: '/app/interview', lazy: page(() => import('./pages/InterviewList')) },
      { path: '/app/interview/new', lazy: page(() => import('./pages/MockInterview')) },
      { path: '/app/me', lazy: page(() => import('./pages/MyPage')) },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <RouterProvider router={router} />
    </MotionConfig>
  </StrictMode>,
)
