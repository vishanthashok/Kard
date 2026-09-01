import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { seedFake } from "./fakeSupabase";
import {
  awardPointsForPurchase,
  getWalletBalance,
  pointsForPurchase,
} from "../src/lib/points/service";

// The service layer types against @supabase/supabase-js's SupabaseClient;
// our fake matches the shape but not the type, so we cast at the boundary.
const asSb = (db: { from: unknown; rpc: unknown }) => db as unknown as SupabaseClient;

describe("pointsForPurchase", () => {
  it("gives 1 point per whole dollar, floored", () => {
    expect(pointsForPurchase(875)).toBe(8);
    expect(pointsForPurchase(100)).toBe(1);
    expect(pointsForPurchase(99)).toBe(0);
    expect(pointsForPurchase(0)).toBe(0);
  });

  it("rejects non-integer / negative cents", () => {
    expect(() => pointsForPurchase(-1)).toThrow();
    expect(() => pointsForPurchase(1.5)).toThrow();
  });
});

describe("earning points", () => {
  it("credits the wallet and derives the new balance from the ledger", async () => {
    const { db, merchant, customer, employee, location } = seedFake();
    const sb = asSb(db);

    const result = await awardPointsForPurchase(sb, {
      userId: customer.id as string,
      merchantId: merchant.id as string,
      locationId: location.id as string,
      purchaseAmountCents: 875,
      externalReference: "sale-1",
      createdBy: employee.id as string,
    });

    expect(result.points_earned).toBe(8);
    expect(result.new_balance).toBe(8);
    expect(result.transaction.transaction_type).toBe("earn");
    // Balance is a sum, not a stored field.
    const derived = await getWalletBalance(sb, result.wallet.id as string);
    expect(derived).toBe(8);
  });

  it("rejects a purchase too small to earn a point", async () => {
    const { db, merchant, customer, employee } = seedFake();
    await expect(
      awardPointsForPurchase(asSb(db), {
        userId: customer.id as string,
        merchantId: merchant.id as string,
        locationId: null,
        purchaseAmountCents: 50,
        externalReference: null,
        createdBy: employee.id as string,
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("blocks duplicate external_reference for the same merchant (idempotency guard)", async () => {
    const { db, merchant, customer, employee } = seedFake();
    const sb = asSb(db);
    await awardPointsForPurchase(sb, {
      userId: customer.id as string,
      merchantId: merchant.id as string,
      locationId: null,
      purchaseAmountCents: 1000,
      externalReference: "pos-42",
      createdBy: employee.id as string,
    });
    await expect(
      awardPointsForPurchase(sb, {
        userId: customer.id as string,
        merchantId: merchant.id as string,
        locationId: null,
        purchaseAmountCents: 1000,
        externalReference: "pos-42",
        createdBy: employee.id as string,
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("ledger sum is the source of truth across many transactions", async () => {
    const { db, merchant, customer, employee } = seedFake();
    const sb = asSb(db);
    let last = 0;
    for (let i = 0; i < 5; i++) {
      const r = await awardPointsForPurchase(sb, {
        userId: customer.id as string,
        merchantId: merchant.id as string,
        locationId: null,
        purchaseAmountCents: 200,
        externalReference: `s-${i}`,
        createdBy: employee.id as string,
      });
      last = r.new_balance;
    }
    expect(last).toBe(10);
  });
});
