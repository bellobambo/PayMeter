# PayMeter Bruno Collection

Open this folder directly in Bruno and select the `Local` environment.

This collection is arranged around the judged product flow:

```txt
Health
Founders Auth
Features
Nomba Virtual Accounts
Metering
Founder Settlements
Nomba Money
Nomba Webhooks
```

## Recommended Demo Order

1. `Health / Health Check`
2. `Founders Auth / Register Founder`
3. If the founder already exists, run `Founders Auth / Login Founder`.
4. `Features / Create Feature`
5. `Nomba Virtual Accounts / Create Virtual Account`
6. Fund the displayed virtual account from the Nomba test environment.
7. `Metering / Check Meter`
8. `Founders Auth / Get Founder Analytics`
9. `Founder Settlements / Get Settlement Summary`
10. `Founder Settlements / List Settlement Banks`
11. `Founder Settlements / Verify Settlement Account`
12. `Founder Settlements / Request Payout`

## Variables

The `Local` environment defines:

```txt
baseUrl
founderName
founderEmail
founderPassword
token
founderId
featureId
featureName
featurePrice
updatedFeaturePrice
customerUserId
customerName
customerEmail
customerPhone
settlementBankCode
settlementBankName
settlementAccountNumber
payoutAmount
```

Register/Login stores `token` and `founderId` automatically. Protected Studio and settlement requests use the captured token.

## Settlement Note

Before testing `Founder Settlements`, run:

```txt
backend/supabase/migrations/005_founder_settlements.sql
```

Without that migration, the backend correctly rejects settlement calls because the settlement tables and RPC functions do not exist yet.
