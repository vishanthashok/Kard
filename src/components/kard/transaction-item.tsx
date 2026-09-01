import type { ReactNode } from "react";

import { formatRelativeDay, formatSignedPoints } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TransactionItemProps {
  title: string;
  /** "$8.75 purchase", "Free Drink", ... */
  subtitle?: string;
  pointsDelta: number;
  createdAt: string;
  /** Merchant avatar, customer initials or any leading visual. */
  leading?: ReactNode;
  /** Replaces the relative day stamp under the points value. */
  timestampLabel?: string;
  className?: string;
}

/** One row in any transaction list, customer or merchant side. */
export function TransactionItem({
  title,
  subtitle,
  pointsDelta,
  createdAt,
  leading,
  timestampLabel,
  className,
}: TransactionItemProps) {
  const isPositive = pointsDelta >= 0;

  return (
    <li className={cn("flex items-center gap-3 py-3", className)}>
      {leading}

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{title}</p>
        {subtitle ? (
          <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      <div className="text-right">
        <p
          className={cn(
            "font-medium tabular-nums",
            isPositive ? "text-emerald-600" : "text-foreground",
          )}
        >
          {formatSignedPoints(pointsDelta)}
          <span className="ml-1 text-xs font-normal text-muted-foreground">pts</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {timestampLabel ?? formatRelativeDay(createdAt)}
        </p>
      </div>
    </li>
  );
}
