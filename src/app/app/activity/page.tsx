import type { Metadata } from "next";
import Link from "next/link";
import { Receipt } from "lucide-react";

import { EmptyState } from "@/components/kard/empty-state";
import { MerchantAvatar } from "@/components/kard/merchant-avatar";
import { ScreenHeader } from "@/components/kard/screen-header";
import { TransactionItem } from "@/components/kard/transaction-item";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getTransactions } from "@/lib/api-client";
import { groupByRelativeDay } from "@/lib/format";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage() {
  const user = await getCurrentUser();
  const transactions = await getTransactions(user.id);
  const groups = groupByRelativeDay(transactions, (entry) => entry.transaction.createdAt);

  return (
    <div className="space-y-6">
      <ScreenHeader title="Activity" description="Every point earned and redeemed." />

      {transactions.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No activity yet"
          description="Your purchases and redemptions will appear here after your first scan."
          action={
            <Button asChild className="h-10 px-4">
              <Link href="/app/scan">Show my Kard</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.label}>
              <h2 className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                {group.label}
              </h2>
              <ul className="mt-1 divide-y divide-border/70">
                {group.items.map(({ transaction, merchant }) => (
                  <TransactionItem
                    key={transaction.id}
                    title={merchant.name}
                    subtitle={transaction.description}
                    pointsDelta={transaction.pointsDelta}
                    createdAt={transaction.createdAt}
                    leading={
                      <MerchantAvatar
                        name={merchant.name}
                        logoText={merchant.logoText}
                        brandColor={merchant.brandColor}
                        size="sm"
                      />
                    }
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
