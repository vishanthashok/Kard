// GET /api/me/wallets — every wallet the caller owns, with the derived balance.

import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth/session";
import { readOnlyCookies, serverActionClient } from "@/lib/db/supabase";
import { json } from "@/lib/http/handler";
import { getWalletBalance, listWalletsForUser } from "@/lib/points/service";

export async function GET() {
  return json(async () => {
    const userId = await requireUser();
    const sb = serverActionClient(readOnlyCookies(await cookies()));
    const wallets = await listWalletsForUser(sb, userId);
    const withBalance = await Promise.all(
      wallets.map(async (w) => ({
        ...w,
        balance: await getWalletBalance(sb, (w as { id: string }).id),
      })),
    );
    return { wallets: withBalance };
  });
}
