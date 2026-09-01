// Merchant dashboard analytics. Straight aggregate queries; the numbers
// come from the ledger, so they are always internally consistent.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "../db/types";

export interface MerchantDashboard {
  total_customers: number;
  total_transactions: number;
  points_issued: number;
  points_redeemed: number;
  repeat_customers: number;
}

export async function merchantDashboard(
  sb: SupabaseClient,
  merchantId: UUID,
): Promise<MerchantDashboard> {
  const { data: txs, error } = await sb
    .from("point_transactions")
    .select("user_id, points_delta, transaction_type")
    .eq("merchant_id", merchantId);
  if (error) throw error;

  const rows = (txs ?? []) as Array<{
    user_id: string;
    points_delta: number;
    transaction_type: string;
  }>;

  const perUser = new Map<string, number>();
  let points_issued = 0;
  let points_redeemed = 0;

  for (const r of rows) {
    perUser.set(r.user_id, (perUser.get(r.user_id) ?? 0) + 1);
    if (r.points_delta > 0) points_issued += r.points_delta;
    if (r.transaction_type === "redeem" && r.points_delta < 0) {
      points_redeemed += Math.abs(r.points_delta);
    }
  }

  let repeat_customers = 0;
  for (const count of perUser.values()) {
    if (count > 1) repeat_customers += 1;
  }

  return {
    total_customers: perUser.size,
    total_transactions: rows.length,
    points_issued,
    points_redeemed,
    repeat_customers,
  };
}
