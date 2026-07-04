# PayMeter Frontend

Task 3 implementation for the DevCareer x Nomba Hackathon 2026.

This frontend is built with Next.js, TypeScript, Tailwind CSS, and a mock/live API client pattern. The current UI is designed to be demo-ready before Task 2 is fully available, while keeping every backend dependency explicit.

## Product Surfaces

```txt
PayMeter Console
/console              Founder overview and launch readiness
/console/features     Create, edit, price, and deactivate billable features
/console/analytics    Revenue and usage analytics
/console/integration  API handoff contracts for Task 2
/console/access       Founder auth stub

CaptionPilot
/captionpilot            Customer signup for the sample SaaS app
/captionpilot/workspace  Paid caption generation behind /api/meter
/captionpilot/top-up     Nomba virtual account funding screen
/captionpilot/events     Customer-side meter event log

Compatibility redirects
/         Redirects to /console
/founder  Redirects to /console
/demo     Redirects to /captionpilot
```

## API Mode

By default, the frontend runs in mock mode.

To connect to the backend, create `.env.local`:

```txt
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

The client layer lives in:

```txt
lib/api/paymeter-client.ts
lib/api/contracts.ts
```

## Expected Task 2 Contracts

```txt
POST  /api/founders/features
PATCH /api/founders/features/:featureId
GET   /api/founders/analytics
POST  /api/demo/users
POST  /api/meter
```

The most important integration is `/api/meter`. The frontend sends:

```ts
{
  userId: string;
  featureId: string;
  idempotencyKey: string;
}
```

The frontend expects:

```ts
{
  allowed: boolean;
  balance: number;
  chargedAmount: number;
  message: string;
  usageEvent?: {
    id: string;
    featureName: string;
    amount: number;
    status: "allowed" | "denied";
    createdAt: string;
  };
}
```

## Design Direction

PayMeter Console is the actual founder product. CaptionPilot is a separate sample SaaS product that uses PayMeter/Nomba under the hood. This separation is intentional: judges should see both the infrastructure product and a realistic customer-facing implementation.

The founder/payment surfaces use a restrained Nomba-inspired palette: ink, paper, and yellow. CaptionPilot keeps its own softer customer-app identity, while the Nomba funding card stays visually distinct wherever payment is the focus.

Core UX rules:

- Show balance, price, and deduction near the paid action.
- Run the meter check before showing the product outcome.
- Never hide denied, pending, copied, or confirmed states.
- Keep mock mode isolated behind the API client.
- Preserve the audit trail: events, keys, amount, and status.
