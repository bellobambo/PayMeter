-- Create founders table
create table if not exists public.founders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create features table
create table if not exists public.features (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founders(id) on delete cascade,
  name text not null,
  price numeric not null check (price > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint features_founder_id_name_key unique (founder_id, name)
);

-- Create balances table
create table if not exists public.balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  internal_user_id text not null unique references public.users(internal_user_id) on delete cascade,
  amount numeric not null default 0 check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create funding_history table (top-up log)
create table if not exists public.funding_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  internal_user_id text not null,
  amount numeric not null check (amount > 0),
  webhook_event_id uuid references public.nomba_webhook_events(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Create usage_logs table
create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  internal_user_id text not null,
  feature_id uuid not null references public.features(id) on delete cascade,
  amount numeric not null check (amount >= 0),
  created_at timestamptz not null default now()
);

-- Create indexes
create index if not exists idx_features_founder_id on public.features(founder_id);
create index if not exists idx_balances_internal_user_id on public.balances(internal_user_id);
create index if not exists idx_funding_history_internal_user_id on public.funding_history(internal_user_id);
create index if not exists idx_usage_logs_internal_user_id on public.usage_logs(internal_user_id);
create index if not exists idx_usage_logs_feature_id on public.usage_logs(feature_id);

-- Create concurrency-safe check and deduct RPC
create or replace function check_and_deduct_meter(
  p_internal_user_id text,
  p_feature_name text,
  p_founder_id uuid default null
)
returns json
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_feature_id uuid;
  v_feature_price numeric;
  v_current_balance numeric;
  v_is_active boolean;
begin
  -- 1. Get user details
  select id into v_user_id from public.users where internal_user_id = p_internal_user_id;
  if v_user_id is null then
    return json_build_object('allowed', false, 'reason', 'User not found');
  end if;

  -- 2. Get feature details
  if p_founder_id is not null then
    select id, price, is_active into v_feature_id, v_feature_price, v_is_active
    from public.features
    where name = p_feature_name and founder_id = p_founder_id;
  else
    select id, price, is_active into v_feature_id, v_feature_price, v_is_active
    from public.features
    where name = p_feature_name
    order by is_active desc, created_at desc
    limit 1;
  end if;

  if v_feature_id is null then
    return json_build_object('allowed', false, 'reason', 'Feature not found');
  end if;

  if not v_is_active then
    return json_build_object('allowed', false, 'reason', 'Feature is inactive');
  end if;

  -- 3. Lock the balance row for update to prevent concurrent double-spending
  select amount into v_current_balance
  from public.balances
  where internal_user_id = p_internal_user_id
  for update;

  if v_current_balance is null then
    -- Initialize balance to 0 if missing
    insert into public.balances (user_id, internal_user_id, amount)
    values (v_user_id, p_internal_user_id, 0)
    returning amount into v_current_balance;
  end if;

  -- 4. Check if balance is sufficient
  if v_current_balance < v_feature_price then
    return json_build_object(
      'allowed', false,
      'reason', 'denied — insufficient balance',
      'currentBalance', v_current_balance,
      'featurePrice', v_feature_price
    );
  end if;

  -- 5. Deduct and log usage
  update public.balances
  set amount = amount - v_feature_price,
      updated_at = now()
  where internal_user_id = p_internal_user_id;

  insert into public.usage_logs (user_id, internal_user_id, feature_id, amount)
  values (v_user_id, p_internal_user_id, v_feature_id, v_feature_price);

  return json_build_object(
    'allowed', true,
    'deductedAmount', v_feature_price,
    'remainingBalance', v_current_balance - v_feature_price
  );
end;
$$;

-- Create concurrency-safe credit balance RPC
create or replace function credit_user_balance(
  p_internal_user_id text,
  p_amount numeric,
  p_webhook_event_id uuid default null
)
returns json
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_current_balance numeric;
  v_funding_id uuid;
begin
  -- Check if webhook has already been credited to prevent double-funding
  if p_webhook_event_id is not null then
    if exists (select 1 from public.funding_history where webhook_event_id = p_webhook_event_id) then
      select amount into v_current_balance from public.balances where internal_user_id = p_internal_user_id;
      return json_build_object(
        'success', true,
        'newBalance', coalesce(v_current_balance, 0),
        'reason', 'Already credited',
        'note', 'Webhook event already processed'
      );
    end if;
  end if;

  -- Get user details
  select id into v_user_id from public.users where internal_user_id = p_internal_user_id;
  if v_user_id is null then
    return json_build_object('success', false, 'reason', 'User not found');
  end if;

  -- Lock balance row for update
  select amount into v_current_balance
  from public.balances
  where internal_user_id = p_internal_user_id
  for update;

  if v_current_balance is null then
    insert into public.balances (user_id, internal_user_id, amount)
    values (v_user_id, p_internal_user_id, p_amount)
    returning amount into v_current_balance;
  else
    update public.balances
    set amount = amount + p_amount,
        updated_at = now()
    where internal_user_id = p_internal_user_id
    returning amount into v_current_balance;
  end if;

  -- Record funding history
  insert into public.funding_history (user_id, internal_user_id, amount, webhook_event_id)
  values (v_user_id, p_internal_user_id, p_amount, p_webhook_event_id)
  returning id into v_funding_id;

  return json_build_object(
    'success', true,
    'newBalance', v_current_balance,
    'fundingId', v_funding_id
  );
end;
$$;
