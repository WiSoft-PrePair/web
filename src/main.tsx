import { MotionConfig } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import RequireAuth from './components/RequireAuth'
import Landing from './pages/Landing'
import AnswerList from './pages/AnswerList'
import InterviewList from './pages/InterviewList'
import KakaoCallback from './pages/KakaoCallback'
import Login from './pages/Login'
import MockInterview from './pages/MockInterview'
import MyPage from './pages/MyPage'
import ResetPassword from './pages/ResetPassword'
import ServiceHome from './pages/ServiceHome'
import Signup from './pages/Signup'
import TextAnswer from './pages/TextAnswer'

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/password-reset', element: <ResetPassword /> },
  { path: '/auth/kakao/callback', element: <KakaoCallback /> },
  {
    element: <RequireAuth />,
    children: [
      { path: '/app', element: <ServiceHome /> },
      { path: '/app/answer', element: <AnswerList /> },
      { path: '/app/answer/:id', element: <TextAnswer /> },
      { path: '/app/interview', element: <InterviewList /> },
      { path: '/app/interview/new', element: <MockInterview /> },
      { path: '/app/me', element: <MyPage /> },
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
