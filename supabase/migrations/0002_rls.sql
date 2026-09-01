-- Row Level Security.
-- Baseline: turn RLS on for every user-facing table. Server code uses the
-- service role key and BYPASSES RLS — routes are responsible for
-- authorization in that path. Anon/authenticated clients see only what the
-- policies below allow.

alter table public.profiles           enable row level security;
alter table public.merchants          enable row level security;
alter table public.locations          enable row level security;
alter table public.merchant_users     enable row level security;
alter table public.wallets            enable row level security;
alter table public.point_transactions enable row level security;
alter table public.rewards            enable row level security;
alter table public.redemptions        enable row level security;
alter table public.promotions         enable row level security;
alter table public.customer_qr_tokens enable row level security;
alter table public.wallet_passes      enable row level security;

-- Convenience: does the current auth.uid() have any role at this merchant?
create or replace function public.is_merchant_member(p_merchant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.merchant_users
    where merchant_id = p_merchant_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_merchant_admin(p_merchant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.merchant_users
    where merchant_id = p_merchant_id
      and user_id = auth.uid()
      and role in ('owner', 'manager')
  );
$$;

-- profiles: each user reads and updates only their own row.
create policy profiles_self_select on public.profiles
  for select using (id = auth.uid());
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- merchants: publicly listable (customers browse). Only server-side writes.
create policy merchants_public_read on public.merchants
  for select using (is_active = true);

-- locations: same — public, active only.
create policy locations_public_read on public.locations
  for select using (is_active = true);

-- merchant_users: a user sees their own memberships; merchant admins see all.
create policy merchant_users_self_read on public.merchant_users
  for select using (user_id = auth.uid() or public.is_merchant_admin(merchant_id));

-- wallets: a user reads only their own; merchant staff read wallets at their merchant.
create policy wallets_self_read on public.wallets
  for select using (
    user_id = auth.uid()
    or public.is_merchant_member(merchant_id)
  );

-- point_transactions: user sees their own; merchant staff see their merchant's.
create policy point_tx_self_read on public.point_transactions
  for select using (
    user_id = auth.uid()
    or public.is_merchant_member(merchant_id)
  );

-- rewards: publicly visible when active; merchant staff see all their rewards.
create policy rewards_public_read on public.rewards
  for select using (is_active = true or public.is_merchant_member(merchant_id));
create policy rewards_admin_write on public.rewards
  for all using (public.is_merchant_admin(merchant_id))
  with check (public.is_merchant_admin(merchant_id));

-- redemptions: user sees own; merchant staff sees theirs.
create policy redemptions_read on public.redemptions
  for select using (
    user_id = auth.uid()
    or public.is_merchant_member(merchant_id)
  );

-- promotions: publicly visible when active.
create policy promotions_public_read on public.promotions
  for select using (is_active = true or public.is_merchant_admin(merchant_id));

-- customer_qr_tokens: users manage only their own tokens.
-- Merchants NEVER read this directly — they hit /api/merchant/customers/[token]
-- which runs server-side with the service role.
create policy qr_tokens_self on public.customer_qr_tokens
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- wallet_passes: user owns their passes.
create policy wallet_passes_self on public.wallet_passes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
