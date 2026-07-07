-- Founder settlement accounts and payout ledger.
-- This keeps customer funding/metering separate from founder withdrawals.

create table if not exists public.founder_settlement_accounts (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null unique references public.founders(id) on delete cascade,
  bank_code text not null,
  bank_name text not null,
  account_number text not null,
  account_name text not null,
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.founder_payout_requests (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founders(id) on delete cascade,
  amount numeric not null check (amount > 0),
  status text not null default 'reserved' check (status in ('reserved', 'processing', 'paid', 'failed', 'cancelled')),
  bank_code text not null,
  bank_name text not null,
  account_number text not null,
  account_name text not null,
  merchant_tx_ref text not null unique,
  transfer_reference text,
  transfer_status text,
  nomba_response jsonb,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists idx_founder_payout_requests_founder_id
  on public.founder_payout_requests(founder_id);

create index if not exists idx_founder_payout_requests_status
  on public.founder_payout_requests(status);

create or replace function public.get_founder_settlement_summary(
  p_founder_id uuid
)
returns json
language plpgsql
security definer
as $$
declare
  v_total_revenue numeric;
  v_paid_out numeric;
  v_pending_payouts numeric;
  v_reserved_total numeric;
  v_available numeric;
begin
  select coalesce(sum(ul.amount), 0)
  into v_total_revenue
  from public.usage_logs ul
  join public.features f on f.id = ul.feature_id
  where f.founder_id = p_founder_id;

  select coalesce(sum(amount), 0)
  into v_paid_out
  from public.founder_payout_requests
  where founder_id = p_founder_id
    and status = 'paid';

  select coalesce(sum(amount), 0)
  into v_pending_payouts
  from public.founder_payout_requests
  where founder_id = p_founder_id
    and status in ('reserved', 'processing');

  v_reserved_total := v_paid_out + v_pending_payouts;
  v_available := greatest(v_total_revenue - v_reserved_total, 0);

  return json_build_object(
    'totalRevenue', v_total_revenue,
    'availableBalance', v_available,
    'pendingPayouts', v_pending_payouts,
    'paidOut', v_paid_out
  );
end;
$$;

create or replace function public.reserve_founder_payout(
  p_founder_id uuid,
  p_amount numeric,
  p_merchant_tx_ref text
)
returns json
language plpgsql
security definer
as $$
declare
  v_account public.founder_settlement_accounts%rowtype;
  v_summary json;
  v_available numeric;
  v_payout public.founder_payout_requests%rowtype;
begin
  if p_amount <= 0 then
    return json_build_object('success', false, 'reason', 'Amount must be greater than zero.');
  end if;

  perform pg_advisory_xact_lock(hashtext(p_founder_id::text));

  select *
  into v_account
  from public.founder_settlement_accounts
  where founder_id = p_founder_id;

  if v_account.id is null then
    return json_build_object('success', false, 'reason', 'Settlement account is required before withdrawal.');
  end if;

  v_summary := public.get_founder_settlement_summary(p_founder_id);
  v_available := (v_summary ->> 'availableBalance')::numeric;

  if v_available < p_amount then
    return json_build_object(
      'success', false,
      'reason', 'Insufficient available settlement balance.',
      'availableBalance', v_available
    );
  end if;

  insert into public.founder_payout_requests (
    founder_id,
    amount,
    status,
    bank_code,
    bank_name,
    account_number,
    account_name,
    merchant_tx_ref
  )
  values (
    p_founder_id,
    p_amount,
    'reserved',
    v_account.bank_code,
    v_account.bank_name,
    v_account.account_number,
    v_account.account_name,
    p_merchant_tx_ref
  )
  returning *
  into v_payout;

  return json_build_object(
    'success', true,
    'payoutId', v_payout.id,
    'availableBefore', v_available,
    'availableAfter', v_available - p_amount,
    'settlementAccount', json_build_object(
      'bankCode', v_account.bank_code,
      'bankName', v_account.bank_name,
      'accountNumber', v_account.account_number,
      'accountName', v_account.account_name
    )
  );
end;
$$;
