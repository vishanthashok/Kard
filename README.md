# Kard

Universal rewards card for west campus.

Kard is a small full-stack demo app: students get a rewards "Kard", earn points when
they spend at west-campus merchants, and redeem those points for rewards.

## Stack

- **Backend:** Node.js + Express (`src/server.js`)
- **Database:** SQLite via Prisma (`prisma/schema.prisma`)
- **Frontend:** static single-page UI served from `public/`

## Data model

- `Student` — a Kard holder (name, email, card number, points balance)
- `Merchant` — a west-campus vendor (name, category, points-per-dollar `rewardRate`)
- `Reward` — a redeemable perk offered by a merchant (title, point `cost`)
- `Transaction` — an `earn` (spent money) or `redeem` (spent points) record

## Local development

Prerequisites: Node.js 20+.

```bash
cp .env.example .env          # sets DATABASE_URL + PORT for local dev
npm install
npm run db:setup              # prisma generate + prisma db push
npm run seed                  # load west-campus merchants and rewards
npm run dev                   # start server on http://localhost:3000
```

Then open http://localhost:3000.

The install steps above are wrapped in an idempotent bootstrap script used by the
Cloud Agent environment:

```bash
./scripts/cloud-agent-install.sh
```

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Service health check |
| GET | `/api/merchants` | List merchants with their rewards |
| POST | `/api/students` | Create a Kard (`{ name, email }`) |
| GET | `/api/students/:id` | Fetch a card with transaction history |
| POST | `/api/students/:id/earn` | Earn points (`{ merchantId, amount }`) |
| POST | `/api/students/:id/redeem` | Redeem a reward (`{ rewardId }`) |

## Tests

```bash
npm test
```

Runs Node's built-in test runner against the API (health, seeded data, and the full
earn → redeem flow).

## Cloud Agent environment

`.cursor/environment.json` defines the Cloud Agent dev environment:

- **install:** `./scripts/cloud-agent-install.sh` — installs deps, generates the Prisma
  client, applies the schema, and seeds baseline data (idempotent).
- **terminals:** `kard-server` runs `npm run dev` on `0.0.0.0:3000`.
- **ports:** exposes `3000`.
