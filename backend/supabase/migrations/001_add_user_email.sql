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
