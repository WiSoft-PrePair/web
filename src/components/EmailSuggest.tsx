import { motion } from 'motion/react'
import { domainTypo } from './emailDomains'

/** 입력칸 바로 아래에 겹쳐 뜨는 후보 목록 (아래 칸을 밀지 않는다). 부모는 relative여야 한다 */
export function EmailSuggestMenu({ items, active, onPick, onHover }: { items: string[]; active: number; onPick: (v: string) => void; onHover: (i: number) => void }) {
  return (
    <motion.ul
      role="listbox"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-x-0 top-full z-20 mt-1.5 rounded-2xl border border-line bg-card p-1.5 shadow-card"
    >
      {items.map((v, i) => (
        <li
          key={v}
          role="option"
          aria-selected={i === active}
          // 누르는 순간 입력칸 포커스가 빠져 목록이 닫히지 않게 mousedown에서 처리
          onMouseDown={(e) => {
            e.preventDefault()
            onPick(v)
          }}
          onMouseEnter={() => onHover(i)}
          className={`cursor-pointer truncate rounded-xl px-3.5 py-2.5 text-[15px] transition-colors ${i === active ? 'bg-tint/[0.05] text-paper' : 'text-soft'}`}
        >
          {v}
        </li>
      ))}
    </motion.ul>
  )
}

/** 다 적은 도메인이 오타 같으면 고칠 주소를 한 줄로 제안 (gmial.com → gmail.com) */
export function EmailTypoHint({ email, onPick }: { email: string; onPick: (email: string) => void }) {
  const typo = domainTypo(email)
  if (!typo) return null
  const fixed = `${email.slice(0, email.lastIndexOf('@'))}@${typo}`
  return (
    <p className="mt-2.5 pl-1 text-xs text-mute">
      혹시{' '}
      <button type="button" onClick={() => onPick(fixed)} className="font-semibold text-toss underline-offset-2 hover:underline">
        {fixed}
      </button>
      인가요?
    </p>
  )
}
