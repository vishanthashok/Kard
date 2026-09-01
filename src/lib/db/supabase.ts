// Supabase client factories.
//
// Three flavors:
//   - browserClient(): anon key, in the browser, RLS enforced.
//   - serverActionClient(): anon key + user cookie, in server routes, RLS enforced.
//   - serviceRoleClient(): service role key, server-only, RLS BYPASSED.
//
// The service role key must never touch the browser bundle. Callers of
// serviceRoleClient() are responsible for authorization checks.

import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { publicEnv, serverEnv } from "../env";

export function browserClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = publicEnv();
  return createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// The cookie plumbing lives in the route so we accept a store from the caller.
export interface CookieAdapter {
  getAll(): { name: string; value: string }[];
  setAll(
    values: { name: string; value: string; options?: Record<string, unknown> }[],
  ): void;
}

export function serverActionClient(cookies: CookieAdapter) {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = publicEnv();
  return createServerClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookies.getAll(),
        setAll: (values: Parameters<CookieAdapter["setAll"]>[0]) => cookies.setAll(values),
      },
    },
  );
}

// Convenience adapter for Next's read-only cookie store (used by GET handlers
// where we don't need to persist a refreshed session).
export function readOnlyCookies(store: ReadonlyRequestCookies): CookieAdapter {
  return {
    getAll: () => store.getAll().map((c) => ({ name: c.name, value: c.value })),
    setAll: () => {
      // No-op: read-only path.
    },
  };
}

// Cached across a single Node process. Fine because the service role client
// has no per-request state.
let cachedService: ReturnType<typeof createClient> | null = null;
export function serviceRoleClient() {
  if (cachedService) return cachedService;
  const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = serverEnv();
  cachedService = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
  return cachedService;
}
