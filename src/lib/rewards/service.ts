// Rewards & redemption service. The redeem path calls the redeem_reward
// SQL function which locks the wallet, re-checks the balance from the
// ledger, and inserts BOTH the negative ledger row and the redemption row
// in a single transaction.

import type { SupabaseClient } from "@supabase/supabase-js";
import { badRequest, conflict, forbidden, notFound } from "../http/errors";
import { getOrCreateWallet, getWalletBalance } from "../points/service";
import type { RewardRow, UUID } from "../db/types";

export async function listRewardsForMerchant(
  sb: SupabaseClient,
  merchantId: UUID,
  opts: { activeOnly?: boolean } = {},
) {
  let q = sb.from("rewards").select("*").eq("merchant_id", merchantId);
  if (opts.activeOnly !== false) q = q.eq("is_active", true);
  const { data, error } = await q.order("points_required");
  if (error) throw error;
  return (data ?? []) as RewardRow[];
}

export async function listAllActiveRewards(sb: SupabaseClient) {
  const { data, error } = await sb
    .from("rewards")
    .select("*, merchant:merchants(id, name, slug)")
    .eq("is_active", true)
    .order("points_required");
  if (error) throw error;
  return data ?? [];
}

export async function createReward(
  sb: SupabaseClient,
  merchantId: UUID,
  input: {
    name: string;
    description?: string | null;
    points_required: number;
    is_active?: boolean;
  },
) {
  const { data, error } = await sb
    .from("rewards")
    .insert({
      merchant_id: merchantId,
      name: input.name,
      description: input.description ?? null,
      points_required: input.points_required,
      is_active: input.is_active ?? true,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as RewardRow;
}

export async function updateReward(
  sb: SupabaseClient,
  merchantId: UUID,
  rewardId: UUID,
  patch: Partial<Pick<RewardRow, "name" | "description" | "points_required" | "is_active">>,
) {
  // Confirm the reward belongs to the merchant before we touch it.
  const { data: existing, error: readErr } = await sb
    .from("rewards")
    .select("*")
    .eq("id", rewardId)
    .maybeSingle();
  if (readErr) throw readErr;
  if (!existing) throw notFound("Reward not found");
  if ((existing as RewardRow).merchant_id !== merchantId) {
    throw forbidden("Reward belongs to a different merchant");
  }

  const { data, error } = await sb
    .from("rewards")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", rewardId)
    .select("*")
    .single();
  if (error) throw error;
  return data as RewardRow;
}

export interface RedeemResult {
  redemption_id: UUID;
  transaction_id: UUID;
  points_spent: number;
  new_balance: number;
  reward: RewardRow;
}

export async function redeemReward(
  sb: SupabaseClient,
  args: {
    userId: UUID;
    merchantId: UUID;
    rewardId: UUID;
    redeemedBy: UUID;
    locationId?: UUID | null;
  },
): Promise<RedeemResult> {
  // Fetch reward first for the response payload.
  const { data: reward, error: rerr } = await sb
    .from("rewards")
    .select("*")
    .eq("id", args.rewardId)
    .maybeSingle();
  if (rerr) throw rerr;
  if (!reward) throw notFound("Reward not found");
  if ((reward as RewardRow).merchant_id !== args.merchantId) {
    throw forbidden("Reward belongs to a different merchant");
  }

  const wallet = await getOrCreateWallet(sb, args.userId, args.merchantId);

  const { data, error } = await sb.rpc("redeem_reward", {
    p_wallet_id: wallet.id,
    p_reward_id: args.rewardId,
    p_merchant_id: args.merchantId,
    p_user_id: args.userId,
    p_redeemed_by: args.redeemedBy,
    p_location_id: args.locationId ?? null,
  });

  if (error) {
    if (error.code === "KD003") throw conflict("Insufficient balance");
    if (error.code === "KD004") throw badRequest("Reward is not active");
    if (error.code === "KD001") throw notFound(error.message);
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    // Belt and braces — the RPC always returns exactly one row on success.
    const new_balance = await getWalletBalance(sb, wallet.id);
    throw new Error(`redeem_reward returned no rows (balance=${new_balance})`);
  }

  return {
    redemption_id: row.redemption_id as UUID,
    transaction_id: row.transaction_id as UUID,
    points_spent: Number(row.points_spent),
    new_balance: Number(row.new_balance),
    reward: reward as RewardRow,
  };
}
