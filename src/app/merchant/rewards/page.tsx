import type { Metadata } from "next";

import { MerchantRewardsManager } from "@/components/kard/merchant-rewards-manager";
import { getCurrentMerchant, getMerchantRewards } from "@/lib/api-client";

export const metadata: Metadata = { title: "Rewards" };

export default async function MerchantRewardsPage() {
  const merchant = await getCurrentMerchant();
  const rewards = await getMerchantRewards(merchant.id);

  return (
    <div className="mx-auto max-w-4xl">
      <MerchantRewardsManager merchantId={merchant.id} initialRewards={rewards} />
    </div>
  );
}
