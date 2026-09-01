// Seed script — populates a fresh Supabase project with the demo data
// described in the README:
//   1 customer, 2 merchants, 2 locations, 1 owner, 1 employee, 3 rewards,
//   and a handful of sample point transactions.
//
// Usage: npm run db:seed
// Requires:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   QR_TOKEN_SECRET
//
// The script is idempotent-ish: it upserts merchants by slug and profiles by
// email. Reruns won't create duplicate merchants but WILL append point
// transactions — that's fine for a dev DB.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb: SupabaseClient = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureAuthUser(email: string, password: string) {
  // Try to find first.
  const { data: list, error: listErr } = await sb.auth.admin.listUsers({ perPage: 200 });
  if (listErr) throw listErr;
  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) return existing;
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user!;
}

async function ensureProfile(id: string, email: string, first: string, last: string) {
  const { error } = await sb.from("profiles").upsert(
    { id, email, first_name: first, last_name: last },
    { onConflict: "id" },
  );
  if (error) throw error;
}

async function ensureMerchant(slug: string, name: string, description: string) {
  const { data, error } = await sb
    .from("merchants")
    .upsert(
      { slug, name, description, is_active: true },
      { onConflict: "slug" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function ensureLocation(
  merchantId: string,
  name: string,
  address: string,
  city: string,
  state: string,
  postal: string,
) {
  // Locations don't have a natural unique key in schema, so we look up first.
  const { data: existing } = await sb
    .from("locations")
    .select("*")
    .eq("merchant_id", merchantId)
    .eq("name", name)
    .maybeSingle();
  if (existing) return existing;
  const { data, error } = await sb
    .from("locations")
    .insert({
      merchant_id: merchantId,
      name,
      address,
      city,
      state,
      postal_code: postal,
      is_active: true,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function ensureMembership(merchantId: string, userId: string, role: string) {
  const { error } = await sb
    .from("merchant_users")
    .upsert(
      { merchant_id: merchantId, user_id: userId, role },
      { onConflict: "merchant_id,user_id" },
    );
  if (error) throw error;
}

async function ensureReward(
  merchantId: string,
  name: string,
  description: string,
  points: number,
) {
  const { data: existing } = await sb
    .from("rewards")
    .select("*")
    .eq("merchant_id", merchantId)
    .eq("name", name)
    .maybeSingle();
  if (existing) return existing;
  const { data, error } = await sb
    .from("rewards")
    .insert({
      merchant_id: merchantId,
      name,
      description,
      points_required: points,
      is_active: true,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function seed() {
  // ---- Users
  const customer = await ensureAuthUser("customer@kard.local", "Passw0rd!");
  const owner = await ensureAuthUser("owner@kard.local", "Passw0rd!");
  const employee = await ensureAuthUser("employee@kard.local", "Passw0rd!");
  await ensureProfile(customer.id, customer.email!, "Vishanth", "A");
  await ensureProfile(owner.id, owner.email!, "Olivia", "Owner");
  await ensureProfile(employee.id, employee.email!, "Eddie", "Employee");

  // ---- Merchants
  const cafe = await ensureMerchant("cafe-medici", "Cafe Medici", "Third-wave coffee on Guadalupe.");
  const juice = await ensureMerchant("juicebar", "West Campus Juice", "Cold-pressed juices & smoothies.");

  // ---- Locations (two total, per spec).
  await ensureLocation(cafe.id, "Guadalupe", "1900 Guadalupe St", "Austin", "TX", "78705");
  await ensureLocation(juice.id, "Rio Grande", "2300 Rio Grande St", "Austin", "TX", "78705");

  // ---- Memberships
  await ensureMembership(cafe.id, owner.id, "owner");
  await ensureMembership(cafe.id, employee.id, "employee");

  // ---- Rewards (3 total)
  await ensureReward(cafe.id, "Free drip coffee", "Any small drip.", 50);
  await ensureReward(cafe.id, "Free latte", "Any 12oz latte.", 100);
  await ensureReward(juice.id, "Free small juice", "Any small cold-pressed juice.", 75);

  // ---- Sample point transactions via the RPC so the ledger stays valid.
  const { data: wallet, error: werr } = await sb
    .from("wallets")
    .upsert(
      { user_id: customer.id, merchant_id: cafe.id },
      { onConflict: "user_id,merchant_id" },
    )
    .select("*")
    .single();
  if (werr) throw werr;

  const samples = [
    { cents: 500, ref: "seed-a" },
    { cents: 875, ref: "seed-b" },
    { cents: 1200, ref: "seed-c" },
  ];
  for (const s of samples) {
    const { error } = await sb.rpc("award_points", {
      p_wallet_id: wallet.id,
      p_merchant_id: cafe.id,
      p_user_id: customer.id,
      p_location_id: null,
      p_points: Math.floor(s.cents / 100),
      p_purchase_cents: s.cents,
      p_external_reference: s.ref,
      p_created_by: employee.id,
      p_metadata: { seed: true },
    });
    if (error && error.code !== "23505") throw error;
  }

  console.log("Seed complete.");
  console.log({
    customer: customer.email,
    owner: owner.email,
    employee: employee.email,
    cafe: cafe.slug,
    juice: juice.slug,
    wallet_id: wallet.id,
  });
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
