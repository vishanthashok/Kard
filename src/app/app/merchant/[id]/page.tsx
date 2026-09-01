import { notFound } from "next/navigation";
import { Clock, Gift, MapPin, Receipt } from "lucide-react";

import { EmptyState } from "@/components/kard/empty-state";
import { MerchantAvatar } from "@/components/kard/merchant-avatar";
import { PointsProgress } from "@/components/kard/points-progress";
import { RewardCard } from "@/components/kard/reward-card";
import { ScreenHeader } from "@/components/kard/screen-header";
import { SectionHeader } from "@/components/kard/section-header";
import { TransactionItem } from "@/components/kard/transaction-item";
import { KardApiError } from "@/lib/api-types";
import { getCurrentUser, getMerchantDetail } from "@/lib/api-client";
import { formatDistance, formatPoints } from "@/lib/format";

export default async function MerchantDetailPage({
  params,
}: PageProps<"/app/merchant/[id]">) {
  const { id } = await params;
  const user = await getCurrentUser();

  const detail = await getMerchantDetail(user.id, id).catch((error: unknown) => {
    if (error instanceof KardApiError && error.code === "not_found") {
      notFound();
    }
    throw error;
  });

  const { merchant, wallet, nextReward, rewards, recentTransactions, locations } = detail;
  const pointsBalance = wallet?.pointsBalance ?? 0;

  return (
    <div className="space-y-6">
      <ScreenHeader title={merchant.name} description={merchant.category} backHref="/app" />

      <section className="rounded-3xl border border-border/70 bg-card p-5">
        <div className="flex items-center gap-3">
          <MerchantAvatar
            name={merchant.name}
            logoText={merchant.logoText}
            brandColor={merchant.brandColor}
            size="lg"
          />
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{merchant.tagline}</p>
            <p className="text-xs text-muted-foreground">
              Earn {merchant.pointsPerDollar} pt
              {merchant.pointsPerDollar === 1 ? "" : "s"} per $1
            </p>
          </div>
        </div>

        <p className="mt-6 text-5xl leading-none font-semibold tracking-tight tabular-nums">
          {formatPoints(pointsBalance)}
        </p>
        <p className="mt-2 text-[11px] font-semibold tracking-[0.28em] text-muted-foreground">
          POINTS
        </p>

        {nextReward ? (
          <PointsProgress
            className="mt-5"
            balance={pointsBalance}
            target={nextReward.pointsRequired}
            label={
              pointsBalance >= nextReward.pointsRequired
                ? `${nextReward.name} ready`
                : `${formatPoints(nextReward.pointsRequired - pointsBalance)} points to ${nextReward.name}`
            }
          />
        ) : null}
      </section>

      <section className="space-y-3">
        <SectionHeader title="Available rewards" />
        {rewards.length === 0 ? (
          <EmptyState
            icon={Gift}
            title="No rewards published"
            description={`${merchant.name} has not set up rewards yet. Your points keep adding up.`}
          />
        ) : (
          <ul className="space-y-3">
            {rewards.map((entry) => (
              <li key={entry.reward.id}>
                <RewardCard progress={entry} showMerchant={false} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeader title="Recent transactions" />
        {recentTransactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Nothing here yet"
            description={`Your first visit to ${merchant.name} will show up here.`}
          />
        ) : (
          <ul className="divide-y divide-border/70">
            {recentTransactions.map(({ transaction }) => (
              <TransactionItem
                key={transaction.id}
                title={transaction.description}
                subtitle={transaction.type === "redeem" ? "Reward redeemed" : "Purchase"}
                pointsDelta={transaction.pointsDelta}
                createdAt={transaction.createdAt}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeader title="Locations" />
        <ul className="space-y-3">
          {locations.map((location) => (
            <li
              key={location.id}
              className="rounded-2xl border border-border/70 bg-card p-4"
            >
              <p className="font-medium">{location.name}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin aria-hidden className="size-3.5 shrink-0" />
                <span className="truncate">
                  {location.addressLine1}, {location.city} {location.region}
                </span>
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock aria-hidden className="size-3.5 shrink-0" />
                {location.hours}
                {location.distanceMiles !== null ? (
                  <span className="text-muted-foreground">
                    · {formatDistance(location.distanceMiles)}
                  </span>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
