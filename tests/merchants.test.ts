import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { seedFake } from "./fakeSupabase";
import {
  requireMerchantAdmin,
  requireMerchantMember,
} from "../src/lib/merchants/service";

const asSb = (db: { from: unknown; rpc: unknown }) => db as unknown as SupabaseClient;

describe("merchant authorization", () => {
  it("blocks a non-member from acting as merchant staff", async () => {
    const { db, merchant, customer } = seedFake();
    await expect(
      requireMerchantMember(asSb(db), customer.id as string, merchant.id as string),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("blocks an employee from admin-only actions", async () => {
    const { db, merchant, employee } = seedFake();
    await expect(
      requireMerchantAdmin(asSb(db), employee.id as string, merchant.id as string),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("allows an owner or manager", async () => {
    const { db, merchant, employee } = seedFake();
    // Promote our employee to owner for this test.
    const mu = db.table("merchant_users").find((r) => r.user_id === employee.id)!;
    mu.role = "owner";
    await expect(
      requireMerchantAdmin(asSb(db), employee.id as string, merchant.id as string),
    ).resolves.toMatchObject({ role: "owner" });
  });
});
