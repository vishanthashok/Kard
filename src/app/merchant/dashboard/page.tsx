import type { Metadata } from "next";
import Link from "next/link";
import { Coins, Gift, Receipt, Users } from "lucide-react";

import { CustomerRow } from "@/components/kard/customer-row";
import { EmptyState } from "@/components/kard/empty-state";
import { Panel } from "@/components/kard/panel";
import { PersonAvatar } from "@/components/kard/person-avatar";
import { StatCard } from "@/components/kard/stat-card";
import { TransactionItem } from "@/components/kard/transaction-item";
import { Button } from "@/components/ui/button";
import { getMerchantDashboard } from "@/lib/api-client";
import type { DashboardPeriod } from "@/lib/api-types";
import { formatDayAndTime, formatPoints } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const periods = [
  { value: "today", label: "Today", href: "/merchant/dashboard", delta: "vs. yesterday" },
  {
    value: "week",
    label: "This week",
    href: "/merchant/dashboard?period=week",
    delta: "vs. last week",
  },
  {
    value: "month",
    label: "This month",
    href: "/merchant/dashboard?period=month",
    delta: "vs. last month",
  },
] as const;

function toPeriod(value: string | string[] | undefined): DashboardPeriod {
  return value === "week" || value === "month" ? value : "today";
}

interface MerchantDashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MerchantDashboardPage({
  searchParams,
}: MerchantDashboardPageProps) {
  const period = toPeriod((await searchParams).period);
  const dashboard = await getMerchantDashboard(undefined, period);
  const { merchant, stats, recentCustomers, recentTransactions, popularRewards } =
    dashboard;
  const deltaLabel =
    periods.find((entry) => entry.value === period)?.delta ?? "vs. previous period";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{merchant.name}</p>
        </div>

        <nav aria-label="Dashboard period" className="flex rounded-xl bg-muted p-1">
          {periods.map((entry) => (
            <Link
              key={entry.value}
              href={entry.href}
              aria-current={entry.value === period ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                entry.value === period
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {entry.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Customers"
          value={formatPoints(stats.customers)}
          icon={Users}
          deltaPercent={stats.customersDeltaPercent}
          deltaLabel={deltaLabel}
        />
        <StatCard
          label="Transactions"
          value={formatPoints(stats.transactions)}
          icon={Receipt}
          deltaPercent={stats.transactionsDeltaPercent}
          deltaLabel={deltaLabel}
        />
        <StatCard
          label="Points Issued"
          value={formatPoints(stats.pointsIssued)}
          icon={Coins}
          deltaPercent={stats.pointsIssuedDeltaPercent}
          deltaLabel={deltaLabel}
        />
        <StatCard
          label="Rewards Redeemed"
          value={formatPoints(stats.rewardsRedeemed)}
          icon={Gift}
          deltaPercent={stats.rewardsRedeemedDeltaPercent}
          deltaLabel={deltaLabel}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Recent customers"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/merchant/customers">View all</Link>
            </Button>
          }
          contentClassName="px-2 pb-3"
        >
          {recentCustomers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No customers yet"
              description="Scan your first Kard to start building your customer list."
              className="m-3"
            />
          ) : (
            <ul>
              {recentCustomers.map((customer) => (
                <li key={customer.id}>
                  <CustomerRow customer={customer} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Recent transactions"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/merchant/scan">Scan a Kard</Link>
            </Button>
          }
        >
          {recentTransactions.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              description="Points you award today will appear here."
            />
          ) : (
            <ul className="divide-y divide-border/70">
              {recentTransactions.map(({ transaction, customerName }) => (
                <TransactionItem
                  key={transaction.id}
                  title={customerName}
                  subtitle={transaction.description}
                  pointsDelta={transaction.pointsDelta}
                  createdAt={transaction.createdAt}
                  timestampLabel={formatDayAndTime(transaction.createdAt)}
                  leading={<PersonAvatar name={customerName} size="sm" />}
                />
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="Popular rewards"
        description="Redemptions across all of your locations."
        action={
          <Button asChild variant="ghost" size="sm">
            <Link href="/merchant/rewards">Manage</Link>
          </Button>
        }
      >
        {popularRewards.length === 0 ? (
          <EmptyState
            icon={Gift}
            title="No redemptions yet"
            description="Create a reward and your customers will start redeeming."
          />
        ) : (
          <ul className="space-y-4">
            {popularRewards.map(({ reward, redemptionCount, sharePercent }) => (
              <li key={reward.id}>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-medium">{reward.name}</p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {formatPoints(redemptionCount)} redeemed
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{ width: `${sharePercent}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                    {sharePercent}%
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatPoints(reward.pointsRequired)} points
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
