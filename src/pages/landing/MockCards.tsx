import { motion } from 'motion/react'

/**
 * 랜딩 'HOW IT WORKS'에 쓰는 서비스 장면 목업.
 * 실제 기능을 근거로 만든다: 질문은 이메일로 발송(member-service email-notification),
 * 피드백은 잘한 점/개선점 구조(기존 web MockInterviewHistory.jsx).
 * 참고한 UI 패턴: 01 iOS 잠금화면 알림, 02 화상회의(Zoom/Meet), 03 기록 목록.
 */

const frame = '@container relative aspect-[4/3] w-full md:aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-ink-2'
const EASE = [0.22, 1, 0.36, 1] as const
const inView = { once: true, margin: '-15%' } as const

/**
 * 카드 폭에 비례하는 크기. 기준은 데스크톱 카드 폭 655px(1440 화면), min은 좁은 화면에서의 최소값.
 * 글자·여백을 px로 고정하면 카드 폭이 바뀔 때 휴대폰(%)과 비율이 어긋나서 요소가 밀린다.
 */
const cq = (px: number, min = 0) => `max(${min}px, ${(px / 6.55).toFixed(3)}cqw)`

/** 01 · 왼쪽: 아침 8시 잠금화면 알림 / 오른쪽: 내가 정한 질문 설정 (받는 방법(이메일·카카오톡 알림)·직무·주기·시간) */
export function QuestionMock() {
  // 희망 직무는 사용자가 직접 쓰는 프롬프트라 핵심 설정 → 라임색으로 강조
  const settings = [
    { label: '받는 방법', value: '알림' },
    { label: '희망 직무', value: '백엔드 개발자', accent: true },
    { label: '받는 주기', value: '매일 · 매주 선택' },
    { label: '받는 시간', value: '오전 8시' },
  ]
  return (
    <div className={`${frame} bg-[radial-gradient(50%_70%_at_27%_100%,rgba(225,255,107,0.12),transparent_70%),#151515]`}>
      {/* 휴대폰: 왼쪽, 카드 아래로 잘려 나간다 */}
      <div
        className="absolute top-[9%] left-[8%] aspect-[9/19] w-[38%] border-[#2b2b2b] bg-[linear-gradient(180deg,#232323,#0e0e0e)]"
        style={{ borderWidth: cq(6, 4), borderRadius: cq(40, 22) }}
      >
        <div className="mx-auto w-[30%] rounded-full bg-black" style={{ marginTop: cq(10.3, 6), height: cq(17.2, 10) }} />
        <p className="text-center text-soft" style={{ marginTop: cq(13.8, 6), fontSize: cq(10.3, 8) }}>
          11월 5일 수요일
        </p>
        <p className="text-center font-display leading-none font-semibold tracking-tight" style={{ fontSize: cq(55, 26) }}>
          8:00
        </p>

        <div className="relative" style={{ margin: `${cq(44, 14)} ${cq(16, 8)} 0` }}>
          <div className="absolute inset-x-[6%] h-full rounded-2xl bg-white/[0.06]" style={{ bottom: `calc(-1 * ${cq(6.9, 4)})` }} />
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={inView}
            transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
            className="relative bg-white/[0.12] backdrop-blur-md"
            style={{ padding: `${cq(15, 8)} ${cq(15, 8)} ${cq(16, 9)}`, borderRadius: cq(15.5, 10) }}
          >
            <div className="flex items-center" style={{ gap: cq(6.9, 4) }}>
              <span
                className="grid place-items-center bg-lime font-display font-bold text-ink"
                style={{ width: cq(24.1, 14), height: cq(24.1, 14), borderRadius: cq(6.9, 4), fontSize: cq(12, 8) }}
              >
                P
              </span>
              <span className="font-semibold" style={{ fontSize: cq(12, 9) }}>
                PrePair
              </span>
              <span className="ml-auto text-soft" style={{ fontSize: cq(10.3, 8) }}>
                지금
              </span>
            </div>
            <p className="font-semibold" style={{ marginTop: cq(10, 5), fontSize: cq(12, 9) }}>
              오늘의 질문이 도착했어요
            </p>
            <p className="leading-relaxed text-soft" style={{ fontSize: cq(11.2, 9), marginTop: cq(3, 1) }}>
              트래픽이 갑자기 10배로 늘면, 가장 먼저 무엇을 확인하나요?
            </p>
          </motion.div>
        </div>
      </div>

      {/* 오른쪽: 질문 설정 카드 세로 정렬 */}
      <div className="absolute inset-y-0 right-[8%] left-[54%] flex flex-col justify-center" style={{ gap: cq(8, 4) }}>
        {settings.map((it, i) => (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={inView}
            transition={{ duration: 0.7, delay: 0.4 + i * 0.12, ease: EASE }}
            className={`border ${it.accent ? 'border-lime/50 bg-lime/[0.07]' : 'border-line bg-white/[0.03]'}`}
            style={{ padding: `${cq(11, 5)} ${cq(16, 7)}`, borderRadius: cq(12, 7) }}
          >
            <p className="text-mute" style={{ fontSize: cq(11, 8) }}>
              {it.label}
            </p>
            <p className={`font-medium ${it.accent ? 'text-lime' : 'text-paper'}`} style={{ fontSize: cq(15, 9), marginTop: cq(2, 1) }}>
              {it.value}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/** 02 · 화상 면접: 텍스트/화상 면접 전환 탭 + 내 화면 + AI 면접관(음성) 타일 + 자막 + 컨트롤 바 */
export function AnswerMock() {
  return (
    <div className={`${frame} bg-[radial-gradient(80%_80%_at_50%_30%,#262626,#121212)]`}>
      {/* 실루엣 */}
      <svg viewBox="0 0 160 100" className="absolute inset-x-0 bottom-0 mx-auto h-[74%]" aria-hidden>
        <circle cx="80" cy="38" r="17" fill="#2a2a2a" />
        <path d="M38 100c2-24 20-38 42-38s40 14 42 38z" fill="#2a2a2a" />
      </svg>

      {/* 녹화 표시 */}
      <div
        className="absolute flex items-center rounded-full bg-black/50 text-paper"
        style={{ top: cq(18, 10), left: cq(18, 10), gap: cq(6, 4), padding: `${cq(5, 3)} ${cq(12, 8)}`, fontSize: cq(12, 9) }}
      >
        <span className="animate-pulse rounded-full bg-red-500" style={{ width: cq(7, 5), height: cq(7, 5) }} />
        REC 00:42
      </div>

      {/* 답변 방식 전환 탭 */}
      <div
        className="absolute left-1/2 flex -translate-x-1/2 rounded-full bg-white/[0.07]"
        style={{ top: cq(18, 10), padding: cq(3, 2), fontSize: cq(12, 9) }}
      >
        <span className="text-mute" style={{ padding: `${cq(4, 3)} ${cq(14, 9)}` }}>
          텍스트
        </span>
        <span className="rounded-full bg-paper font-medium text-ink" style={{ padding: `${cq(4, 3)} ${cq(14, 9)}` }}>
          화상 면접
        </span>
      </div>

      {/* AI 면접관 타일: 질문을 음성으로 읽어 준다 */}
      <div
        className="absolute flex aspect-video w-[24%] flex-col items-center justify-center border border-lime/40 bg-[#1b1b1b]"
        style={{ top: cq(60, 38), right: cq(18, 10), gap: cq(8, 4), borderRadius: cq(12, 8) }}
      >
        <div className="flex items-center" style={{ height: cq(26, 14), gap: cq(3, 2) }}>
          {[0.5, 0.9, 0.6, 1, 0.7, 0.4].map((h, i) => (
            <motion.span
              key={i}
              className="rounded-full bg-lime"
              style={{ width: cq(3, 2), height: '100%', originY: 0.5 }}
              animate={{ scaleY: [h * 0.4, h, h * 0.5] }}
              transition={{ duration: 0.9, repeat: Infinity, repeatType: 'mirror', delay: i * 0.12 }}
            />
          ))}
        </div>
        <span className="text-soft" style={{ fontSize: cq(11, 8) }}>
          AI 면접관
        </span>
      </div>

      {/* 컨트롤 바 */}
      <div className="absolute left-1/2 flex -translate-x-1/2" style={{ bottom: cq(18, 10), gap: cq(10, 6) }}>
        <CtrlButton>
          <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z M5 11a7 7 0 0 0 14 0 M12 18v3" />
        </CtrlButton>
        <CtrlButton>
          <path d="M3 7h12v10H3z M15 10l6-3v10l-6-3" />
        </CtrlButton>
        <CtrlButton danger>
          <path d="M6 6l12 12 M18 6L6 18" />
        </CtrlButton>
      </div>
    </div>
  )
}

function CtrlButton({ children, danger = false }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <span className={`grid place-items-center rounded-full ${danger ? 'bg-red-500' : 'bg-white/10'}`} style={{ width: cq(40, 24), height: cq(40, 24) }}>
      <svg viewBox="0 0 24 24" style={{ width: cq(18, 12), height: cq(18, 12) }} fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </span>
  )
}

/**
 * 03 · 답변 기록 (기존 web MockInterviewHistory: 날짜 · 유형 · 점수, 펼치면 피드백).
 * 같은 질문에 여러 번 답할 수 있고, 모든 답변과 피드백을 목록에서 다시 볼 수 있다.
 * 깔끔하게: 테두리 대신 구분선, 펼친 기록 1개 + 접힌 기록 2개, 글자 크기는 3단계만.
 */
const OPENED = { q: '트래픽이 갑자기 10배로 늘면, 가장 먼저 무엇을 확인하나요?', meta: '11.05 · 오늘의 질문 · 3번 답변', score: 82 }
const FEEDBACK = [
  { label: '잘한 점', dot: 'bg-lime', body: '지표부터 확인하는 순서가 분명했어요.' },
  { label: '부족한 점', dot: 'bg-paper', body: 'DB를 병목으로 본 근거가 빠져 있어요.' },
  { label: '개선 방향', dot: 'bg-mute', body: '지표 하나를 근거로 들어 보세요.' },
]
const CLOSED = [
  { q: '협업 중 의견이 갈렸을 때, 어떻게 결정했나요?', meta: '11.04 · 오늘의 질문 · 2번 답변', score: 74 },
  { q: '백엔드 신입 화상 면접 · 5문항', meta: '11.02 · 화상 면접', score: 71 },
]

export function FeedbackMock() {
  const fade = (i: number) => ({
    initial: { opacity: 0, y: 8 },
    whileInView: { opacity: 1, y: 0 },
    viewport: inView,
    transition: { duration: 0.6, delay: 0.15 + i * 0.1, ease: EASE },
  })
  return (
    <div className={`${frame} flex flex-col justify-center bg-[#151515]`} style={{ padding: `0 ${cq(40, 14)}` }}>
      <div className="flex items-baseline justify-between">
        <p className="font-medium" style={{ fontSize: cq(15, 11) }}>
          답변 기록
        </p>
        <p className="text-mute" style={{ fontSize: cq(12, 9) }}>
          최신순
        </p>
      </div>

      {/* 펼친 기록 */}
      <motion.div {...fade(0)} className="bg-white/[0.04]" style={{ marginTop: cq(14, 7), padding: `${cq(18, 9)} ${cq(20, 10)}`, borderRadius: cq(14, 9) }}>
        <div className="flex items-start justify-between" style={{ gap: cq(16, 8) }}>
          <div className="min-w-0">
            <p className="truncate text-paper" style={{ fontSize: cq(15, 11) }}>
              {OPENED.q}
            </p>
            <p className="text-mute" style={{ fontSize: cq(12, 9), marginTop: cq(4, 2) }}>
              {OPENED.meta}
            </p>
          </div>
          <p className="shrink-0 font-display leading-none font-semibold text-lime" style={{ fontSize: cq(30, 18) }}>
            {OPENED.score}
          </p>
        </div>
        <div className="flex flex-col" style={{ marginTop: cq(16, 8), gap: cq(8, 4) }}>
          {FEEDBACK.map((f) => (
            <div key={f.label} className="flex items-center" style={{ gap: cq(10, 6), fontSize: cq(12, 9) }}>
              <span className={`shrink-0 rounded-full ${f.dot}`} style={{ width: cq(6, 4), height: cq(6, 4) }} />
              <span className="shrink-0 text-mute" style={{ width: cq(60, 40) }}>
                {f.label}
              </span>
              <span className="truncate text-soft">{f.body}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 접힌 기록 */}
      <div className="divide-y divide-line" style={{ marginTop: cq(6, 3) }}>
        {CLOSED.map((c, i) => (
          <motion.div key={c.q} {...fade(i + 1)} className="flex items-center justify-between" style={{ gap: cq(16, 8), padding: `${cq(14, 7)} ${cq(20, 10)}` }}>
            <div className="min-w-0">
              <p className="truncate text-soft" style={{ fontSize: cq(15, 11) }}>
                {c.q}
              </p>
              <p className="text-mute" style={{ fontSize: cq(12, 9), marginTop: cq(4, 2) }}>
                {c.meta}
              </p>
            </div>
            <p className="shrink-0 font-display leading-none font-semibold text-mute" style={{ fontSize: cq(22, 14) }}>
              {c.score}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
