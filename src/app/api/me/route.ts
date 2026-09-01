// GET /api/me — current profile.

import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth/session";
import { readOnlyCookies, serverActionClient } from "@/lib/db/supabase";
import { json } from "@/lib/http/handler";
import { notFound } from "@/lib/http/errors";
import type { ProfileRow } from "@/lib/db/types";

export async function GET() {
  return json(async () => {
    const userId = await requireUser();
    const sb = serverActionClient(readOnlyCookies(await cookies()));
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound("Profile not found");
    return { profile: data as ProfileRow };
  });
}
