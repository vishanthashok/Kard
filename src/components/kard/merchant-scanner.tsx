"use client";

import { useState } from "react";
import { Check, Loader2, QrCode, RotateCw } from "lucide-react";
import { toast } from "sonner";

import { AwardPointsForm } from "@/components/kard/award-points-form";
import { EmptyState } from "@/components/kard/empty-state";
import { Panel } from "@/components/kard/panel";
import { PersonAvatar } from "@/components/kard/person-avatar";
import { RedeemRewardDialog } from "@/components/kard/redeem-reward-dialog";
import { RewardCard } from "@/components/kard/reward-card";
import { ScannerFrame } from "@/components/kard/scanner-frame";
import { TransactionItem } from "@/components/kard/transaction-item";
import { Button } from "@/components/ui/button";
import { awardPoints, getCustomerByQR, redeemReward } from "@/lib/api-client";
import {
  KardApiError,
  type PointTransaction,
  type Reward,
  type ScannedCustomer,
} from "@/lib/api-types";
import { formatDayAndTime, formatPoints } from "@/lib/format";

interface MerchantScannerProps {
  merchantId: string;
  locationId: string | null;
  /**
   * Value the manual test button feeds into the scan flow, standing in for a
   * real camera read. See `lib/mock-qr.ts`.
   */
  testQrValue: string;
}

interface ScanSession {
  customer: ScannedCustomer;
  /** Always the balance returned by the API, never a locally computed one. */
  pointsBalance: number;
  activity: PointTransaction[];
  lastAward: { points: number; balance: number } | null;
}

function messageFor(error: unknown): string {
  return error instanceof KardApiError
    ? error.message
    : "Something went wrong. Try scanning again.";
}

/**
 * Merchant scanning flow: read a customer Kard, award points for a purchase and
 * redeem rewards.
 *
 * QR capture and verification are mocked — the manual test button replaces the
 * camera, and every point value rendered after a write comes from the API
 * response rather than from local math.
 */
export function MerchantScanner({
  merchantId,
  locationId,
  testQrValue,
}: MerchantScannerProps) {
  const [session, setSession] = useState<ScanSession | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isAwarding, setIsAwarding] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  async function handleSimulateScan() {
    setIsScanning(true);
    setScanError(null);
    try {
      const customer = await getCustomerByQR(merchantId, testQrValue);
      setSession({
        customer,
        pointsBalance: customer.wallet.pointsBalance,
        activity: customer.recentTransactions,
        lastAward: null,
      });
    } catch (error) {
      setScanError(messageFor(error));
    } finally {
      setIsScanning(false);
    }
  }

  async function handleAwardPoints(amountCents: number) {
    if (!session) return;
    setIsAwarding(true);
    try {
      const result = await awardPoints({
        merchantId,
        locationId,
        customerQrToken: testQrValue,
        amountCents,
        // Unique per attempt so a retry cannot double-credit the customer.
        externalReference: crypto.randomUUID(),
      });

      setSession((current) =>
        current
          ? {
              ...current,
              pointsBalance: result.newBalance,
              activity: [result.transaction, ...current.activity].slice(0, 6),
              lastAward: { points: result.pointsAwarded, balance: result.newBalance },
            }
          : current,
      );
      toast.success(`Awarded ${formatPoints(result.pointsAwarded)} points`);
    } catch (error) {
      toast.error(messageFor(error));
    } finally {
      setIsAwarding(false);
    }
  }

  async function handleRedeem(reward: Reward) {
    if (!session) return;
    try {
      const result = await redeemReward({
        merchantId,
        rewardId: reward.id,
        customerQrToken: testQrValue,
        locationId,
      });

      // Display-only ledger row; the backend will return the real transaction.
      const redemptionRow: PointTransaction = {
        id: result.redemption.id,
        walletId: result.redemption.walletId,
        merchantId: result.redemption.merchantId,
        locationId,
        type: "redeem",
        pointsDelta: -result.pointsSpent,
        amountCents: null,
        description: reward.name,
        createdAt: result.redemption.redeemedAt,
      };

      setSession((current) =>
        current
          ? {
              ...current,
              pointsBalance: result.newBalance,
              activity: [redemptionRow, ...current.activity].slice(0, 6),
              lastAward: null,
            }
          : current,
      );
      toast.success(`${reward.name} redeemed`);
    } catch (error) {
      toast.error(messageFor(error));
    }
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <ScannerFrame>
          {isScanning ? (
            <>
              <Loader2 aria-hidden className="size-6 animate-spin text-neutral-300" />
              <p className="text-sm font-medium text-neutral-200">Reading Kard…</p>
            </>
          ) : undefined}
        </ScannerFrame>

        {scanError ? (
          <p role="alert" className="text-center text-sm text-destructive">
            {scanError}
          </p>
        ) : null}

        <Button
          type="button"
          size="lg"
          className="h-14 w-full text-base"
          onClick={handleSimulateScan}
          disabled={isScanning}
        >
          <QrCode aria-hidden />
          Simulate customer scan
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Test button only — production scanning is verified by the Kard backend.
        </p>
      </div>
    );
  }

  const { customer, pointsBalance, activity, lastAward } = session;
  const rewards = customer.rewards.map((entry) => ({
    ...entry,
    pointsBalance,
    pointsRemaining: Math.max(0, entry.reward.pointsRequired - pointsBalance),
    isUnlocked: pointsBalance >= entry.reward.pointsRequired,
  }));

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border/70 bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <PersonAvatar name={customer.user.fullName} className="size-12 text-sm" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold tracking-tight">
                {customer.user.firstName}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {customer.merchant.name}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSession(null);
              setScanError(null);
            }}
          >
            <RotateCw aria-hidden />
            New scan
          </Button>
        </div>

        <p className="mt-6 text-5xl leading-none font-semibold tracking-tight tabular-nums">
          {formatPoints(pointsBalance)}
        </p>
        <p className="mt-2 text-[11px] font-semibold tracking-[0.28em] text-muted-foreground">
          POINTS
        </p>

        {lastAward ? (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <Check aria-hidden className="size-4" />
            Awarded {formatPoints(lastAward.points)} points · new balance{" "}
            {formatPoints(lastAward.balance)}
          </p>
        ) : null}
      </section>

      <Panel title="Award points">
        <AwardPointsForm
          pointsPerDollar={customer.merchant.pointsPerDollar}
          isSubmitting={isAwarding}
          onSubmit={handleAwardPoints}
        />
      </Panel>

      <Panel title="Available rewards">
        {rewards.length === 0 ? (
          <EmptyState
            icon={QrCode}
            title="No active rewards"
            description="Create a reward and it will be redeemable here."
          />
        ) : (
          <ul className="space-y-3">
            {rewards.map((entry) => (
              <li key={entry.reward.id}>
                <RewardCard
                  progress={entry}
                  showMerchant={false}
                  balanceLabel={`Customer has ${formatPoints(pointsBalance)} points`}
                  action={
                    <RedeemRewardDialog
                      reward={entry.reward}
                      customerName={customer.user.fullName}
                      pointsBalance={pointsBalance}
                      disabled={!entry.isUnlocked}
                      onConfirm={handleRedeem}
                    />
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Recent activity">
        {activity.length === 0 ? (
          <EmptyState
            icon={QrCode}
            title="No activity yet"
            description="This is the customer's first visit with you."
          />
        ) : (
          <ul className="divide-y divide-border/70">
            {activity.map((transaction) => (
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
      </Panel>
    </div>
  );
}
