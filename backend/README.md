# PayMeter Backend

Core backend engine for PayMeter. Includes **Task 1: Nomba Connection Layer** (creating virtual accounts, webhook listening, transaction verification) and **Task 2: Metering & Balance Engine** (entitlement checks, balance tracking, funding history, analytics, features management).

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and fill in Supabase + Nomba sandbox values.

3. Create the Supabase tables by running `supabase/schema.sql` in the Supabase SQL editor.

4. Start the server:

```bash
npm run dev
```

For production builds:

```bash
npm run build
npm start
```

Type-check without emitting files:

```bash
npm run check
```

## Implemented Routes

### Nomba Connection Layer (Task 1 - Authenticated via API Key or JWT)
```txt
GET  /health (Public)
POST /api/nomba/virtual-accounts
GET  /api/nomba/virtual-accounts/:userId
GET  /api/nomba/balance
GET  /api/nomba/balance?subAccountId=<sub-account-id>
GET  /api/nomba/banks (Public)
POST /api/nomba/bank-lookup
POST /api/nomba/transfers/bank
POST /api/nomba/transfers/wallet
POST /webhooks/nomba (Public)
```

### Metering & Balance Engine (Task 2 - Authenticated via API Key or JWT)
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

### API Key Management (Authenticated via JWT)
```txt
POST   /api/founders/api-keys
GET    /api/founders/api-keys
DELETE /api/founders/api-keys/:id
```

Create virtual account request:

```json
{
  "userId": "user_123",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "companyName": "Acme Labs",
  "phoneNumber": "+2348012345678"
}
```

`companyName` and `phoneNumber` are optional. Request payloads use camelCase only.

Successful response:

```json
{
  "success": true,
  "message": "Virtual account created successfully.",
  "data": {
    "userId": "user_123",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "companyName": "Acme Labs",
    "phoneNumber": "+2348012345678",
    "accountNumber": "5343270516",
    "accountName": "John Doe",
    "bankName": "Nomba",
    "accountRef": "paymeter_user_user_123",
    "currency": "NGN",
    "wasExisting": false
  }
}
```

If the user already has a virtual account, the existing account is returned:

```json
{
  "success": true,
  "message": "Virtual account already exists for this user.",
  "data": {
    "userId": "user_123",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "companyName": "Acme Labs",
    "phoneNumber": "+2348012345678",
    "accountNumber": "5343270516",
    "accountName": "John Doe",
    "bankName": "Nomba",
    "accountRef": "paymeter_user_user_123",
    "currency": "NGN",
    "wasExisting": true
  }
}
```

Validation error response:

```json
{
  "success": false,
  "message": "Validation failed. Please check the submitted fields.",
  "errors": {
    "userId": "userId is required and must be a non-empty string.",
    "name": "name is required and must be a non-empty string.",
    "email": "email is required and must be a non-empty string."
  }
}
```

Get virtual account:

```txt
GET /api/nomba/virtual-accounts/user_123
```

Successful response:

```json
{
  "success": true,
  "message": "Virtual account fetched successfully.",
  "data": {
    "userId": "user_123",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "companyName": "Acme Labs",
    "phoneNumber": "+2348012345678",
    "accountNumber": "5343270516",
    "accountName": "John Doe",
    "bankName": "Nomba",
    "accountRef": "paymeter_user_user_123",
    "currency": "NGN"
  }
}
```

Fetch parent account balance:

```txt
GET /api/nomba/balance
```

Fetch sub-account balance:

```txt
GET /api/nomba/balance?subAccountId=<sub-account-id>
```

Fetch supported banks:

```txt
GET /api/nomba/banks
```

Verify a recipient bank account before transfer:

```txt
POST /api/nomba/bank-lookup
```

```json
{
  "accountNumber": "0123456789",
  "bankCode": "058"
}
```

Initiate a bank transfer from the parent account:

```txt
POST /api/nomba/transfers/bank
```

```json
{
  "amount": 3500,
  "accountNumber": "0123456789",
  "accountName": "Recipient Name",
  "bankCode": "058",
  "merchantTxRef": "paymeter-transfer-001",
  "senderName": "PayMeter",
  "narration": "PayMeter payout"
}
```

To initiate from a Nomba sub-account, include `subAccountId` in the same payload. Nomba must enable sub-account transfers on the account before this works.

Initiate a wallet transfer to another Nomba account:

```txt
POST /api/nomba/transfers/wallet
```

```json
{
  "amount": 3500,
  "receiverAccountId": "receiver-nomba-account-id",
  "merchantTxRef": "paymeter-wallet-transfer-001",
  "senderName": "PayMeter",
  "narration": "PayMeter wallet transfer"
}
```

`merchantTxRef` must be unique per transfer. Treat it as the idempotency and reconciliation key for payout initiation.

## Nomba Notes Covered

- Server-to-server auth uses OAuth `client_credentials`.
- Authenticated Nomba calls send both `Authorization: Bearer <token>` and `accountId`.
- Access tokens are cached in memory and refreshed before expiry using `/v1/auth/token/refresh`.
- Balance lookup supports both the parent account and an optional Nomba sub-account.
- Bank payouts should call `/api/nomba/bank-lookup` first so callers can confirm the recipient account name before initiating the transfer.
- Virtual accounts use stable `accountRef` values generated from the internal user ID.
- The current virtual account flow does not set `expectedAmount`/`amount`, because PayMeter top-ups should accept arbitrary transfer amounts.
- The Nomba webhook endpoint is `POST /webhooks/nomba`.
- Webhooks are verified with `nomba-signature` and `nomba-timestamp`, saved before processing, deduplicated by request/transaction ID, then verified against Nomba before producing the Task 2 payment handoff.
- Sub-account creation is not implemented here because this service expects the team's existing sub-account ID in `NOMBA_SUB_ACCOUNT_ID`.

## Metering & Balance Notes (Task 2)

- **Atomic Checks**: Metering queries use `SELECT FOR UPDATE` database locks within the Postgres `check_and_deduct_meter` stored procedure, ensuring atomic transactions and avoiding double-spend race conditions on rapid clicking.
- **Idempotency Guard**: Confirmed top-ups check for existing transactions inside `credit_user_balance` to prevent double-crediting on webhook processor retries.
- **Zero-Dependency Auth**: Leverages native Node.js `crypto` (PBKDF2 and HMAC-SHA256) for password security and JWT signing, keeping build size small and free of native C++ binary requirements (like standard bcrypt).
- **History Auditing**: Separate append-only logs are written for feature usage (`usage_logs`) and wallet deposits (`funding_history`) to enable clear revenue reporting.

## Bruno API Collection

Import the `bruno/` folder in Bruno.

Use the `Local` environment. It defines:

```txt
baseUrl=http://localhost:5000
```

Current request folders:

```txt
Health
Nomba Virtual Accounts
Nomba Money
Nomba Webhooks
Founders Auth
Features
Metering
```
