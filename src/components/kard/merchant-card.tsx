import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { MerchantAvatar } from "@/components/kard/merchant-avatar";
import { PointsProgress } from "@/components/kard/points-progress";
import { formatPoints } from "@/lib/format";
import type { WalletSummary } from "@/lib/api-types";
import { cn } from "@/lib/utils";

interface MerchantCardProps {
  summary: WalletSummary;
  className?: string;
}

/** A single merchant Kard in the customer's wallet list. */
export function MerchantCard({ summary, className }: MerchantCardProps) {
  const { merchant, wallet, nextReward, pointsToNextReward } = summary;
  const isUnlocked = nextReward !== null && pointsToNextReward === 0;

  return (
    <Link
      href={`/app/merchant/${merchant.id}`}
      className={cn(
        "block rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <MerchantAvatar
          name={merchant.name}
          logoText={merchant.logoText}
          brandColor={merchant.brandColor}
        />

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{merchant.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatPoints(wallet.pointsBalance)} points
          </p>
        </div>

        <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      </div>

      {nextReward ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {formatPoints(nextReward.pointsRequired)} points
            </span>{" "}
            = {nextReward.name}
          </p>
          <PointsProgress
            balance={wallet.pointsBalance}
            target={nextReward.pointsRequired}
            label={isUnlocked ? "Ready to redeem" : `${pointsToNextReward} points away`}
          />
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No rewards published yet — points keep adding up.
        </p>
      )}
    </Link>
  );
}
