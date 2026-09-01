// Authentication helpers used by API route handlers.
//
// requireUser() returns the auth.users id, or throws a typed error that
// route handlers map to a 401.

import { cookies } from "next/headers";
import { readOnlyCookies, serverActionClient } from "../db/supabase";
import { ApiError } from "../http/errors";

export async function currentUserId(): Promise<string | null> {
  const store = await cookies();
  const supabase = serverActionClient(readOnlyCookies(store));
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

export async function requireUser(): Promise<string> {
  const id = await currentUserId();
  if (!id) throw new ApiError(401, "unauthenticated", "Sign in required");
  return id;
}
