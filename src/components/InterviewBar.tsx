import { Link } from 'react-router'

/** 메인: 화면 아래 가운데에 떠 있는 알약 바: 왼쪽 안내 두 줄 + 오른쪽 두 버튼(텍스트 면접 · 화상 면접 기록 목록으로). 헤더에 면접 메뉴가 없어 여기가 시작점이다 */
const button =
  'rounded-full px-4 py-3 text-[14px] font-semibold outline-none transition-[background-color,transform] duration-150 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-toss/40 sm:px-5 sm:py-3.5'

export function InterviewBar() {
  return (
    <div className="fixed inset-x-0 bottom-6 z-20 flex justify-center px-[var(--gutter)]">
      {/* 유리 느낌: 반투명 흰색 + 흐림 + 위쪽 가장자리 하이라이트 */}
      <div className="flex w-full max-w-[540px] items-center justify-between gap-3 sm:gap-8 rounded-full border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(243,245,250,0.82))] py-2 pr-2 pl-5 sm:py-2.5 sm:pr-2.5 sm:pl-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_0_0_1px_rgba(16,24,40,0.04),0_12px_30px_-12px_rgba(16,24,40,0.18)] backdrop-blur-xl">
        <p className="min-w-0 leading-snug">
          <span className="block truncate text-[12px] font-medium text-mute">오늘도 함께 연습해요</span>
          <span className="block truncate text-[15px] font-semibold text-paper">지난 기록을 보고, 차근차근 이어 가요</span>
        </p>
        {/* 두 버튼은 같은 크기. 보조(텍스트)는 흰 알약 + 얇은 테두리, 주(화상)는 파란 알약 + 같은 색 그림자. 누르면 살짝 눌린다 */}
        <div className="flex shrink-0 items-center gap-2">
          <Link to="/app/answer" className={`${button} bg-white text-paper shadow-[0_0_0_1px_rgba(16,24,40,0.08),0_1px_2px_rgba(16,24,40,0.06)] hover:bg-[#f7f8fa]`}>
            텍스트 면접
          </Link>
          <Link to="/app/interview" className={`${button} bg-toss text-white shadow-[0_6px_16px_-6px_rgba(49,130,246,0.6)] hover:bg-toss-hover`}>
            화상 면접
          </Link>
        </div>
      </div>
    </div>
  )
}
