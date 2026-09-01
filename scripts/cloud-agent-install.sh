#!/usr/bin/env bash
# Idempotent Cloud Agent bootstrap for Kard.
# - installs dependencies from the lockfile
# - generates the Prisma client
# - creates/updates the local SQLite schema
# - seeds baseline merchant/reward data
set -euo pipefail

cd "$(dirname "$0")/.."

# Provide a local dev database URL when none is set (e.g. no .env present).
export DATABASE_URL="${DATABASE_URL:-file:./dev.db}"

echo "==> Installing dependencies"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "==> Generating Prisma client"
npx prisma generate

echo "==> Applying database schema"
npx prisma db push --skip-generate

echo "==> Seeding baseline data"
node prisma/seed.js

echo "==> Install complete"
