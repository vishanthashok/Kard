// Secure QR tokens.
//
// A customer's QR code contains an opaque random string. We store only the
// HMAC-SHA256 hash of that string. When a merchant scans the code the
// backend looks up the hash, resolves it to a user, and returns the
// customer profile — the raw user id never appears in the QR payload.
//
// Tokens have a short TTL (default 24h) and can be revoked. New tokens can be
// issued whenever the customer opens their pass; old tokens keep working
// until they expire or are revoked, so background rotation is safe.

import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "../env";
import type { CustomerQrTokenRow, UUID } from "../db/types";
import { badRequest, notFound } from "../http/errors";

const DEFAULT_TTL_HOURS = 24;
const TOKEN_BYTES = 32; // 256 bits

export interface IssuedToken {
  token: string;
  hash: string;
  expires_at: string;
  url: string;
}

export function hashToken(raw: string): string {
  const { QR_TOKEN_SECRET } = serverEnv();
  return crypto
    .createHmac("sha256", QR_TOKEN_SECRET)
    .update(raw)
    .digest("hex");
}

export function generateRawToken(): string {
  // URL-safe base64 without padding.
  return crypto
    .randomBytes(TOKEN_BYTES)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function issueQrToken(
  sb: SupabaseClient,
  userId: UUID,
  opts: { ttlHours?: number; appUrl: string } = { appUrl: "" },
): Promise<IssuedToken> {
  const ttl = opts.ttlHours ?? DEFAULT_TTL_HOURS;
  if (ttl <= 0 || ttl > 24 * 30) throw badRequest("TTL out of range");

  const token = generateRawToken();
  const token_hash = hashToken(token);
  const expires_at = new Date(Date.now() + ttl * 3600_000).toISOString();

  const { error } = await sb.from("customer_qr_tokens").insert({
    user_id: userId,
    token_hash,
    expires_at,
  });
  if (error) throw error;

  const url = opts.appUrl ? `${opts.appUrl.replace(/\/$/, "")}/c/${token}` : `/c/${token}`;
  return { token, hash: token_hash, expires_at, url };
}

export interface ResolvedCustomer {
  user_id: UUID;
  token_row: CustomerQrTokenRow;
}

export async function resolveQrToken(
  sb: SupabaseClient,
  rawToken: string,
): Promise<ResolvedCustomer> {
  if (!rawToken || typeof rawToken !== "string") {
    throw badRequest("Missing token");
  }
  const token_hash = hashToken(rawToken);
  const { data, error } = await sb
    .from("customer_qr_tokens")
    .select("*")
    .eq("token_hash", token_hash)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound("Unknown QR token");

  const row = data as CustomerQrTokenRow;
  if (row.revoked_at) throw badRequest("Token has been revoked");
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw badRequest("Token has expired");
  }
  return { user_id: row.user_id, token_row: row };
}

export async function revokeQrToken(sb: SupabaseClient, hash: string) {
  const { error } = await sb
    .from("customer_qr_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token_hash", hash);
  if (error) throw error;
}
