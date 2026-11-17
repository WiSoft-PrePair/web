import { JOBS, type JobCode } from './jobs'

/**
 * 직무 선택: 15개를 한 번에 칩으로 보여 준다. 분야 제목은 없이 분야 순서대로 이어 놓아 비슷한 직무끼리 붙어 있게 한다.
 * 고른 직무는 파란 칩. 마우스를 올리면 테두리·글자색만 바뀐다(배경 없음).
 */
// value는 string: 예전 자유 입력 직무를 가진 회원도 있어서 (그때는 아무 칩도 선택되지 않는다)
export function JobPicker({ value, onChange }: { value: string; onChange: (code: JobCode) => void }) {
  return (
    <div role="group" aria-label="직무" className="flex flex-wrap justify-center gap-1.5">
      {JOBS.map((job) => {
        const selected = job.code === value
        return (
          <button
            key={job.code}
            type="button"
            // 일반 토글 버튼으로 알린다: Tab으로 이동하고 Enter·Space로 고르는 지금 동작과 맞다
            aria-pressed={selected}
            onClick={() => onChange(job.code)}
            className={`h-9 rounded-full border px-3.5 text-[14px] transition-colors ${
              selected ? 'border-toss bg-toss font-semibold text-white' : 'border-line text-soft hover:border-dim hover:text-paper'
            }`}
          >
            {job.title}
          </button>
        )
      })}
    </div>
  )
}
