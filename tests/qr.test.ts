import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { seedFake } from "./fakeSupabase";
import {
  generateRawToken,
  hashToken,
  issueQrToken,
  resolveQrToken,
  revokeQrToken,
} from "../src/lib/qr/tokens";

const asSb = (db: { from: unknown; rpc: unknown }) => db as unknown as SupabaseClient;

describe("QR tokens", () => {
  it("generateRawToken returns unique high-entropy strings", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const t = generateRawToken();
      expect(t.length).toBeGreaterThan(20);
      expect(seen.has(t)).toBe(false);
      seen.add(t);
    }
  });

  it("hashToken is deterministic and secret-dependent", () => {
    const a = hashToken("abc");
    const b = hashToken("abc");
    const c = hashToken("abcd");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a.length).toBe(64); // sha256 hex
  });

  it("issued token resolves to the same user", async () => {
    const { db, customer } = seedFake();
    const sb = asSb(db);
    const issued = await issueQrToken(sb, customer.id as string, { appUrl: "http://x" });
    const { user_id } = await resolveQrToken(sb, issued.token);
    expect(user_id).toBe(customer.id);
    expect(issued.url.endsWith(`/c/${issued.token}`)).toBe(true);
  });

  it("rejects an invalid token", async () => {
    const { db } = seedFake();
    await expect(resolveQrToken(asSb(db), "not-a-real-token")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("rejects an expired token", async () => {
    const { db, customer } = seedFake();
    const sb = asSb(db);
    const issued = await issueQrToken(sb, customer.id as string, { appUrl: "http://x" });
    // Rewind expiry.
    const row = db.table("customer_qr_tokens").find((r) => r.token_hash === issued.hash)!;
    row.expires_at = new Date(Date.now() - 1000).toISOString();
    await expect(resolveQrToken(sb, issued.token)).rejects.toMatchObject({ status: 400 });
  });

  it("rejects a revoked token", async () => {
    const { db, customer } = seedFake();
    const sb = asSb(db);
    const issued = await issueQrToken(sb, customer.id as string, { appUrl: "http://x" });
    await revokeQrToken(sb, issued.hash);
    await expect(resolveQrToken(sb, issued.token)).rejects.toMatchObject({ status: 400 });
  });
});
