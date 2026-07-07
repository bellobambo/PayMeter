# PayMeter

PayMeter is a developer-friendly metering and balance engine built for the **DevCareer x Nomba Hackathon 2026**. It enables SaaS founders and developers to easily integrate pay-as-you-go metering into their products, powered by **Nomba's payment infrastructure** (virtual accounts, webhooks, and payouts).

With PayMeter, founders can focus on building their products while offloading the complexity of feature-level metering, customer balance tracking, automated virtual account funding, and developer analytics to a single, robust API.

---

## 🚀 The Core Surfaces

PayMeter provides a complete showcase of the infrastructure provider and a realistic client integration side-by-side:

### 1. PayMeter Studio (Founder Console)
*Target URL:* `/studio` (redirects from `/` and `/founder`)
* **Launch Readiness & Access:** Founders register and log in to get their authentication credentials.
* **Feature Management:** Create, update, price, and toggle features dynamically (e.g. `$2` per API request, or `50 NGN` per AI image generated).
* **Analytics Dashboard:** Get instant visual insights into platform revenue, API usage logs, and active customer counts.
* **API Handoff Contracts:** Standardized code and API schema templates for integrating PayMeter into any application.

### 2. CaptionPilot (Demo Client Application)
*Target URL:* `/captionpilot` (redirects from `/demo`)
* **Interactive Demo:** A mock SaaS application built by a founder (Tunde) that sells AI-generated social media captions to end-users.
* **Pay-per-Use Metering:** Every time a user generates a caption, a request is sent to the PayMeter backend (`POST /api/meter`) to verify balance and deduct the cost.
* **Nomba Virtual Accounts:** When a user's balance runs low, they are provided with a dedicated Nomba-generated virtual bank account to top up instantly.
* **Real-time Logs:** Audit trail displaying usage logs, balance checks, and funding history.

---

## 🛠️ Architecture & Tech Stack

The workspace is organized as a monorepo containing two key components:

```txt
paymeter/
├── backend/    # Node.js/Express, TypeScript, Supabase, and Nomba API integrations
└── frontend/   # Next.js, TypeScript, and Tailwind CSS Client App
```

### Backend (`/backend`)
* **Engine:** Node.js, Express, TypeScript.
* **Database & Auth:** Supabase (PostgreSQL) for transactional data. Password hashing and JWT generation use native Node `crypto` (PBKDF2) to keep dependencies clean and free of heavy native binaries.
* **Nomba API Integration:**
  * **OAuth 2.0 Client Credentials Flow:** Automatically handles token caching, lifecycle, and auto-refresh using the `/v1/auth/token/refresh` endpoint.
  * **Virtual Accounts:** Generates stable virtual accounts mapped to user IDs via unique `accountRef` properties.
  * **Secure Webhooks:** Verification of payload authenticity using the `nomba-signature` header, alongside deduplication to prevent double-crediting.
  * **Payouts:** Bank/wallet transfers via Nomba Money APIs, complete with recipient bank lookups.
* **Atomic Metering Engine:** Utilizes database-level locks (`SELECT FOR UPDATE` inside a Postgres stored procedure) to guarantee atomic balance deduction and eliminate double-spend race conditions.

### Frontend (`/frontend`)
* **Framework:** Next.js (App Router), React, TypeScript, Tailwind CSS.
* **API Client Pattern:** Implements a dual client architecture (`mock` vs `live`). You can toggle the live API via environment variables to run against the Node.js server.

---

## ⚡ Quick Start

### 1. Prerequisites
* Node.js (v18 or higher)
* npm (v9 or higher)
* A Supabase project (for database and schema)
* A Nomba sandbox developer account (for Sandbox Keys)

### 2. Clone and Install Dependencies

Install packages in both directories:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Database Setup (Supabase)
1. Go to your Supabase project's SQL editor.
2. Copy the contents of `backend/supabase/schema.sql` and run the script. This creates:
   - `founders` table
   - `features` table
   - `virtual_accounts` table
   - `balances` table
   - `usage_logs` and `funding_history` tables (for append-only audits)
   - `check_and_deduct_meter` database function (the atomic balance deduct procedure)
   - `credit_user_balance` database function (deduplicated webhook balance funding)

### 4. Configuration (Environment Variables)

#### Backend Setup
In the `backend/` directory, copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in the following variables:
* `PORT` (e.g. `5000`)
* `JWT_SECRET` (custom secure random string)
* `SUPABASE_URL` & `SUPABASE_ANON_KEY`
* `SUPABASE_SERVICE_ROLE_KEY` (required for atomic procedures and schema-bypass writes)
* `NOMBA_CLIENT_ID` & `NOMBA_CLIENT_SECRET`
* `NOMBA_ACCOUNT_ID` & `NOMBA_SUB_ACCOUNT_ID`
* `NOMBA_API_URL` (usually `https://api.nomba.com` or Sandbox API)

#### Frontend Setup
In the `frontend/` directory, create a `.env.local` file:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```
*(By default, if this env is absent or blank, the frontend runs in offline mock API mode to allow UI-only testing).*

### 5. Running the Application

Start the backend:
```bash
# From the backend/ folder
npm run dev
```

Start the frontend:
```bash
# From the frontend/ folder
npm run dev
```

Visit the dashboard at `http://localhost:3000` (or the port specified by Next.js).

---

## 🔗 Integrated API Reference

### Virtual Accounts & Nomba Integrations
* `POST /api/nomba/virtual-accounts` - Create or retrieve a virtual account for a user.
* `GET /api/nomba/virtual-accounts/:userId` - Fetch an existing virtual account.
* `GET /api/nomba/balance` - Get parent/sub-account Nomba wallet balances.
* `GET /api/nomba/banks` - Get list of supported payout banks.
* `POST /api/nomba/bank-lookup` - Resolve bank account details.
* `POST /api/nomba/transfers/bank` - Payout to a bank account.
* `POST /api/nomba/transfers/wallet` - Payout/transfer to another Nomba account.
* `POST /webhooks/nomba` - Nomba payment webhook receiver.

### Metering & Balances
* `POST /api/meter` - Check and deduct balance for a specific feature usage.
* `GET /api/users/:userId/balance` - Get a user's current PayMeter ledger balance.
* `POST /api/features` - Create a new billable feature.
* `GET /api/features` - Get list of billable features.
* `PUT /api/features/:id` - Update a billable feature.
* `PATCH /api/features/:id/toggle` - Toggle deactivation state.

### Founder Auth & Studio
* `POST /api/founders/register` - Founder registration.
* `POST /api/founders/login` - Founder login.
* `GET /api/founders/analytics` - Fetch aggregated revenue and API usage logs.

---

## 🧪 Testing the APIs

The backend includes a fully-configured Bruno collection.
1. Download [Bruno](https://www.usebruno.com/).
2. Click **Open Collection** and select the `backend/bruno` folder.
3. Configure the `Local` environment variables inside Bruno and run requests sequentially.

To run automated backend tests:
```bash
cd backend
npm run test
```

---

## 🏆 Hackathon Details
* **Theme:** DevCareer x Nomba Hackathon 2026
* **Tracks covered:** Nomba Virtual Accounts (funding logic, webhooks), Nomba Transfer APIs (disbursement / developer payouts), SaaS Developer Tools.
