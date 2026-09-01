// GET /api/me/qr — mint a fresh QR token for the caller.
//
// The endpoint returns:
//   - `token`: the raw string, to be encoded into the customer's QR image
//   - `url`:   full customer-facing URL (https://kard.app/c/{token})
//   - `expires_at`
//
// The raw token is returned exactly once. The DB only stores its hash.

import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth/session";
import { readOnlyCookies, serverActionClient, serviceRoleClient } from "@/lib/db/supabase";
import { publicEnv } from "@/lib/env";
import { json } from "@/lib/http/handler";
import { issueQrToken } from "@/lib/qr/tokens";

export async function GET() {
  return json(async () => {
    const userId = await requireUser();
    // Read auth from the cookie, but write with the service role — the
    // customer_qr_tokens RLS policy already restricts inserts to the caller.
    // Using the service role keeps this working even if the cookie session
    // is close to expiring.
    void serverActionClient(readOnlyCookies(await cookies()));
    const sb = serviceRoleClient();
    const { NEXT_PUBLIC_APP_URL } = publicEnv();
    const issued = await issueQrToken(sb, userId, { appUrl: NEXT_PUBLIC_APP_URL });
    return {
      token: issued.token,
      url: issued.url,
      expires_at: issued.expires_at,
    };
  });
}
