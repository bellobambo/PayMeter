alter table public.nomba_webhook_events
  add column if not exists raw_payload text;

alter table public.nomba_webhook_events
  add column if not exists confirmed_payment jsonb;
