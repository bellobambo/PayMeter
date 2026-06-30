create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  internal_user_id text not null unique,
  name text not null,
  email text not null,
  company_name text,
  phone_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users
  add column if not exists email text;

update public.users
set email = concat('missing+', internal_user_id, '@paymeter.local')
where email is null;

alter table public.users
  alter column email set not null;

alter table public.users
  add column if not exists company_name text;

alter table public.users
  add column if not exists phone_number text;

create unique index if not exists users_phone_number_unique
  on public.users(phone_number)
  where phone_number is not null;

create table if not exists public.virtual_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  internal_user_id text not null unique,
  account_ref text not null unique,
  account_holder_id text,
  account_name text not null,
  bank_name text not null,
  bank_account_number text not null unique,
  bank_account_name text,
  currency text not null default 'NGN',
  nomba_response jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nomba_webhook_events (
  id uuid primary key default gen_random_uuid(),
  request_id text unique,
  event_type text,
  transaction_id text unique,
  account_number text,
  amount numeric,
  status text not null default 'pending',
  headers jsonb,
  payload jsonb not null,
  attempt_count integer not null default 0,
  last_error text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.failed_webhook_events (
  id uuid primary key default gen_random_uuid(),
  webhook_event_id uuid references public.nomba_webhook_events(id) on delete set null,
  reason text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_virtual_accounts_internal_user_id
  on public.virtual_accounts(internal_user_id);

create index if not exists idx_virtual_accounts_bank_account_number
  on public.virtual_accounts(bank_account_number);

create index if not exists idx_nomba_webhook_events_status
  on public.nomba_webhook_events(status);
