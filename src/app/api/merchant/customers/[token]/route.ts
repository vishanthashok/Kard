// GET /api/merchant/customers/[token]?merchantId=...
//
// Merchant staff scan a customer's QR, then hit this endpoint to resolve
// the token to a customer profile + wallet balance at their merchant.
// The raw user id never appears in the QR — only inside our DB.

import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth/session";
import { readOnlyCookies, serverActionClient, serviceRoleClient } from "@/lib/db/supabase";
import { json } from "@/lib/http/handler";
import { resolveMerchantContext } from "@/lib/merchants/context";
import { getOrCreateWallet, getWalletBalance } from "@/lib/points/service";
import { resolveQrToken } from "@/lib/qr/tokens";
import { notFound } from "@/lib/http/errors";
import type { NextRequest } from "next/server";
import type { ProfileRow } from "@/lib/db/types";

interface Ctx {
  params: Promise<{ token: string }>;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  return json(async () => {
    const userId = await requireUser();
    const sb = serverActionClient(readOnlyCookies(await cookies()));
    const membership = await resolveMerchantContext(
      sb,
      userId,
      req.nextUrl.searchParams.get("merchantId"),
    );

    const service = serviceRoleClient();
    const { token } = await ctx.params;
    const { user_id } = await resolveQrToken(service, token);

    const { data: profile, error } = await service
      .from("profiles")
      .select("id, email, first_name, last_name")
      .eq("id", user_id)
      .maybeSingle();
    if (error) throw error;
    if (!profile) throw notFound("Customer profile missing");

    const wallet = await getOrCreateWallet(service, user_id, membership.merchant_id);
    const balance = await getWalletBalance(service, wallet.id);

    return {
      customer: profile as Pick<ProfileRow, "id" | "email" | "first_name" | "last_name">,
      wallet: { ...wallet, balance },
      merchant_id: membership.merchant_id,
    };
  });
}
