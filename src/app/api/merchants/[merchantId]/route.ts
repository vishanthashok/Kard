// GET /api/merchants/[merchantId] — merchant detail + locations + active rewards.

import { cookies } from "next/headers";
import { readOnlyCookies, serverActionClient } from "@/lib/db/supabase";
import { json } from "@/lib/http/handler";
import { getMerchant } from "@/lib/merchants/service";
import { listRewardsForMerchant } from "@/lib/rewards/service";

interface Ctx {
  params: Promise<{ merchantId: string }>;
}

export async function GET(_req: Request, ctx: Ctx) {
  return json(async () => {
    const { merchantId } = await ctx.params;
    const sb = serverActionClient(readOnlyCookies(await cookies()));
    const merchant = await getMerchant(sb, merchantId);

    const [{ data: locations, error: lerr }, rewards] = await Promise.all([
      sb.from("locations").select("*").eq("merchant_id", merchantId).eq("is_active", true),
      listRewardsForMerchant(sb, merchantId, { activeOnly: true }),
    ]);
    if (lerr) throw lerr;

    return { merchant, locations: locations ?? [], rewards };
  });
}
