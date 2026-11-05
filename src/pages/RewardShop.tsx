import { AppShell, PageTitle } from '../components/AppShell'

/** 리워드 샵 (준비 중). TODO: 상품·포인트 정책 정해지면 구성 */
export default function RewardShop() {
  return (
    <AppShell>
      <PageTitle eyebrow="REWARD SHOP" title="리워드 샵" />
      <div className="mt-8 grid min-h-[50svh] place-items-center rounded-2xl border border-dashed border-line px-6 text-center">
        <div>
          <p className="text-[18px] font-semibold text-paper">준비 중이에요</p>
          <p className="mt-2 text-[14px] text-mute">곧 열릴 예정이에요. 조금만 기다려 주세요.</p>
        </div>
      </div>
    </AppShell>
  )
}
