// Helper: figure out which merchant the calling employee is acting for.
// Employees pass ?merchantId=... when they belong to more than one merchant.
// If they belong to exactly one, we default to it.

import type { SupabaseClient } from "@supabase/supabase-js";
import { badRequest, forbidden } from "../http/errors";
import type { MerchantUserRow, UUID } from "../db/types";
import { getMembership, listMembershipsForUser } from "./service";

export async function resolveMerchantContext(
  sb: SupabaseClient,
  userId: UUID,
  requestedMerchantId?: string | null,
): Promise<MerchantUserRow> {
  if (requestedMerchantId) {
    const m = await getMembership(sb, userId, requestedMerchantId);
    if (!m) throw forbidden("You are not associated with this merchant");
    return m;
  }
  const memberships = await listMembershipsForUser(sb, userId);
  if (memberships.length === 0) {
    throw forbidden("You are not a member of any merchant");
  }
  if (memberships.length > 1) {
    throw badRequest(
      "Multiple merchant memberships; pass ?merchantId= to disambiguate",
    );
  }
  return memberships[0]!;
}
