# PayMeter Frontend

Task 3 implementation for the DevCareer x Nomba Hackathon 2026.

This frontend is built with Next.js, TypeScript, Tailwind CSS, and a mock/live API client pattern. The current UI is designed to be demo-ready before Task 2 is fully available, while keeping every backend dependency explicit.

## Product Surfaces

```txt
PayMeter Studio
/studio              Founder overview and launch readiness
/studio/access       Register/login against the backend and store the bearer token
/studio/features     Create, edit, price, and deactivate billable features
/studio/analytics    Revenue and usage analytics
/studio/integration  API handoff contracts for Task 2

CaptionPilot
/captionpilot            Customer signup for Tunde's app
/captionpilot/workspace  Paid caption generation behind /api/meter
/captionpilot/top-up     Nomba virtual account funding screen
/captionpilot/events     Customer-side meter event log

Compatibility redirects
/         Redirects to /studio
/founder  Redirects to /studio
/console  Redirects to /studio
/demo     Redirects to /captionpilot
```

## API Mode

By default, the frontend runs in mock mode.

To connect to the deployed backend, create `.env.local`:

```txt
NEXT_PUBLIC_API_BASE_URL=https://paymeter.onrender.com
```

The client layer lives in:

```txt
lib/api/paymeter-client.ts
lib/api/contracts.ts
```

## Expected Task 2 Contracts

```txt
POST  /api/founders/register
POST  /api/founders/login
GET   /api/founders/analytics
POST  /api/features
GET   /api/features
PUT   /api/features/:id
PATCH /api/features/:id/toggle
POST  /api/nomba/virtual-accounts
GET   /api/users/:userId/balance
POST  /api/meter
```

The most important integration is `/api/meter`. The frontend sends:

```ts
{
  userId: string;
  featureName: string;
  founderId?: string;
}
```

The frontend expects:

```ts
{
  allowed: boolean;
  deductedAmount: number;
  remainingBalance: number;
}
```

Backend `402` responses are treated as denied meter checks in the sample app.

## Design Direction

PayMeter Studio is PayMeter's actual founder-facing product. CaptionPilot is Tunde's own app, the product his end users interact with. This separation is intentional: judges should see both the infrastructure product and a realistic founder-built app using it.

The founder/payment surfaces use a restrained Nomba-inspired palette: ink, paper, and yellow. CaptionPilot keeps its own softer customer-app identity, while the Nomba funding card stays visually distinct wherever payment is the focus.

## Testing Locally

1. Confirm `frontend/.env.local` contains:

```txt
NEXT_PUBLIC_API_BASE_URL=https://paymeter.onrender.com
```

2. Start the frontend:

```bash
npm run dev
```

3. Visit `/studio/access`, register or log in as a founder, then create features from `/studio/features`.
4. Use `/studio/analytics` to confirm data is pulled from `GET /api/founders/analytics`.

Core UX rules:

- Show balance, price, and deduction near the paid action.
- Run the meter check before showing the product outcome.
- Never hide denied, pending, copied, or confirmed states.
- Keep mock mode isolated behind the API client.
- Preserve the audit trail: events, keys, amount, and status.
