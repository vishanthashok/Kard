// Points service. Never mutates a balance directly — every change goes
// through the ledger (point_transactions) via the RPCs defined in
// migrations/0003_functions.sql, which lock the wallet row for us.

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  PointTransactionRow,
  UUID,
  WalletRow,
} from "../db/types";
import { badRequest, conflict, notFound } from "../http/errors";

// $1 = 1 point. Rounded down so a $8.75 purchase is 8 points.
export function pointsForPurchase(purchaseAmountCents: number): number {
  if (!Number.isInteger(purchaseAmountCents) || purchaseAmountCents < 0) {
    throw badRequest("purchase_amount_cents must be a non-negative integer");
  }
  return Math.floor(purchaseAmountCents / 100);
}

export async function getOrCreateWallet(
  sb: SupabaseClient,
  userId: UUID,
  merchantId: UUID,
): Promise<WalletRow> {
  // Idempotent upsert on the (user_id, merchant_id) unique index.
  const { data, error } = await sb
    .from("wallets")
    .upsert(
      { user_id: userId, merchant_id: merchantId },
      { onConflict: "user_id,merchant_id", ignoreDuplicates: false },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as WalletRow;
}

export async function getWalletBalance(
  sb: SupabaseClient,
  walletId: UUID,
): Promise<number> {
  // The wallet_balance() SQL function is stable and covered by an index.
  const { data, error } = await sb.rpc("wallet_balance", { p_wallet_id: walletId });
  if (error) throw error;
  return Number(data ?? 0);
}

export async function listWalletsForUser(sb: SupabaseClient, userId: UUID) {
  const { data, error } = await sb
    .from("wallets")
    .select("*, merchant:merchants(*)")
    .eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}

export async function listTransactionsForUser(
  sb: SupabaseClient,
  userId: UUID,
  limit = 50,
) {
  const { data, error } = await sb
    .from("point_transactions")
    .select("*, merchant:merchants(id, name, slug)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export interface AwardResult {
  transaction: PointTransactionRow;
  points_earned: number;
  new_balance: number;
  wallet: WalletRow;
}

export async function awardPointsForPurchase(
  sb: SupabaseClient,
  args: {
    userId: UUID;
    merchantId: UUID;
    locationId: UUID | null;
    purchaseAmountCents: number;
    externalReference: string | null;
    createdBy: UUID;
  },
): Promise<AwardResult> {
  const points = pointsForPurchase(args.purchaseAmountCents);
  if (points <= 0) throw badRequest("Purchase too small to earn a point");

  const wallet = await getOrCreateWallet(sb, args.userId, args.merchantId);

  const { data, error } = await sb.rpc("award_points", {
    p_wallet_id: wallet.id,
    p_merchant_id: args.merchantId,
    p_user_id: args.userId,
    p_location_id: args.locationId,
    p_points: points,
    p_purchase_cents: args.purchaseAmountCents,
    p_external_reference: args.externalReference,
    p_created_by: args.createdBy,
    p_metadata: {},
  });

  if (error) {
    // Duplicate external_reference → same POS sent us the same sale twice.
    if (error.code === "23505") {
      throw conflict("Duplicate external_reference for this merchant");
    }
    if (error.code === "KD001") throw notFound(error.message);
    if (error.code === "KD002") throw badRequest(error.message);
    throw error;
  }

  const transaction = data as PointTransactionRow;
  const new_balance = await getWalletBalance(sb, wallet.id);
  return {
    transaction,
    points_earned: points,
    new_balance,
    wallet,
  };
}
