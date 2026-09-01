import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Period-over-period change; omit when there is nothing to compare to. */
  deltaPercent?: number;
  deltaLabel?: string;
  className?: string;
}

/** Single analytics tile on the merchant dashboard. */
export function StatCard({
  label,
  value,
  icon: Icon,
  deltaPercent,
  deltaLabel = "vs. yesterday",
  className,
}: StatCardProps) {
  const hasDelta = typeof deltaPercent === "number";
  const isUp = (deltaPercent ?? 0) >= 0;
  const DeltaIcon = isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <div className={cn("rounded-2xl border border-border/70 bg-card p-5", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon aria-hidden className="size-4 text-muted-foreground" />
      </div>

      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>

      {hasDelta ? (
        <p className="mt-2 flex items-center gap-1 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              isUp ? "text-emerald-600" : "text-red-600",
            )}
          >
            <DeltaIcon aria-hidden className="size-3" />
            {formatPercent(deltaPercent ?? 0)}
          </span>
          <span className="text-muted-foreground">{deltaLabel}</span>
        </p>
      ) : null}
    </div>
  );
}
