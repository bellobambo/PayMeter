create unique index if not exists users_phone_number_unique
  on public.users(phone_number)
  where phone_number is not null;
