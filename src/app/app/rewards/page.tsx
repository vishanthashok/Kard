import type { Metadata } from "next";
import Link from "next/link";
import { Gift } from "lucide-react";

import { EmptyState } from "@/components/kard/empty-state";
import { RewardCard } from "@/components/kard/reward-card";
import { ScreenHeader } from "@/components/kard/screen-header";
import { SectionHeader } from "@/components/kard/section-header";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getRewards } from "@/lib/api-client";

export const metadata: Metadata = { title: "Rewards" };

export default async function RewardsPage() {
  const user = await getCurrentUser();
  const rewards = await getRewards(user.id);

  const unlocked = rewards.filter((entry) => entry.isUnlocked);
  const locked = rewards.filter((entry) => !entry.isUnlocked);

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Rewards"
        description="Everything you are working toward, across your Kards."
      />

      {rewards.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No rewards yet"
          description="Once you start earning at a Kard business, their rewards show up here."
          action={
            <Button asChild className="h-10 px-4">
              <Link href="/app/explore">Browse nearby</Link>
            </Button>
          }
        />
      ) : (
        <>
          {unlocked.length > 0 ? (
            <section className="space-y-3">
              <SectionHeader
                title="Ready to redeem"
                description={`${unlocked.length} ${unlocked.length === 1 ? "reward" : "rewards"} unlocked`}
              />
              <ul className="space-y-3">
                {unlocked.map((entry) => (
                  <li key={entry.reward.id}>
                    <RewardCard progress={entry} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {locked.length > 0 ? (
            <section className="space-y-3">
              <SectionHeader title="Keep earning" />
              <ul className="space-y-3">
                {locked.map((entry) => (
                  <li key={entry.reward.id}>
                    <RewardCard progress={entry} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="pt-2 text-center text-xs text-muted-foreground">
            Show your Kard at the counter to redeem.
          </p>
        </>
      )}
    </div>
  );
}
