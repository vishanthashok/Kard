import type { ReactNode } from "react";
import { Check, Lock } from "lucide-react";

import { MerchantAvatar } from "@/components/kard/merchant-avatar";
import { PointsProgress } from "@/components/kard/points-progress";
import { formatPoints } from "@/lib/format";
import type { RewardProgress } from "@/lib/api-types";
import { cn } from "@/lib/utils";

interface RewardCardProps {
  progress: RewardProgress;
  /** Hide the merchant row when the card already sits under a merchant header. */
  showMerchant?: boolean;
  /** Overrides the balance caption, e.g. "Customer has 82 points". */
  balanceLabel?: string;
  /** Redeem button or similar, rendered at the bottom of the card. */
  action?: ReactNode;
  className?: string;
}

export function RewardCard({
  progress,
  showMerchant = true,
  balanceLabel,
  action,
  className,
}: RewardCardProps) {
  const { reward, merchant, pointsBalance, pointsRemaining, isUnlocked } = progress;

  return (
    <article
      className={cn(
        "rounded-2xl border border-border/70 bg-card p-4",
        isUnlocked && "border-foreground/20",
        className,
      )}
    >
      {showMerchant ? (
        <div className="mb-3 flex items-center gap-2">
          <MerchantAvatar
            name={merchant.name}
            logoText={merchant.logoText}
            brandColor={merchant.brandColor}
            size="sm"
          />
          <span className="truncate text-sm text-muted-foreground">{merchant.name}</span>
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium">{reward.name}</h3>
          <p className="text-sm text-muted-foreground">
            {formatPoints(reward.pointsRequired)} points
          </p>
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
            isUnlocked
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground",
          )}
        >
          {isUnlocked ? (
            <>
              <Check aria-hidden className="size-3" />
              Ready to redeem
            </>
          ) : (
            <>
              <Lock aria-hidden className="size-3" />
              {formatPoints(pointsRemaining)} away
            </>
          )}
        </span>
      </div>

      <PointsProgress
        className="mt-4"
        balance={pointsBalance}
        target={reward.pointsRequired}
        label={
          balanceLabel ??
          (isUnlocked ? "Ready to redeem" : `${formatPoints(pointsRemaining)} points away`)
        }
      />

      {action ? <div className="mt-4">{action}</div> : null}
    </article>
  );
}
