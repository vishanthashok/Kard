// GET /api/me/transactions?limit=100 — the caller's ledger, newest first.

import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth/session";
import { readOnlyCookies, serverActionClient } from "@/lib/db/supabase";
import { json } from "@/lib/http/handler";
import { listTransactionsForUser } from "@/lib/points/service";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return json(async () => {
    const userId = await requireUser();
    const sb = serverActionClient(readOnlyCookies(await cookies()));
    const limit = Math.min(
      Math.max(parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10) || 50, 1),
      200,
    );
    const transactions = await listTransactionsForUser(sb, userId, limit);
    return { transactions };
  });
}
