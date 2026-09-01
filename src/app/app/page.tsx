import Link from "next/link";
import { CreditCard } from "lucide-react";

import { KardBalanceCard } from "@/components/kard/kard-balance-card";
import { KardLogo } from "@/components/kard/kard-logo";
import { MerchantCard } from "@/components/kard/merchant-card";
import { EmptyState } from "@/components/kard/empty-state";
import { PersonAvatar } from "@/components/kard/person-avatar";
import { QuickActions } from "@/components/kard/quick-actions";
import { SectionHeader } from "@/components/kard/section-header";
import { Button } from "@/components/ui/button";
import {
  getCurrentUser,
  getNearbyMerchants,
  getRewards,
  getTransactions,
  getWallets,
} from "@/lib/api-client";

export default async function CustomerHomePage() {
  const user = await getCurrentUser();
  const [wallets, rewards, nearby, transactions] = await Promise.all([
    getWallets(user.id),
    getRewards(user.id),
    getNearbyMerchants(user.id),
    getTransactions(user.id, { limit: 10 }),
  ]);

  const totalPoints = wallets.reduce(
    (total, summary) => total + summary.wallet.pointsBalance,
    0,
  );
  const rewardsReadyCount = rewards.filter((reward) => reward.isUnlocked).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <KardLogo />
        <Link
          href="/app/profile"
          aria-label="Profile"
          className="rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <PersonAvatar name={user.fullName} />
        </Link>
      </div>

      <KardBalanceCard
        totalPoints={totalPoints}
        walletCount={wallets.length}
        memberId={user.memberId}
      />

      <QuickActions
        rewardsReadyCount={rewardsReadyCount}
        nearbyCount={nearby.length}
        recentActivityCount={transactions.length}
      />

      <section className="space-y-3">
        <SectionHeader
          title="Your Kards"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/explore">Find more</Link>
            </Button>
          }
        />

        {wallets.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No Kards yet"
            description="Scan your Kard at any participating spot and it will show up here."
            action={
              <Button asChild className="h-10 px-4">
                <Link href="/app/explore">Browse nearby</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {wallets.map((summary) => (
              <li key={summary.wallet.id}>
                <MerchantCard summary={summary} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
