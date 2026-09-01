-- Atomic operations. These run inside a single transaction on the DB side so
-- that the balance-check and the negative ledger row cannot be split by a
-- concurrent request. Callers use the service role and RPC.

-- ---------------------------------------------------------------------------
-- award_points: create an earn row after locking the wallet.
-- Fails with sqlstate 'KD001' if the merchant/wallet don't match.
-- Fails with sqlstate '23505' (unique_violation) if external_reference repeats.
-- ---------------------------------------------------------------------------
create or replace function public.award_points(
  p_wallet_id           uuid,
  p_merchant_id         uuid,
  p_user_id             uuid,
  p_location_id         uuid,
  p_points              integer,
  p_purchase_cents      integer,
  p_external_reference  text,
  p_created_by          uuid,
  p_metadata            jsonb default '{}'::jsonb
) returns public.point_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.wallets%rowtype;
  v_row    public.point_transactions%rowtype;
begin
  if p_points <= 0 then
    raise exception 'points must be positive' using errcode = 'KD002';
  end if;

  -- Serialize concurrent writes against this wallet.
  select * into v_wallet
    from public.wallets
    where id = p_wallet_id
    for update;

  if not found then
    raise exception 'wallet not found' using errcode = 'KD001';
  end if;

  if v_wallet.merchant_id <> p_merchant_id or v_wallet.user_id <> p_user_id then
    raise exception 'wallet does not belong to this merchant/user' using errcode = 'KD001';
  end if;

  insert into public.point_transactions (
    wallet_id, merchant_id, user_id, location_id,
    transaction_type, points_delta, purchase_amount_cents,
    external_reference, created_by, metadata
  ) values (
    p_wallet_id, p_merchant_id, p_user_id, p_location_id,
    'earn', p_points, p_purchase_cents,
    p_external_reference, p_created_by, coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_row;

  update public.wallets set updated_at = now() where id = p_wallet_id;
  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- redeem_reward: atomic check-and-spend.
-- 1) lock the wallet row (serializes concurrent redeems)
-- 2) load the reward, confirm it belongs to the merchant, is active
-- 3) compute current balance from the ledger
-- 4) fail if balance < points_required (sqlstate 'KD003')
-- 5) insert the negative point_transactions row and the redemptions row
-- ---------------------------------------------------------------------------
create or replace function public.redeem_reward(
  p_wallet_id    uuid,
  p_reward_id    uuid,
  p_merchant_id  uuid,
  p_user_id      uuid,
  p_redeemed_by  uuid,
  p_location_id  uuid default null
) returns table (
  redemption_id     uuid,
  transaction_id    uuid,
  points_spent      integer,
  new_balance       integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet   public.wallets%rowtype;
  v_reward   public.rewards%rowtype;
  v_balance  integer;
  v_tx_id    uuid;
  v_red_id   uuid;
begin
  select * into v_wallet
    from public.wallets
    where id = p_wallet_id
    for update;

  if not found then
    raise exception 'wallet not found' using errcode = 'KD001';
  end if;

  if v_wallet.merchant_id <> p_merchant_id or v_wallet.user_id <> p_user_id then
    raise exception 'wallet does not belong to this merchant/user' using errcode = 'KD001';
  end if;

  select * into v_reward from public.rewards where id = p_reward_id;
  if not found then
    raise exception 'reward not found' using errcode = 'KD001';
  end if;
  if v_reward.merchant_id <> p_merchant_id then
    raise exception 'reward does not belong to this merchant' using errcode = 'KD001';
  end if;
  if not v_reward.is_active then
    raise exception 'reward is not active' using errcode = 'KD004';
  end if;

  select coalesce(sum(points_delta), 0)::int into v_balance
    from public.point_transactions
    where wallet_id = p_wallet_id;

  if v_balance < v_reward.points_required then
    raise exception 'insufficient balance' using errcode = 'KD003';
  end if;

  insert into public.point_transactions (
    wallet_id, merchant_id, user_id, location_id,
    transaction_type, points_delta, created_by, metadata
  ) values (
    p_wallet_id, p_merchant_id, p_user_id, p_location_id,
    'redeem', -v_reward.points_required, p_redeemed_by,
    jsonb_build_object('reward_id', p_reward_id, 'reward_name', v_reward.name)
  )
  returning id into v_tx_id;

  insert into public.redemptions (
    reward_id, wallet_id, merchant_id, user_id,
    points_spent, status, redeemed_by
  ) values (
    p_reward_id, p_wallet_id, p_merchant_id, p_user_id,
    v_reward.points_required, 'completed', p_redeemed_by
  )
  returning id into v_red_id;

  update public.wallets set updated_at = now() where id = p_wallet_id;

  redemption_id  := v_red_id;
  transaction_id := v_tx_id;
  points_spent   := v_reward.points_required;
  new_balance    := v_balance - v_reward.points_required;
  return next;
end;
$$;
