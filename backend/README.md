# PayMeter Backend

Task 1 Nomba connection layer for PayMeter.

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

```txt
GET  /health
POST /api/nomba/virtual-accounts
GET  /api/nomba/virtual-accounts/:userId
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

If the user already has a virtual account, the response is a conflict:

```json
{
  "success": false,
  "message": "Virtual account already exists for this user.",
  "errors": {
    "userId": "This user already has a virtual account.",
    "existingAccount": {
      "accountNumber": "5343270516",
      "accountName": "John Doe",
      "bankName": "Nomba",
      "accountRef": "paymeter_user_user_123",
      "currency": "NGN"
    }
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

## Nomba Notes Covered

- Server-to-server auth uses OAuth `client_credentials`.
- Authenticated Nomba calls send both `Authorization: Bearer <token>` and `accountId`.
- Access tokens are cached in memory and refreshed before expiry using `/v1/auth/token/refresh`.
- Virtual accounts use stable `accountRef` values generated from the internal user ID.
- The current virtual account flow does not set `expectedAmount`/`amount`, because PayMeter top-ups should accept arbitrary transfer amounts.
- Sub-account creation is not implemented here because this service expects the team's existing sub-account ID in `NOMBA_SUB_ACCOUNT_ID`.

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
Nomba Webhooks
```
