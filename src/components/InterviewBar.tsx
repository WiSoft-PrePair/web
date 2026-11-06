import { Link } from 'react-router'

/** 메인: 화면 아래 가운데에 떠 있는 알약 바: 왼쪽 안내 두 줄 + 오른쪽 버튼으로 바로 화상 면접(기기 점검)에 들어간다 */
export function InterviewBar() {
  return (
    <div className="fixed inset-x-0 bottom-6 z-20 flex justify-center px-[var(--gutter)]">
      {/* 유리 느낌: 반투명 흰색 + 흐림 + 위쪽 가장자리 하이라이트 */}
      <div className="flex w-full max-w-[470px] items-center justify-between gap-3 sm:gap-10 rounded-full border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(243,245,250,0.82))] py-2 pr-2 pl-5 sm:py-2.5 sm:pr-2.5 sm:pl-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_0_0_1px_rgba(16,24,40,0.04),0_12px_30px_-12px_rgba(16,24,40,0.18)] backdrop-blur-xl">
        <p className="min-w-0 leading-snug">
          <span className="block truncate text-[12px] font-medium text-mute">프리페어로 면접 연습하고</span>
          <span className="block truncate text-[15px] font-semibold text-paper">실전처럼 말로 답해 보세요</span>
        </p>
        <Link to="/app/interview/new" className="shrink-0 rounded-full bg-toss px-4 py-3 text-[14px] font-semibold sm:px-6 sm:py-3.5 text-white transition-colors hover:bg-toss-hover">
          화상 면접 시작
        </Link>
      </div>
    </div>
  )
}
