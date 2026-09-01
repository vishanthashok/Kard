// GET /api/merchant/dashboard?merchantId=...
// Manager/owner only.

import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth/session";
import { readOnlyCookies, serverActionClient, serviceRoleClient } from "@/lib/db/supabase";
import { forbidden } from "@/lib/http/errors";
import { json } from "@/lib/http/handler";
import { resolveMerchantContext } from "@/lib/merchants/context";
import { merchantDashboard } from "@/lib/merchants/analytics";
import { isAdmin } from "@/lib/merchants/service";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return json(async () => {
    const userId = await requireUser();
    const sb = serverActionClient(readOnlyCookies(await cookies()));
    const membership = await resolveMerchantContext(
      sb,
      userId,
      req.nextUrl.searchParams.get("merchantId"),
    );
    if (!isAdmin(membership.role)) throw forbidden("Requires manager or owner role");
    const stats = await merchantDashboard(serviceRoleClient(), membership.merchant_id);
    return { merchant_id: membership.merchant_id, stats };
  });
}
