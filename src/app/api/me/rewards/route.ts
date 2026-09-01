// GET /api/me/rewards — every active reward across every merchant.

import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth/session";
import { readOnlyCookies, serverActionClient } from "@/lib/db/supabase";
import { json } from "@/lib/http/handler";
import { listAllActiveRewards } from "@/lib/rewards/service";

export async function GET() {
  return json(async () => {
    await requireUser();
    const sb = serverActionClient(readOnlyCookies(await cookies()));
    const rewards = await listAllActiveRewards(sb);
    return { rewards };
  });
}
