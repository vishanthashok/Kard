// POST /api/merchant/rewards/redeem
//
// Body: { token, reward_id, location_id? }
//
// Atomic: the DB function locks the wallet, re-checks the ledger balance,
// and inserts both the negative ledger entry and the redemption row in one
// transaction. Two concurrent calls can never spend the same points twice.

import { cookies } from "next/headers";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { readOnlyCookies, serverActionClient, serviceRoleClient } from "@/lib/db/supabase";
import { json } from "@/lib/http/handler";
import { resolveMerchantContext } from "@/lib/merchants/context";
import { redeemReward } from "@/lib/rewards/service";
import { resolveQrToken } from "@/lib/qr/tokens";
import type { NextRequest } from "next/server";

const bodySchema = z.object({
  token: z.string().min(1),
  reward_id: z.string().uuid(),
  location_id: z.string().uuid().nullable().optional(),
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
    const { user_id: customerId } = await resolveQrToken(service, body.token);

    const result = await redeemReward(service, {
      userId: customerId,
      merchantId: membership.merchant_id,
      rewardId: body.reward_id,
      redeemedBy: userId,
      locationId: body.location_id ?? null,
    });

    return {
      reward: result.reward,
      points_spent: result.points_spent,
      new_balance: result.new_balance,
      redemption_id: result.redemption_id,
      transaction_id: result.transaction_id,
    };
  });
}
