"use client";

import { Receipt, UserRound } from "lucide-react";

import { EmptyState } from "@/components/kard/empty-state";
import { ErrorState } from "@/components/kard/error-state";
import { PersonAvatar } from "@/components/kard/person-avatar";
import { RowListSkeleton } from "@/components/kard/skeletons";
import { TransactionItem } from "@/components/kard/transaction-item";
import type { MerchantCustomerDetail } from "@/lib/api-types";
import { formatDayAndTime, formatPoints, formatRelativeDay } from "@/lib/format";

interface CustomerDetailPanelProps {
  detail: MerchantCustomerDetail | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

/** Read-only profile for a single merchant customer. */
export function CustomerDetailPanel({
  detail,
  isLoading,
  error,
  onRetry,
}: CustomerDetailPanelProps) {
  if (error) {
    return <ErrorState description={error} onRetry={onRetry} />;
  }

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" aria-busy="true" className="space-y-4">
        <span className="sr-only">Loading customer</span>
        <RowListSkeleton rows={4} />
      </div>
    );
  }

  if (!detail) {
    return (
      <EmptyState
        icon={UserRound}
        title="No customer selected"
        description="Pick a customer to see their balance, visits and recent activity."
      />
    );
  }

  const { customer, recentTransactions, redemptions } = detail;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <PersonAvatar name={customer.displayName} className="size-12 text-sm" />
        <div className="min-w-0">
          <p className="truncate font-medium">{customer.displayName}</p>
          <p className="text-sm text-muted-foreground">
            Last visit {formatRelativeDay(customer.lastVisitAt)}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <Stat label="Balance" value={`${formatPoints(customer.pointsBalance)} pts`} />
        <Stat label="Visits" value={formatPoints(customer.visitCount)} />
        <Stat label="Lifetime points" value={formatPoints(customer.lifetimePoints)} />
        <Stat label="Rewards redeemed" value={formatPoints(customer.rewardsRedeemed)} />
      </dl>

      <section>
        <h3 className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Recent transactions
        </h3>
        {recentTransactions.length === 0 ? (
          <EmptyState
            className="mt-3"
            icon={Receipt}
            title="No transactions"
            description="This customer has not earned points with you yet."
          />
        ) : (
          <ul className="mt-1 divide-y divide-border/70">
            {recentTransactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                title={transaction.description}
                subtitle={transaction.type === "redeem" ? "Reward redeemed" : "Purchase"}
                pointsDelta={transaction.pointsDelta}
                createdAt={transaction.createdAt}
                timestampLabel={formatDayAndTime(transaction.createdAt)}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Rewards redeemed
        </h3>
        {redemptions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nothing redeemed yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {redemptions.map((redemption) => (
              <li
                key={redemption.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-muted-foreground">
                  {formatRelativeDay(redemption.redeemedAt)}
                </span>
                <span className="font-medium tabular-nums">
                  −{formatPoints(redemption.pointsSpent)} pts
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 px-3 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium tabular-nums">{value}</dd>
    </div>
  );
}
