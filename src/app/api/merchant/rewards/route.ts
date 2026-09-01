// POST /api/merchant/rewards — create a reward. Manager/owner only.

import { cookies } from "next/headers";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { readOnlyCookies, serverActionClient, serviceRoleClient } from "@/lib/db/supabase";
import { forbidden } from "@/lib/http/errors";
import { json } from "@/lib/http/handler";
import { resolveMerchantContext } from "@/lib/merchants/context";
import { createReward } from "@/lib/rewards/service";
import { isAdmin } from "@/lib/merchants/service";
import type { NextRequest } from "next/server";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  points_required: z.number().int().positive(),
  is_active: z.boolean().optional(),
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
    if (!isAdmin(membership.role)) throw forbidden("Requires manager or owner role");

    const body = bodySchema.parse(await req.json());
    const reward = await createReward(serviceRoleClient(), membership.merchant_id, body);
    return { reward };
  });
}
