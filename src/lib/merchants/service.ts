// Merchant service. All merchant queries and authorization helpers live here.

import type { SupabaseClient } from "@supabase/supabase-js";
import { forbidden, notFound } from "../http/errors";
import type { MerchantRole, MerchantRow, MerchantUserRow, UUID } from "../db/types";

export async function listActiveMerchants(sb: SupabaseClient) {
  const { data, error } = await sb
    .from("merchants")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return (data ?? []) as MerchantRow[];
}

export async function getMerchant(sb: SupabaseClient, id: UUID) {
  const { data, error } = await sb
    .from("merchants")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound("Merchant not found");
  return data as MerchantRow;
}

export async function getMembership(
  sb: SupabaseClient,
  userId: UUID,
  merchantId: UUID,
): Promise<MerchantUserRow | null> {
  const { data, error } = await sb
    .from("merchant_users")
    .select("*")
    .eq("user_id", userId)
    .eq("merchant_id", merchantId)
    .maybeSingle();
  if (error) throw error;
  return (data as MerchantUserRow | null) ?? null;
}

// Return the caller's memberships (multiple merchants supported).
export async function listMembershipsForUser(sb: SupabaseClient, userId: UUID) {
  const { data, error } = await sb
    .from("merchant_users")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as MerchantUserRow[];
}

// Merchant staff endpoints share this. Require *some* role at the merchant.
export async function requireMerchantMember(
  sb: SupabaseClient,
  userId: UUID,
  merchantId: UUID,
): Promise<MerchantUserRow> {
  const m = await getMembership(sb, userId, merchantId);
  if (!m) throw forbidden("You are not associated with this merchant");
  return m;
}

// Owners and managers only (reward CRUD, analytics writes).
export async function requireMerchantAdmin(
  sb: SupabaseClient,
  userId: UUID,
  merchantId: UUID,
): Promise<MerchantUserRow> {
  const m = await requireMerchantMember(sb, userId, merchantId);
  if (!isAdmin(m.role)) throw forbidden("Requires manager or owner role");
  return m;
}

export function isAdmin(role: MerchantRole): boolean {
  return role === "owner" || role === "manager";
}

// Convenience for endpoints that don't require a specific merchant id in the
// URL — pick the first merchant this user belongs to, or 403.
export async function requireAnyMerchantMembership(
  sb: SupabaseClient,
  userId: UUID,
): Promise<MerchantUserRow> {
  const memberships = await listMembershipsForUser(sb, userId);
  if (memberships.length === 0) {
    throw forbidden("You are not a member of any merchant");
  }
  return memberships[0]!;
}
