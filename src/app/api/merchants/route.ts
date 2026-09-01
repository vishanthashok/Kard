// GET /api/merchants — browsable list of participating merchants.

import { cookies } from "next/headers";
import { readOnlyCookies, serverActionClient } from "@/lib/db/supabase";
import { json } from "@/lib/http/handler";
import { listActiveMerchants } from "@/lib/merchants/service";

export async function GET() {
  return json(async () => {
    const sb = serverActionClient(readOnlyCookies(await cookies()));
    const merchants = await listActiveMerchants(sb);
    return { merchants };
  });
}
