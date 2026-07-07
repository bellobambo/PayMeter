# PayMeter Backend

This backend is the infrastructure core for PayMeter. It provides founder auth, feature pricing, customer funding, atomic usage metering, analytics, webhook processing, and founder settlements.

The backend is built for the DevCareer x Nomba Hackathon 2026 and uses Nomba payment infrastructure as the money movement layer.

## Stack

```txt
Node.js
Express
TypeScript
Supabase Postgres
Nomba APIs
Bruno API collection
```

## Core Responsibilities

### 1. Founder Workspace

Founders can register, log in, create billable features, price those features, view analytics, and request settlement.

### 2. Customer Funding

End users receive Nomba virtual accounts. When Nomba sends a confirmed payment webhook, PayMeter credits the matching internal customer balance.

### 3. Metering Engine

Before a paid product action runs, the client calls `/api/meter`. The backend checks feature status, price, and customer balance, then deducts atomically if the action is allowed.

### 4. Founder Settlements

Founder revenue is calculated from successful usage logs. A founder can verify a bank account and request payout. The backend reserves available revenue before calling Nomba transfer APIs.

## Setup

Install dependencies:

```bash
npm install
```

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Required environment variables:

```txt
NODE_ENV=development
PORT=5000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
NOMBA_BASE_URL=
NOMBA_CLIENT_ID=
NOMBA_CLIENT_SECRET=
NOMBA_PARENT_ACCOUNT_ID=
NOMBA_SUB_ACCOUNT_ID=
NOMBA_WEBHOOK_SECRET=
```

Start the server:

```bash
npm run dev
```

Build and run production output:

```bash
npm run build
npm start
```

Type-check:

```bash
npm run check
```

## Implemented Routes

### Nomba Connection Layer (Task 1)
```txt
GET  /health
POST /api/nomba/virtual-accounts
GET  /api/nomba/virtual-accounts/:userId
GET  /api/nomba/balance
GET  /api/nomba/balance?subAccountId=<sub-account-id>
GET  /api/nomba/banks
POST /api/nomba/bank-lookup
POST /api/nomba/transfers/bank
POST /api/nomba/transfers/wallet
POST /webhooks/nomba
```

### Metering & Balance Engine (Task 2)
```txt
POST /api/founders/register (Public)
POST /api/founders/login (Public)
GET  /api/founders/analytics
POST /api/features
GET  /api/features
PUT  /api/features/:id
PATCH /api/features/:id/toggle
POST /api/meter
GET  /api/users/:userId/balance
```

Register:

```json
{
  "name": "Tunde Founder",
  "email": "tunde@paymeter.local",
  "password": "securepassword123"
}
```

Login:

```json
{
  "email": "tunde@paymeter.local",
  "password": "securepassword123"
}
```

Successful auth responses return:

```json
{
  "success": true,
  "message": "Founder logged in successfully.",
  "data": {
    "founder": {
      "id": "founder-uuid",
      "name": "Tunde Founder",
      "email": "tunde@paymeter.local"
    },
    "token": "jwt-token"
  }
}
```

Protected founder routes require:

```txt
Authorization: Bearer <token>
```

### API Keys

```txt
POST   /api/founders/api-keys
GET    /api/founders/api-keys
DELETE /api/founders/api-keys/:id
```

Create an API key:

```json
{
  "name": "CaptionPilot production"
}
```

Successful creation returns the raw key once:

```json
{
  "success": true,
  "message": "API key created successfully. Make sure to copy it now, as it will not be shown again.",
  "data": {
    "id": "api-key-uuid",
    "name": "CaptionPilot production",
    "keyPrefix": "pm_live_ab12",
    "isActive": true,
    "createdAt": "2026-07-07T12:00:00.000Z",
    "apiKey": "pm_live_full_secret_returned_once"
  }
}
```

Founder app backends should store the raw key in environment variables and call protected integration routes with either:

```txt
x-api-key: pm_live_full_secret
```

or:

```txt
Authorization: Bearer pm_live_full_secret
```

The database stores only `key_hash` and `key_prefix`, so full API keys cannot be recovered after creation.

If Studio shows that `public.api_keys` is missing after deployment, run `backend/supabase/migrations/005_api_keys.sql` in the production Supabase SQL editor. The migration ends with `notify pgrst, 'reload schema';` so the Supabase API can see the new table immediately.

### Feature Pricing

```txt
POST  /api/features
GET   /api/features
PUT   /api/features/:id
PATCH /api/features/:id/toggle
```

Create or update a billable feature:

```json
{
  "name": "Caption Generation",
  "price": 50
}
```

The authenticated founder owns the feature. CaptionPilot uses the feature name to request metering.

### Nomba Virtual Accounts

```txt
POST /api/nomba/virtual-accounts
GET  /api/nomba/virtual-accounts/:userId
```

Create or retrieve a virtual account:

```json
{
  "userId": "captionpilot_user_001",
  "name": "Amaka Customer",
  "email": "amaka@example.com",
  "companyName": "CaptionPilot",
  "phoneNumber": "+2348012345678"
}
```

The service uses stable `accountRef` values so repeat requests return the same user account when available.

### Webhooks

```txt
POST /webhooks/nomba
```

The webhook service:

- Verifies Nomba signature headers.
- Stores received events.
- Deduplicates repeated delivery attempts.
- Verifies the transaction state before crediting.
- Credits the matching internal user balance through the database function.
- Records failed webhook processing attempts for follow-up.

### Metering

```txt
POST /api/meter
GET  /api/users/:userId/balance
```

Meter request:

```json
{
  "userId": "captionpilot_user_001",
  "featureName": "Caption Generation",
  "founderId": "founder-uuid"
}
```

Allowed response:

```json
{
  "success": true,
  "message": "Meter check allowed and balance deducted.",
  "data": {
    "allowed": true,
    "deductedAmount": 50,
    "remainingBalance": 150
  }
}
```

Denied responses use `402` when the customer balance is insufficient.

### Nomba Money APIs

```txt
GET  /api/nomba/balance
GET  /api/nomba/balance?subAccountId=<sub-account-id>
GET  /api/nomba/banks
POST /api/nomba/bank-lookup
POST /api/nomba/transfers/bank
POST /api/nomba/transfers/wallet
```

These routes expose the lower-level Nomba money capabilities used by the product. For judged founder withdrawals, prefer the protected settlement endpoints below because they validate founder ownership and reserve revenue first.

### Founder Settlements

```txt
GET  /api/founders/settlement/summary
GET  /api/founders/settlement/banks
GET  /api/founders/settlement/account
POST /api/founders/settlement/account/verify
GET  /api/founders/settlement/payouts
POST /api/founders/settlement/payouts
```

Verify a settlement account:

```json
{
  "bankCode": "058",
  "bankName": "GTBank",
  "accountNumber": "0123456789"
}
```

Request a payout:

```json
{
  "amount": 5000
}
```

Settlement safeguards:

- The account is verified by Nomba bank lookup before saving.
- Available balance is computed from successful usage revenue minus reserved, processing, and paid payouts.
- `reserve_founder_payout` takes an advisory transaction lock per founder to prevent double withdrawal.
- A unique `merchantTxRef` is generated for Nomba transfer reconciliation.
- If the transfer initiation fails, the payout record is marked failed instead of silently disappearing.

## Database Functions

### `check_and_deduct_meter`

Used by `/api/meter`.

Guarantees:

- Finds the requested feature for the founder.
- Rejects inactive or missing features.
- Locks the balance row.
- Rejects insufficient balance.
- Deducts exactly once within the transaction.
- Writes the usage log that powers analytics and settlements.

### `credit_user_balance`

Used by the webhook processor.

Guarantees:

- Creates a balance row when needed.
- Deduplicates webhook crediting.
- Writes funding history.

### `get_founder_settlement_summary`

Used by settlement summary.

Calculates:

- Total successful usage revenue.
- Pending payouts.
- Paid payouts.
- Available balance.

### `reserve_founder_payout`

Used before initiating a Nomba transfer.

Guarantees:

- Settlement account must exist.
- Requested amount must be available.
- Revenue is reserved before external transfer initiation.
- Concurrent payout requests from the same founder cannot overspend the same revenue.

## Bruno Collection

Open this folder in Bruno:

```txt
backend/bruno
```

Use the `Local` environment. Recommended execution order:

```txt
1. Health / Health Check
2. Founders Auth / Register Founder or Login Founder
3. Features / Create Feature
4. Nomba Virtual Accounts / Create Virtual Account
5. Metering / Check Meter
6. Founders Auth / Get Founder Analytics
7. Founder Settlements / Get Settlement Summary
8. Founder Settlements / Verify Settlement Account
9. Founder Settlements / Request Payout
```

The auth requests store `token` and `founderId` in Bruno variables for the protected requests.

## Engineering Notes

- Auth uses Node `crypto` primitives for password hashing and JWT signing.
- Nomba access tokens are cached and refreshed server-side.
- Webhook payloads are processed with verification and deduplication.
- Metering and settlement reservations are enforced in Postgres, not only in application memory.
- Raw Nomba money routes are useful for infrastructure testing, but founder payout UX should use `/api/founders/settlement/*`.

## Known Operational Requirements

- Nomba sandbox/test keys should be used during development.
- Real money testing must use the correct Nomba environment and team-approved accounts.
- Supabase migrations must be applied before the corresponding route family is tested.
- The frontend live mode must point to this backend through `NEXT_PUBLIC_API_BASE_URL`.
