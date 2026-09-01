import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";

import { MerchantAvatar } from "@/components/kard/merchant-avatar";
import { formatDistance, formatPoints } from "@/lib/format";
import type { NearbyMerchant } from "@/lib/api-types";
import { cn } from "@/lib/utils";

interface NearbyMerchantCardProps {
  entry: NearbyMerchant;
  className?: string;
}

/** One participating business in the explore list. */
export function NearbyMerchantCard({ entry, className }: NearbyMerchantCardProps) {
  const { merchant, location, distanceMiles, featuredReward, hasWallet } = entry;

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
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{merchant.name}</p>
            {hasWallet ? (
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Your Kard
              </span>
            ) : null}
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {merchant.category} · {formatDistance(distanceMiles)}
          </p>
        </div>

        <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Earning rate</dt>
          <dd className="mt-0.5 font-medium">
            {formatPoints(merchant.pointsPerDollar)} pt
            {merchant.pointsPerDollar === 1 ? "" : "s"} / $1
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">Reward</dt>
          <dd className="mt-0.5 truncate font-medium">
            {featuredReward
              ? `${featuredReward.name} · ${formatPoints(featuredReward.pointsRequired)} pts`
              : "Coming soon"}
          </dd>
        </div>
      </dl>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin aria-hidden className="size-3.5" />
        <span className="truncate">
          {location.addressLine1}, {location.city}
        </span>
      </p>
    </Link>
  );
}
