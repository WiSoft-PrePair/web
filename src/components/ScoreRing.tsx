/** 점수 링: 답했으면 최근 점수만큼 차오른 원 + 가운데 숫자, 아직이면 점선 원. 목록·답변 기록 공용 */
export function ScoreRing({ score, size = 36 }: { score?: number; size?: number }) {
  if (score === undefined) return <span aria-label="아직 답하지 않음" className="shrink-0 rounded-full border border-dashed border-dim" style={{ width: size, height: size }} />
  const c = 2 * Math.PI * 16
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} aria-label={`${score}점`}>
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r="16" fill="none" strokeWidth="2.5" className="stroke-tint/10" />
        <circle cx="18" cy="18" r="16" fill="none" strokeWidth="2.5" strokeLinecap="round" className="stroke-accent-lg" strokeDasharray={`${(c * score) / 100} ${c}`} />
      </svg>
      <span className="font-semibold text-paper tabular-nums" style={{ fontSize: Math.round(size * 0.31) }}>
        {score}
      </span>
    </span>
  )
}
