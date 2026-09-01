// POST /api/merchant/transactions/earn
//
// Body:
//   { token, location_id?, purchase_amount_cents, external_reference? }
//
// - Server calculates points ($1 = 1 point, floor). Frontend cannot dictate them.
// - external_reference is unique per merchant → the POS can safely retry.

import { cookies } from "next/headers";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { readOnlyCookies, serverActionClient, serviceRoleClient } from "@/lib/db/supabase";
import { forbidden } from "@/lib/http/errors";
import { json } from "@/lib/http/handler";
import { resolveMerchantContext } from "@/lib/merchants/context";
import { awardPointsForPurchase } from "@/lib/points/service";
import { resolveQrToken } from "@/lib/qr/tokens";
import type { NextRequest } from "next/server";

const bodySchema = z.object({
  token: z.string().min(1),
  location_id: z.string().uuid().nullable().optional(),
  purchase_amount_cents: z.number().int().positive(),
  external_reference: z.string().min(1).max(128).nullable().optional(),
});

export async function POST(req: NextRequest) {
  return json(async () => {
    const userId = await requireUser();
    const sb = serverActionClient(readOnlyCookies(await cookies()));
    const membership = await resolveMerchantContext(
      sb,
      userId,
      req.nextUrl.searchParams.get("merchantId"),
    );

    const body = bodySchema.parse(await req.json());
    const service = serviceRoleClient();

    // If a location was provided, it must belong to this merchant.
    if (body.location_id) {
      const { data: loc, error } = await service
        .from("locations")
        .select("merchant_id")
        .eq("id", body.location_id)
        .maybeSingle();
      if (error) throw error;
      if (!loc || (loc as { merchant_id: string }).merchant_id !== membership.merchant_id) {
        throw forbidden("Location does not belong to this merchant");
      }
    }

    const { user_id: customerId } = await resolveQrToken(service, body.token);
    const result = await awardPointsForPurchase(service, {
      userId: customerId,
      merchantId: membership.merchant_id,
      locationId: body.location_id ?? null,
      purchaseAmountCents: body.purchase_amount_cents,
      externalReference: body.external_reference ?? null,
      createdBy: userId,
    });

    return {
      transaction_id: result.transaction.id,
      points_earned: result.points_earned,
      new_balance: result.new_balance,
      wallet_id: result.wallet.id,
    };
  });
}
