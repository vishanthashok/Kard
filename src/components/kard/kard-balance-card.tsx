import { formatPoints } from "@/lib/format";
import { cn } from "@/lib/utils";

interface KardBalanceCardProps {
  totalPoints: number;
  /** Number of merchant Kards the balance is spread across. */
  walletCount: number;
  memberId?: string;
  className?: string;
}

/** The single hero card on the customer home screen. */
export function KardBalanceCard({
  totalPoints,
  walletCount,
  memberId,
  className,
}: KardBalanceCardProps) {
  return (
    <section
      aria-label="Total Kard balance"
      className={cn(
        "rounded-3xl bg-foreground px-6 py-7 text-background shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-semibold tracking-[0.28em] text-background/60">
          KARD
        </span>
        {memberId ? (
          <span className="font-mono text-[11px] tracking-tight text-background/50">
            {memberId}
          </span>
        ) : null}
      </div>

      <p className="mt-6 text-6xl leading-none font-semibold tracking-tight tabular-nums">
        {formatPoints(totalPoints)}
      </p>
      <p className="mt-3 text-[11px] font-semibold tracking-[0.28em] text-background/60">
        POINTS
      </p>

      <p className="mt-6 text-sm text-background/70">
        Across your Kard
        <span className="text-background/40">
          {" · "}
          {walletCount} {walletCount === 1 ? "merchant" : "merchants"}
        </span>
      </p>
    </section>
  );
}
