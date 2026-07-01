# Nomba Webhooks

Webhook requests for `POST /webhooks/nomba` live here.

Keep these separate from frontend-facing endpoints because Nomba, not the frontend, calls them.

The sample request needs a valid `nomba-signature` generated with the same `NOMBA_WEBHOOK_SECRET`
configured in `.env`. Invalid signatures should return `401`.
