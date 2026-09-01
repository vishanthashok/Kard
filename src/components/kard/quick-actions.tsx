import Link from "next/link";
import { Compass, Gift, Receipt } from "lucide-react";

interface QuickActionsProps {
  rewardsReadyCount: number;
  nearbyCount: number;
  recentActivityCount: number;
}

/** Three shortcuts sitting directly under the balance card. */
export function QuickActions({
  rewardsReadyCount,
  nearbyCount,
  recentActivityCount,
}: QuickActionsProps) {
  const actions = [
    {
      href: "/app/rewards",
      label: "Available Rewards",
      caption:
        rewardsReadyCount > 0 ? `${rewardsReadyCount} ready` : "Keep earning",
      icon: Gift,
    },
    {
      href: "/app/explore",
      label: "Nearby",
      caption: `${nearbyCount} places`,
      icon: Compass,
    },
    {
      href: "/app/activity",
      label: "Activity",
      caption: `${recentActivityCount} recent`,
      icon: Receipt,
    },
  ] as const;

  return (
    <ul className="grid grid-cols-3 gap-3">
      {actions.map(({ href, label, caption, icon: Icon }) => (
        <li key={href}>
          <Link
            href={href}
            className="flex h-full flex-col justify-between rounded-2xl border border-border/70 bg-card p-3 transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Icon aria-hidden className="size-4 text-muted-foreground" />
            <span className="mt-4 block text-xs leading-tight font-medium">{label}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{caption}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
