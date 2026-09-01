// PATCH /api/merchant/rewards/[rewardId] — edit a reward. Manager/owner only.

import { cookies } from "next/headers";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { readOnlyCookies, serverActionClient, serviceRoleClient } from "@/lib/db/supabase";
import { forbidden } from "@/lib/http/errors";
import { json } from "@/lib/http/handler";
import { resolveMerchantContext } from "@/lib/merchants/context";
import { updateReward } from "@/lib/rewards/service";
import { isAdmin } from "@/lib/merchants/service";
import type { NextRequest } from "next/server";

const bodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    points_required: z.number().int().positive().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "Provide at least one field to update",
  });

interface Ctx {
  params: Promise<{ rewardId: string }>;
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  return json(async () => {
    const userId = await requireUser();
    const sb = serverActionClient(readOnlyCookies(await cookies()));
    const membership = await resolveMerchantContext(
      sb,
      userId,
      req.nextUrl.searchParams.get("merchantId"),
    );
    if (!isAdmin(membership.role)) throw forbidden("Requires manager or owner role");

    const { rewardId } = await ctx.params;
    const patch = bodySchema.parse(await req.json());
    const reward = await updateReward(
      serviceRoleClient(),
      membership.merchant_id,
      rewardId,
      patch,
    );
    return { reward };
  });
}
