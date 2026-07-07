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

## Supabase Setup

Run the base schema first:

```txt
backend/supabase/schema.sql
```

Then run migrations in order:

```txt
backend/supabase/migrations/001_add_user_email.sql
backend/supabase/migrations/002_make_phone_number_unique.sql
backend/supabase/migrations/003_add_nomba_webhook_processing_columns.sql
backend/supabase/migrations/004_task2_metering_engine.sql
backend/supabase/migrations/005_founder_settlements.sql
```

Do not skip `005_founder_settlements.sql` if the Studio settlement page or Bruno settlement requests will be tested. That migration creates:

- `founder_settlement_accounts`
- `founder_payout_requests`
- `get_founder_settlement_summary(p_founder_id uuid)`
- `reserve_founder_payout(p_founder_id uuid, p_amount numeric, p_merchant_tx_ref text)`

## API Reference

### Health

```txt
GET /
GET /health
```

### Founder Auth

```txt
POST /api/founders/register
POST /api/founders/login
GET  /api/founders/analytics
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
