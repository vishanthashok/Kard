-- Kard MVP schema.
-- Every table uses uuid primary keys. Money is stored in integer cents.
-- Points balances are DERIVED from point_transactions (a ledger), never stored.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: mirrors auth.users, one row per human customer or merchant staff.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  first_name  text,
  last_name   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- merchants: a business that issues its own points.
-- V1 rule: points earned at merchant A are NOT spendable at merchant B.
-- ---------------------------------------------------------------------------
create table if not exists public.merchants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  logo_url    text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- locations: physical stores where a scan can happen.
-- ---------------------------------------------------------------------------
create table if not exists public.locations (
  id           uuid primary key default gen_random_uuid(),
  merchant_id  uuid not null references public.merchants(id) on delete cascade,
  name         text not null,
  address      text,
  city         text,
  state        text,
  postal_code  text,
  latitude     double precision,
  longitude    double precision,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists locations_merchant_idx on public.locations(merchant_id);

-- ---------------------------------------------------------------------------
-- merchant_users: which humans can act on behalf of which merchant.
-- ---------------------------------------------------------------------------
create type public.merchant_role as enum ('owner', 'manager', 'employee');

create table if not exists public.merchant_users (
  id           uuid primary key default gen_random_uuid(),
  merchant_id  uuid not null references public.merchants(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  role         public.merchant_role not null,
  created_at   timestamptz not null default now(),
  unique (merchant_id, user_id)
);
create index if not exists merchant_users_user_idx on public.merchant_users(user_id);

-- ---------------------------------------------------------------------------
-- wallets: exactly one per (user, merchant). Holds no balance — the balance
-- is SUM(point_transactions.points_delta) scoped to this wallet.
-- ---------------------------------------------------------------------------
create table if not exists public.wallets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  merchant_id  uuid not null references public.merchants(id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, merchant_id)
);
create index if not exists wallets_user_idx on public.wallets(user_id);
create index if not exists wallets_merchant_idx on public.wallets(merchant_id);

-- ---------------------------------------------------------------------------
-- point_transactions: the ledger. Balance is SUM(points_delta) per wallet.
-- points_delta is positive for earn/refund/adjustment-credit,
-- negative for redeem/expiration/adjustment-debit.
-- external_reference is unique per merchant to make earn requests idempotent.
-- ---------------------------------------------------------------------------
create type public.transaction_type as enum (
  'earn', 'redeem', 'adjustment', 'refund', 'expiration'
);

create table if not exists public.point_transactions (
  id                    uuid primary key default gen_random_uuid(),
  wallet_id             uuid not null references public.wallets(id) on delete restrict,
  merchant_id           uuid not null references public.merchants(id) on delete restrict,
  user_id               uuid not null references public.profiles(id) on delete restrict,
  location_id           uuid references public.locations(id) on delete set null,
  transaction_type      public.transaction_type not null,
  points_delta          integer not null,
  purchase_amount_cents integer,
  external_reference    text,
  created_by            uuid references public.profiles(id) on delete set null,
  metadata              jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  -- Prevents replay attacks / accidental double-post from a POS retry.
  unique (merchant_id, external_reference)
);
create index if not exists point_tx_wallet_idx on public.point_transactions(wallet_id);
create index if not exists point_tx_merchant_idx on public.point_transactions(merchant_id);
create index if not exists point_tx_user_idx on public.point_transactions(user_id);

-- ---------------------------------------------------------------------------
-- rewards: catalog items a customer can spend points on.
-- ---------------------------------------------------------------------------
create table if not exists public.rewards (
  id              uuid primary key default gen_random_uuid(),
  merchant_id     uuid not null references public.merchants(id) on delete cascade,
  name            text not null,
  description     text,
  points_required integer not null check (points_required > 0),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists rewards_merchant_idx on public.rewards(merchant_id);

-- ---------------------------------------------------------------------------
-- redemptions: audit trail of reward claims.
-- ---------------------------------------------------------------------------
create type public.redemption_status as enum ('pending', 'completed', 'cancelled');

create table if not exists public.redemptions (
  id            uuid primary key default gen_random_uuid(),
  reward_id     uuid not null references public.rewards(id) on delete restrict,
  wallet_id     uuid not null references public.wallets(id) on delete restrict,
  merchant_id   uuid not null references public.merchants(id) on delete restrict,
  user_id       uuid not null references public.profiles(id) on delete restrict,
  points_spent  integer not null check (points_spent > 0),
  status        public.redemption_status not null default 'completed',
  redeemed_by   uuid references public.profiles(id) on delete set null,
  redeemed_at   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create index if not exists redemptions_wallet_idx on public.redemptions(wallet_id);
create index if not exists redemptions_merchant_idx on public.redemptions(merchant_id);

-- ---------------------------------------------------------------------------
-- promotions: multiplier campaigns (2x points on Tuesdays, etc.).
-- ---------------------------------------------------------------------------
create table if not exists public.promotions (
  id           uuid primary key default gen_random_uuid(),
  merchant_id  uuid not null references public.merchants(id) on delete cascade,
  name         text not null,
  description  text,
  multiplier   numeric(5, 2) not null default 1.00 check (multiplier > 0),
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists promotions_merchant_idx on public.promotions(merchant_id);

-- ---------------------------------------------------------------------------
-- customer_qr_tokens: opaque, short-lived tokens embedded in customer QRs.
-- Raw user ids never leave the server. We store only a hash of the token.
-- ---------------------------------------------------------------------------
create table if not exists public.customer_qr_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists qr_tokens_user_idx on public.customer_qr_tokens(user_id);
create index if not exists qr_tokens_expires_idx on public.customer_qr_tokens(expires_at);

-- ---------------------------------------------------------------------------
-- wallet_passes: reserved for future Apple Wallet / Google Wallet integration.
-- No pass generation logic in V1 — just the shape.
-- ---------------------------------------------------------------------------
create table if not exists public.wallet_passes (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.profiles(id) on delete cascade,
  serial_number               text not null unique,
  authentication_token_hash   text not null,
  pass_type_identifier        text not null,
  last_updated_at             timestamptz not null default now(),
  created_at                  timestamptz not null default now()
);
create index if not exists wallet_passes_user_idx on public.wallet_passes(user_id);

-- ---------------------------------------------------------------------------
-- Helper: derived balance for a wallet. Single source of truth.
-- ---------------------------------------------------------------------------
create or replace function public.wallet_balance(p_wallet_id uuid)
returns integer
language sql
stable
as $$
  select coalesce(sum(points_delta), 0)::int
  from public.point_transactions
  where wallet_id = p_wallet_id;
$$;
