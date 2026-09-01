import { formatPoints } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PointsProgressProps {
  balance: number;
  target: number;
  /** Renders "82 / 100" above the bar. */
  showValues?: boolean;
  label?: string;
  tone?: "default" | "inverted";
  className?: string;
}

/** Horizontal progress toward a reward threshold. */
export function PointsProgress({
  balance,
  target,
  showValues = true,
  label,
  tone = "default",
  className,
}: PointsProgressProps) {
  const safeTarget = Math.max(target, 1);
  const percent = Math.max(0, Math.min(100, Math.round((balance / safeTarget) * 100)));
  const remaining = Math.max(0, target - balance);

  return (
    <div className={cn("space-y-1.5", className)}>
      {(showValues || label) && (
        <div className="flex items-baseline justify-between gap-3 text-xs">
          <span
            className={cn(
              "font-medium",
              tone === "inverted" ? "text-white/70" : "text-muted-foreground",
            )}
          >
            {label ?? (remaining === 0 ? "Ready to redeem" : `${remaining} points away`)}
          </span>
          {showValues ? (
            <span
              className={cn(
                "tabular-nums",
                tone === "inverted" ? "text-white/70" : "text-muted-foreground",
              )}
            >
              {formatPoints(balance)} / {formatPoints(target)}
            </span>
          ) : null}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={Math.min(balance, target)}
        aria-label={label ?? `${balance} of ${target} points`}
        className={cn(
          "h-1.5 w-full overflow-hidden rounded-full",
          tone === "inverted" ? "bg-white/20" : "bg-muted",
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300",
            tone === "inverted" ? "bg-white" : "bg-foreground",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
