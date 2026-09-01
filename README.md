# Kard

Universal loyalty platform for participating local businesses.
Customers scan a single QR code at any partner merchant to earn and redeem points.

This repo is the **V1 backend MVP**:
- Next.js 15 App Router + TypeScript
- Supabase Postgres, Supabase Auth, Row Level Security
- Zod-validated API route handlers
- Points stored as an append-only **ledger** — the balance is `SUM(points_delta)`, never a mutable column
- Secure QR tokens (opaque, hashed at rest, TTL + revocation)
- `wallet_passes` table reserved for a later Apple Wallet integration

> V1 rule: points earned at Merchant A are **not** spendable at Merchant B.

The repo also contains the **customer app and merchant dashboard frontend**, built
on mock data behind a single API seam — see §0.

---

## 0 · Frontend (customer app + merchant dashboard)

Next.js App Router pages, Tailwind CSS v4, shadcn/ui primitives and Lucide icons.
Every screen reads through `src/lib/api-client.ts`, which resolves mock data today.
Each function there carries a `TODO(backend)` naming the route from §5 that
replaces it, so wiring the real API up does not touch any component.

Customer (mobile first):

| Route                | Screen                                              |
| -------------------- | --------------------------------------------------- |
| `/app`               | Total balance, quick actions, "Your Kards"           |
| `/app/merchant/[id]` | Balance, rewards, transactions, locations            |
| `/app/scan`          | Customer QR code on a white panel                    |
| `/app/rewards`       | Rewards across merchants, locked and unlocked        |
| `/app/activity`      | Ledger grouped by Today / Yesterday / date           |
| `/app/explore`       | Nearby participating businesses                      |
| `/app/profile`       | Account summary                                      |

Merchant (desktop, tablet, mobile):

| Route                 | Screen                                                |
| --------------------- | ----------------------------------------------------- |
| `/merchant/dashboard` | Period stats, recent customers/transactions, rewards   |
| `/merchant/scan`      | Scanner, award points, redeem rewards                  |
| `/merchant/customers` | Searchable customer list with a detail panel           |
| `/merchant/rewards`   | Active rewards and the create-reward form              |
| `/merchant/settings`  | Business profile and locations                         |

```
src/
├── app/app/…                  # customer screens (+ loading / error states)
├── app/merchant/…             # merchant screens
├── components/kard/…          # KardBalanceCard, MerchantCard, RewardCard,
│                              # TransactionItem, CustomerQRCode, MerchantScanner,
│                              # PointsProgress, StatCard, CustomerRow,
│                              # MerchantSidebar, CustomerBottomNav, …
├── components/ui/…            # shadcn primitives
└── lib/
    ├── api-types.ts           # entity + read-model types, KardApiClient contract
    ├── api-client.ts          # every read/write the UI performs (mocked)
    ├── mock-data.ts           # all mock records — only api-client imports it
    ├── mock-qr.ts             # the only place QR payloads are built or parsed
    ├── points-preview.ts      # preview-only point math (backend is authoritative)
    └── format.ts              # currency / points / relative date helpers
```

Two boundaries the frontend deliberately does not cross:

- **QR** — the customer screen renders whatever string `getCustomerQrToken()`
  returns and the scanner posts it back untouched, so swapping the mock for
  `GET /api/me/qr` + `GET /api/merchant/customers/[token]` needs no UI change.
- **Points** — the "+12 points" figure next to the purchase input is labelled
  preview only. Balances shown after a write come from the API response
  (`points_earned` / `new_balance`), never from local math.

---

## 1 · Setup

### 1.1 Create the Supabase project

1. Sign in at https://supabase.com and create a new project.
2. From **Project Settings → API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, **never** ship to the browser)

### 1.2 Configure environment variables

```bash
cp .env.example .env.local
# fill in the four Supabase values and generate a QR secret:
openssl rand -hex 32   # → paste as QR_TOKEN_SECRET
```

### 1.3 Run the migrations

Two options — pick one.

**Option A: Supabase CLI (recommended).**
```bash
npm install -g supabase
supabase link --project-ref YOUR-PROJECT-REF
supabase db push        # applies everything in supabase/migrations
```

**Option B: Paste into the SQL editor.**
Open the Supabase SQL editor and run each file in `supabase/migrations/` in order:
1. `0001_init.sql` — schema
2. `0002_rls.sql`   — Row Level Security
3. `0003_functions.sql` — atomic `award_points` and `redeem_reward` RPCs

### 1.4 Seed the database

```bash
npm install
npm run db:seed
```

The seed creates 1 customer, 2 merchants, 2 locations, 1 owner, 1 employee, 3 rewards, and 3 sample transactions.
Credentials (all password `Passw0rd!`):
- `customer@kard.local`
- `owner@kard.local`
- `employee@kard.local`

### 1.5 Run Kard locally

```bash
npm run dev
# open http://localhost:3000/tester
```

---

## 2 · Test flow: 0 → 10 points

This walk-through uses the browser tester at `/tester`. You can equivalently use `curl` — see the API map.

1. Sign in to Supabase as `customer@kard.local` in one browser (get a session cookie).
2. In the tester, click **GET /api/me/qr** — it mints a token and autofills the customer QR field.
3. Open a second browser (private window is fine), sign in as `employee@kard.local`.
4. In that second browser, open `/tester` and paste the customer's token.
5. Click **Resolve customer token** — you should see the customer profile and a balance of `0`.
6. Set `purchase_amount_cents = 1000` and click **POST earn**.
   Response:
   ```json
   { "points_earned": 10, "new_balance": 10, "transaction_id": "…", "wallet_id": "…" }
   ```
7. Switch back to the customer and click **GET /api/me/wallets** — the wallet for Cafe Medici now reports `balance: 10`.
8. Click **GET /api/me/transactions** — the ledger contains the `earn` row.

The full lifecycle including redemption:

```bash
# 1. Customer opens their pass → mint a QR token
curl -b customer.cookies http://localhost:3000/api/me/qr

# 2. Employee resolves the token
curl -b employee.cookies \
  "http://localhost:3000/api/merchant/customers/<token>?merchantId=<cafe-id>"

# 3. Employee awards points for a $10 sale
curl -b employee.cookies \
  -X POST -H 'content-type: application/json' \
  "http://localhost:3000/api/merchant/transactions/earn?merchantId=<cafe-id>" \
  -d '{"token":"<token>","purchase_amount_cents":1000,"external_reference":"pos-1"}'

# 4. Employee redeems a reward
curl -b employee.cookies \
  -X POST -H 'content-type: application/json' \
  "http://localhost:3000/api/merchant/rewards/redeem?merchantId=<cafe-id>" \
  -d '{"token":"<token>","reward_id":"<reward-id>"}'
```

---

## 3 · File structure

```
Kard/
├── README.md
├── .env.example
├── package.json
├── tsconfig.json
├── next.config.js
├── vitest.config.ts
├── supabase/
│   └── migrations/
│       ├── 0001_init.sql        # tables + wallet_balance() helper
│       ├── 0002_rls.sql         # Row Level Security policies
│       └── 0003_functions.sql   # award_points + redeem_reward RPCs
├── scripts/
│   └── seed.ts                  # `npm run db:seed`
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── tester/page.tsx      # browser tester UI
│   │   ├── c/[token]/page.tsx   # customer QR landing
│   │   └── api/
│   │       ├── me/…             # customer-scoped endpoints
│   │       ├── merchants/…      # public merchant browse
│   │       └── merchant/…       # merchant-staff endpoints
│   └── lib/
│       ├── env.ts               # zod-validated env access
│       ├── auth/session.ts      # requireUser()
│       ├── db/
│       │   ├── supabase.ts      # browser / server / service-role clients
│       │   └── types.ts         # DB row types
│       ├── http/
│       │   ├── errors.ts        # ApiError + helpers
│       │   └── handler.ts       # json() route wrapper
│       ├── merchants/
│       │   ├── service.ts       # membership + authorization helpers
│       │   ├── context.ts       # resolveMerchantContext()
│       │   └── analytics.ts     # dashboard aggregates
│       ├── points/service.ts    # ledger + awardPointsForPurchase()
│       ├── rewards/service.ts   # reward CRUD + redeemReward()
│       └── qr/tokens.ts         # issue / hash / resolve QR tokens
└── tests/
    ├── fakeSupabase.ts          # in-memory Supabase mock
    ├── setup.ts                 # env defaults for the test env
    ├── points.test.ts
    ├── rewards.test.ts
    ├── qr.test.ts
    └── merchants.test.ts
```

---

## 4 · Database schema

| Table                | Purpose                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `profiles`           | 1:1 with `auth.users`. Basic user profile.                              |
| `merchants`          | Businesses. Public browse.                                              |
| `locations`          | Physical stores under a merchant.                                       |
| `merchant_users`     | (user, merchant, role) — `owner` / `manager` / `employee`.              |
| `wallets`            | One per (user, merchant). Holds **no** balance.                         |
| `point_transactions` | The ledger. Balance = `SUM(points_delta)`. Type: `earn/redeem/adjustment/refund/expiration`. |
| `rewards`            | Redeemable items per merchant.                                          |
| `redemptions`        | Audit trail; status `pending/completed/cancelled`.                      |
| `promotions`         | Multiplier windows (future use).                                        |
| `customer_qr_tokens` | Only the HMAC hash lives here. Raw token is never persisted.            |
| `wallet_passes`      | Reserved for Apple / Google Wallet passes. Unused in V1.                |

Two SQL functions guarantee atomicity:
- `award_points(...)` — locks the wallet, inserts an `earn` row, respects the `(merchant_id, external_reference)` unique index.
- `redeem_reward(...)` — locks the wallet, recomputes the balance from the ledger, and inserts BOTH the negative ledger entry and the redemption row in one transaction.

Row Level Security:
- Customers see only their profile, wallets, transactions, tokens.
- Merchant staff see their merchant's wallets/transactions.
- Managers/owners can write rewards.
- The server uses the `service_role` key for privileged writes and enforces authorization in-code.

---

## 5 · API endpoint map

Customer:
| Method | Path                        | Notes                                     |
| ------ | --------------------------- | ----------------------------------------- |
| GET    | `/api/me`                   | Current profile                           |
| GET    | `/api/me/wallets`           | Wallets with derived balances             |
| GET    | `/api/me/transactions`      | Ledger, `?limit=` (default 50, max 200)   |
| GET    | `/api/me/rewards`           | Every active reward across merchants      |
| GET    | `/api/me/qr`                | Mint a short-lived QR token               |

Public browse:
| Method | Path                                | Notes                          |
| ------ | ----------------------------------- | ------------------------------ |
| GET    | `/api/merchants`                    | Active merchants               |
| GET    | `/api/merchants/[merchantId]`       | Merchant + locations + rewards |

Merchant staff (auth + `merchant_users` role required):
| Method | Path                                     | Roles         |
| ------ | ---------------------------------------- | ------------- |
| GET    | `/api/merchant/customers/[token]`        | any member    |
| POST   | `/api/merchant/transactions/earn`        | any member    |
| POST   | `/api/merchant/rewards/redeem`           | any member    |
| GET    | `/api/merchant/dashboard`                | owner/manager |
| POST   | `/api/merchant/rewards`                  | owner/manager |
| PATCH  | `/api/merchant/rewards/[rewardId]`       | owner/manager |

All merchant-staff routes accept an optional `?merchantId=` query when the caller belongs to multiple merchants.

Errors: every route returns `{ error: { code, message, details? } }` with a matching HTTP status.

---

## 6 · Environment variables

| Name                            | Where          | Purpose                                              |
| ------------------------------- | -------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | client + server| Supabase project URL                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server| Anon key (RLS enforced)                              |
| `NEXT_PUBLIC_APP_URL`           | client + server| Used to build QR URLs (`{APP}/c/{token}`)            |
| `SUPABASE_SERVICE_ROLE_KEY`     | **server only**| Bypasses RLS. Never touch the browser bundle.        |
| `QR_TOKEN_SECRET`               | **server only**| HMAC-SHA256 key for hashing QR tokens (`openssl rand -hex 32`) |

---

## 7 · Commands

```bash
npm install         # install deps
npm run dev         # start Next.js (http://localhost:3000)
npm run build       # production build
npm run start       # run the production build
npm run lint        # next lint
npm run typecheck   # tsc --noEmit
npm test            # vitest
npm run db:seed     # seed the database
```

---

## 8 · Tests

`vitest` covers:
- Earning points (single + repeat).
- Redeeming a reward.
- Insufficient balance.
- Unauthorized merchant staff.
- Unauthorized customer (non-member cannot act).
- Invalid QR token.
- Expired QR token.
- Revoked QR token.
- Duplicate earn via `external_reference` (idempotency).
- Concurrent redemptions serialize and can't double-spend.
- Refunds (negative ledger delta).
- Ledger balance derivation.

Run: `npm test`.

The tests use an in-memory Supabase fake (`tests/fakeSupabase.ts`) that mirrors the query surface used by the service layer. It emulates the SQL RPC semantics — wallet locking, unique constraint on `(merchant_id, external_reference)`, balance recomputation on redeem — so business logic behaves the same as it does against a real Postgres.

---

## 9 · Apple Wallet preparation

The `wallet_passes` table is in place with `serial_number UNIQUE`. When we add real pass generation, the flow will be:

1. On first request, mint a pass: insert a `wallet_passes` row keyed by `user_id + serial_number`, hash the auth token.
2. Generate a `.pkpass` bundle that shows:

   ```
   KARD
   420 POINTS
   Member: Vishanth
   Scan to earn
   ```

3. The QR embedded in the pass calls `GET /api/me/qr` (server-side) to fetch a fresh token — **never** the user ID or balance.
4. Apple's web service endpoints (register / unregister / list updated serials / get pass) live under `/api/apple-wallet/...`; the schema is already ready.

---

## 10 · Still required before production

- **Real Supabase Auth UI + sign-up flow.** Sessions are read from the cookie today, but there is no `/sign-in` page.
- **Row-level policy audit against production role**, including `service_role` audit logging.
- **Rate limiting** on `/api/merchant/*` (Upstash Redis or Supabase Edge middleware).
- **Idempotency-Key HTTP header** in addition to `external_reference`.
- **Points expiration job** (nightly cron adding `expiration` ledger rows).
- **Promotion multiplier application** in `awardPointsForPurchase`.
- **Merchant onboarding**: today `merchants` and `merchant_users` are created via seed or SQL. Build a `/admin` flow.
- **Actual Apple Wallet integration** (see §9) + Google Wallet variant.
- **Observability**: structured logging, Sentry, request IDs.
- **Automated end-to-end tests** against a real Supabase branch (currently we mock).
- **Backup / disaster recovery** playbook for Supabase.
- **Legal / privacy** review: T&Cs, data retention policy for `customer_qr_tokens`, GDPR/CCPA delete-my-account.
- **Secrets rotation**: SOP for rotating `QR_TOKEN_SECRET` (must invalidate outstanding tokens).
