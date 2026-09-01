// Global test setup: give env vars sane defaults so serverEnv() doesn't
// blow up when service code imports it during unit tests.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "anon-key-for-tests";
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "service-role-key-for-tests";
process.env.QR_TOKEN_SECRET ??=
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
