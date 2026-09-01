# Kard

Universal rewards card for local businesses in Austin.

This repository currently holds the **frontend experience**: a mobile-first
customer app and a desktop-friendly merchant dashboard. Every screen reads its
data through `src/lib/api-client.ts`, which resolves mock data today and is the
single place the real Kard API gets wired in.

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

## Stack

- Next.js 16 (App Router, React 19, Turbopack)
- TypeScript in strict mode
- Tailwind CSS v4 + shadcn/ui primitives
- Lucide icons
- `qrcode.react` for the customer QR code

## Routes

Customer (mobile first, `max-w-md`):

| Route                 | Screen                                             |
| --------------------- | -------------------------------------------------- |
| `/app`                | Balance card, quick actions, "Your Kards" list      |
| `/app/merchant/[id]`  | Merchant balance, rewards, transactions, locations  |
| `/app/scan`           | Customer QR code                                    |
| `/app/rewards`        | Rewards across merchants, locked and unlocked       |
| `/app/activity`       | Transaction history grouped by day                  |
| `/app/explore`        | Nearby participating businesses                     |
| `/app/profile`        | Account summary                                     |

Merchant (desktop, tablet and mobile):

| Route                  | Screen                                              |
| ---------------------- | --------------------------------------------------- |
| `/merchant/dashboard`  | Period stats, recent customers/transactions, rewards |
| `/merchant/scan`       | Mock scanner, award points, redeem rewards           |
| `/merchant/customers`  | Searchable customer list with a detail panel         |
| `/merchant/rewards`    | Active rewards and the create-reward form            |
| `/merchant/settings`   | Business profile and locations (read-only)           |

## Data layer

- `src/lib/api-types.ts` — entity and read-model types plus the `KardApiClient`
  contract the real client must satisfy.
- `src/lib/mock-data.ts` — all mock records. Only `api-client.ts` imports it.
- `src/lib/api-client.ts` — `getCurrentUser`, `getWallets`, `getTransactions`,
  `getRewards`, `getMerchants`, `getMerchantDashboard`, `getCustomerByQR`,
  `awardPoints`, `redeemReward` and friends. Each function carries a
  `TODO(backend)` comment naming the endpoint that replaces it.
- `src/lib/mock-qr.ts` — the only place QR payloads are produced or parsed.
  Replace it with backend-issued signed tokens.
- `src/lib/points-preview.ts` — preview-only point math for the scanner. The
  backend owns the authoritative calculation.

Components never import mock data; pages fetch through the API client and pass
data down as props.
