-- Create api_keys table
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founders(id) on delete cascade,
  name text not null,
  key_hash text not null unique,
  key_prefix text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create indexes for performance
create index if not exists idx_api_keys_founder_id on public.api_keys(founder_id);
create index if not exists idx_api_keys_key_hash on public.api_keys(key_hash);
