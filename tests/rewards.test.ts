import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { seedFake } from "./fakeSupabase";
import { awardPointsForPurchase, getWalletBalance } from "../src/lib/points/service";
import { redeemReward } from "../src/lib/rewards/service";

const asSb = (db: { from: unknown; rpc: unknown }) => db as unknown as SupabaseClient;

async function loadWithPoints(cents: number) {
  const seed = seedFake();
  const sb = asSb(seed.db);
  await awardPointsForPurchase(sb, {
    userId: seed.customer.id as string,
    merchantId: seed.merchant.id as string,
    locationId: null,
    purchaseAmountCents: cents,
    externalReference: `seed-${cents}`,
    createdBy: seed.employee.id as string,
  });
  return { seed, sb };
}

describe("redeeming rewards", () => {
  it("spends points and updates the ledger", async () => {
    const { seed, sb } = await loadWithPoints(10_000); // 100 pts
    const r = await redeemReward(sb, {
      userId: seed.customer.id as string,
      merchantId: seed.merchant.id as string,
      rewardId: seed.reward.id as string,
      redeemedBy: seed.employee.id as string,
    });
    expect(r.points_spent).toBe(50);
    expect(r.new_balance).toBe(50);
    // Confirm both ledger row and redemption row exist.
    const txs = seed.db.table("point_transactions");
    expect(txs.some((t) => t.transaction_type === "redeem" && t.points_delta === -50)).toBe(true);
    const reds = seed.db.table("redemptions");
    expect(reds.length).toBe(1);
  });

  it("rejects when the balance is insufficient", async () => {
    const { seed, sb } = await loadWithPoints(1000); // 10 pts, reward = 50
    await expect(
      redeemReward(sb, {
        userId: seed.customer.id as string,
        merchantId: seed.merchant.id as string,
        rewardId: seed.reward.id as string,
        redeemedBy: seed.employee.id as string,
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("rejects when the reward belongs to a different merchant", async () => {
    const { seed, sb } = await loadWithPoints(10_000);
    // Try to redeem `reward` (Test Coffee) under merchant2 (Other Cafe).
    await expect(
      redeemReward(sb, {
        userId: seed.customer.id as string,
        merchantId: seed.merchant2.id as string,
        rewardId: seed.reward.id as string,
        redeemedBy: seed.employee.id as string,
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("serializes concurrent redemptions and refuses to double-spend", async () => {
    const { seed, sb } = await loadWithPoints(5_000); // 50 pts — exactly one reward
    const results = await Promise.allSettled([
      redeemReward(sb, {
        userId: seed.customer.id as string,
        merchantId: seed.merchant.id as string,
        rewardId: seed.reward.id as string,
        redeemedBy: seed.employee.id as string,
      }),
      redeemReward(sb, {
        userId: seed.customer.id as string,
        merchantId: seed.merchant.id as string,
        rewardId: seed.reward.id as string,
        redeemedBy: seed.employee.id as string,
      }),
    ]);
    const ok = results.filter((r) => r.status === "fulfilled");
    const bad = results.filter((r) => r.status === "rejected");
    expect(ok.length).toBe(1);
    expect(bad.length).toBe(1);

    // Balance must not go negative.
    const walletId = (seed.db.table("wallets").find(
      (w) => w.user_id === seed.customer.id && w.merchant_id === seed.merchant.id,
    )!.id as string);
    expect(await getWalletBalance(sb, walletId)).toBe(0);
  });

  it("handles refunds by adding a negative ledger entry", async () => {
    const seed = seedFake();
    const sb = asSb(seed.db);
    // Earn 20 pts.
    await awardPointsForPurchase(sb, {
      userId: seed.customer.id as string,
      merchantId: seed.merchant.id as string,
      locationId: null,
      purchaseAmountCents: 2000,
      externalReference: "sale-refund",
      createdBy: seed.employee.id as string,
    });
    // Manually insert a refund (negative delta, tx type=refund).
    seed.db.insertRow("point_transactions", {
      wallet_id: seed.db.table("wallets")[0]!.id,
      merchant_id: seed.merchant.id,
      user_id: seed.customer.id,
      location_id: null,
      transaction_type: "refund",
      points_delta: -5,
      metadata: { reason: "partial return" },
    });
    const walletId = seed.db.table("wallets")[0]!.id as string;
    expect(await getWalletBalance(sb, walletId)).toBe(15);
  });
});
