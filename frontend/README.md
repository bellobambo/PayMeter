# PayMeter Frontend

This is the Next.js frontend for PayMeter, built with TypeScript and Tailwind CSS for the DevCareer x Nomba Hackathon 2026.

The frontend is intentionally split into two products:

- PayMeter Studio: the founder-facing infrastructure console.
- CaptionPilot: a realistic customer app using PayMeter behind the scenes.

This split is important for the demo. PayMeter should feel like infrastructure a founder can adopt, while CaptionPilot should feel like the founder's own product.

## Stack

```txt
Next.js App Router
React
TypeScript
Tailwind CSS
Lucide icons
Typed API client
```

## Routes

### PayMeter Studio

```txt
/studio/access       Founder signup and login
/studio              Workspace overview
/studio/features     Create, edit, price, activate, and pause billable features
/studio/analytics    Revenue, metered usage, active users, and feature breakdown
/studio/integration  Developer handoff and API contracts
/studio/settlements  Founder bank account verification and payout requests
```

### CaptionPilot

```txt
/captionpilot           Customer profile and account landing
/captionpilot/workspace Paid caption generation
/captionpilot/top-up    Credit funding through Nomba virtual account flow
/captionpilot/events    Customer activity and payment history
```

### Redirects

```txt
/                -> /studio/access
/founder         -> /studio
/console         -> /studio
/console/access  -> /studio/access
/demo            -> /captionpilot
```

## API Mode

The frontend can run in two modes:

```txt
Preview mode: no NEXT_PUBLIC_API_BASE_URL. Uses local mock data.
Live backend: NEXT_PUBLIC_API_BASE_URL is set. Calls the real backend.
```

Create `frontend/.env.local` for live mode:

```txt
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

For a deployed backend:

```txt
NEXT_PUBLIC_API_BASE_URL=https://your-backend-host
```

The API client is centralized here:

```txt
frontend/lib/api/contracts.ts
frontend/lib/api/paymeter-client.ts
```

## Product Behavior

### Studio

Studio stores the founder session in the browser and uses the bearer token for protected calls:

```txt
POST /api/founders/register
POST /api/founders/login
GET  /api/founders/analytics
GET  /api/founders/settlement/summary
```

Founders can:

- Create a billable feature.
- Set the price in Naira.
- Toggle whether a feature is active.
- See revenue and usage from real meter events.
- Verify a settlement bank account.
- Request withdrawal from available revenue.

### CaptionPilot

CaptionPilot is a customer-facing writing product. It does not expose PayMeter branding to the end user.

The paid action flow is:

```txt
Customer writes campaign brief
        |
        v
CaptionPilot reads the live feature price
        |
        v
Customer clicks Generate caption
        |
        v
Frontend calls POST /api/meter
        |
        v
If allowed, caption is shown
If denied, customer is sent to add credit
```

The generated caption itself is composed in the frontend for demo speed, but the important infrastructure behavior is not local: the action is gated by the backend meter call in live mode.

## Live Demo Flow

1. Start the backend.
2. Start the frontend.
3. Open `/studio/access` and sign in as a founder.
4. Go to `/studio/features` and create `Caption Generation` at `50`.
5. Click `Open CaptionPilot`.
6. Register the customer in CaptionPilot.
7. Add credit through `/captionpilot/top-up`.
8. Generate a caption from `/captionpilot/workspace`.
9. Return to `/studio/analytics` to see metered usage.
10. Open `/studio/settlements` to review founder withdrawal readiness.

## Customer Credit Modes

CaptionPilot supports two credit modes on the payment page:

```txt
Confirmed payment: uses Nomba virtual account funding and backend metering.
Test credit: browser-only credit for UI walkthroughs.
```

Use confirmed payment for the real judged demo. Test credit is only for local UI testing when real top-up is not convenient.

## UX Rules

- Show the price before the paid action.
- Never show the paid output before the meter call succeeds.
- Make insufficient credit clear and actionable.
- Keep CaptionPilot focused on writing value, not infrastructure terminology.
- Keep PayMeter Studio focused on founder control, revenue, integration, and settlement.
- Avoid fake-looking debug copy in the product surface.
- Preserve clear success, denied, pending, and error states.

## Development

Install dependencies:

```bash
cd frontend
npm install
```

Run locally:

```bash
npm run dev
```

Type-check:

```bash
npm run typecheck
```

Build:

```bash
npm run build
```

## Important Files

```txt
frontend/app/studio/*                    Studio routes
frontend/app/captionpilot/*              CaptionPilot routes
frontend/components/console/*            Studio shell and shared console UI
frontend/components/captionpilot/*       CaptionPilot state and shell
frontend/lib/api/contracts.ts            API types and route contract list
frontend/lib/api/paymeter-client.ts      Live/mock API implementation
```
