// A tiny in-memory Supabase-compatible fake.
//
// Implements JUST the surface our service layer touches:
//   from(table).select(cols?).eq(col,val)...maybeSingle()/single()/limit()/order()
//   from(table).insert(payload).select("*").single()
//   from(table).insert(payload)   [void]
//   from(table).upsert(payload, {onConflict, ignoreDuplicates}).select("*").single()
//   from(table).update(patch).eq(col,val).select("*").single()
//   from(table).update(patch).eq(col,val)
//   rpc("wallet_balance", {...})
//   rpc("award_points", {...})
//   rpc("redeem_reward", {...})
//
// It matches Supabase's { data, error } return shape. Errors carry a `code`.
// Enough behavior is modeled to exercise the ledger, RPC atomicity guards,
// and the balance derivation.

import crypto from "node:crypto";

type Row = Record<string, unknown>;
type Table = string;

interface Predicate {
  op: "eq";
  col: string;
  val: unknown;
}

class QueryBuilder {
  private predicates: Predicate[] = [];
  private orderCol: string | null = null;
  private orderAsc = true;
  private limitN: number | null = null;
  private selectMode: "select" | "insert" | "update" | "upsert" = "select";
  private payload: Row | Row[] | null = null;
  private upsertOpts: { onConflict?: string; ignoreDuplicates?: boolean } | null = null;
  private wantSelect = false;
  private wantSingle: "single" | "maybeSingle" | null = null;

  constructor(
    private db: FakeDb,
    private table: Table,
  ) {}

  // ---- read chain
  select(_cols?: string) {
    if (this.selectMode === "select") this.wantSelect = true;
    else this.wantSelect = true;
    return this;
  }
  eq(col: string, val: unknown) {
    this.predicates.push({ op: "eq", col, val });
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = opts?.ascending !== false;
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  async maybeSingle() {
    this.wantSingle = "maybeSingle";
    return this.run();
  }
  async single() {
    this.wantSingle = "single";
    return this.run();
  }
  // Awaiting the builder directly returns { data: Row[] }
  then<T1 = { data: Row[]; error: null } | { data: null; error: Error }>(
    onFulfilled: (v: unknown) => T1 | PromiseLike<T1>,
  ) {
    return this.run().then(onFulfilled);
  }

  // ---- write chain
  insert(payload: Row | Row[]) {
    this.selectMode = "insert";
    this.payload = payload;
    return this;
  }
  upsert(payload: Row | Row[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.selectMode = "upsert";
    this.payload = payload;
    this.upsertOpts = opts ?? null;
    return this;
  }
  update(patch: Row) {
    this.selectMode = "update";
    this.payload = patch;
    return this;
  }

  private matches(row: Row): boolean {
    for (const p of this.predicates) {
      if (row[p.col] !== p.val) return false;
    }
    return true;
  }

  private async run(): Promise<{ data: unknown; error: { code?: string; message: string } | null }> {
    const rows = this.db.table(this.table);
    try {
      switch (this.selectMode) {
        case "select": {
          let out = rows.filter((r) => this.matches(r));
          if (this.orderCol) {
            const col = this.orderCol;
            out = [...out].sort((a, b) => {
              const av = (a[col] as number | string) ?? 0;
              const bv = (b[col] as number | string) ?? 0;
              if (av < bv) return this.orderAsc ? -1 : 1;
              if (av > bv) return this.orderAsc ? 1 : -1;
              return 0;
            });
          }
          if (this.limitN != null) out = out.slice(0, this.limitN);
          if (this.wantSingle === "single") {
            if (out.length !== 1) {
              return { data: null, error: { message: "expected exactly one row" } };
            }
            return { data: out[0], error: null };
          }
          if (this.wantSingle === "maybeSingle") {
            return { data: out[0] ?? null, error: null };
          }
          return { data: out, error: null };
        }
        case "insert": {
          const list = Array.isArray(this.payload) ? this.payload : [this.payload!];
          const inserted: Row[] = [];
          for (const p of list) {
            const row = this.db.insertRow(this.table, p);
            inserted.push(row);
          }
          if (this.wantSelect) {
            if (this.wantSingle === "single") return { data: inserted[0], error: null };
            return { data: inserted, error: null };
          }
          return { data: null, error: null };
        }
        case "upsert": {
          const list = Array.isArray(this.payload) ? this.payload : [this.payload!];
          const keys = (this.upsertOpts?.onConflict ?? "").split(",").filter(Boolean);
          const upserted: Row[] = [];
          for (const p of list) {
            let existing: Row | undefined;
            if (keys.length > 0) {
              existing = rows.find((r) => keys.every((k) => r[k] === p[k]));
            }
            if (existing) {
              if (this.upsertOpts?.ignoreDuplicates) {
                upserted.push(existing);
              } else {
                Object.assign(existing, p, { updated_at: new Date().toISOString() });
                upserted.push(existing);
              }
            } else {
              upserted.push(this.db.insertRow(this.table, p));
            }
          }
          if (this.wantSelect) {
            if (this.wantSingle === "single") return { data: upserted[0], error: null };
            return { data: upserted, error: null };
          }
          return { data: null, error: null };
        }
        case "update": {
          const patch = this.payload as Row;
          const updated: Row[] = [];
          for (const r of rows) {
            if (this.matches(r)) {
              Object.assign(r, patch);
              updated.push(r);
            }
          }
          if (this.wantSelect) {
            if (this.wantSingle === "single") {
              if (updated.length !== 1) {
                return { data: null, error: { message: "update matched != 1 row" } };
              }
              return { data: updated[0], error: null };
            }
            return { data: updated, error: null };
          }
          return { data: null, error: null };
        }
      }
    } catch (e) {
      const err = e as { code?: string; message?: string };
      return { data: null, error: { code: err.code, message: err.message ?? "error" } };
    }
    return { data: null, error: null };
  }
}

export class FakeDb {
  tables = new Map<Table, Row[]>();
  // In-flight wallet locks to serialize concurrent RPCs against the same wallet.
  private walletLocks = new Map<string, Promise<void>>();

  table(name: Table): Row[] {
    let t = this.tables.get(name);
    if (!t) {
      t = [];
      this.tables.set(name, t);
    }
    return t;
  }

  insertRow(table: Table, payload: Row): Row {
    const row: Row = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...payload,
    };

    // Enforce unique constraints modeled here.
    if (table === "point_transactions" && row.external_reference != null) {
      const dup = this.table(table).find(
        (r) =>
          r.merchant_id === row.merchant_id &&
          r.external_reference === row.external_reference,
      );
      if (dup) {
        const err = new Error("duplicate external_reference");
        (err as Error & { code: string }).code = "23505";
        throw err;
      }
    }
    if (table === "customer_qr_tokens") {
      const dup = this.table(table).find((r) => r.token_hash === row.token_hash);
      if (dup) {
        const err = new Error("duplicate token_hash");
        (err as Error & { code: string }).code = "23505";
        throw err;
      }
    }

    this.table(table).push(row);
    return row;
  }

  from(table: Table) {
    return new QueryBuilder(this, table);
  }

  async rpc(name: string, args: Row): Promise<{ data: unknown; error: { code?: string; message: string } | null }> {
    try {
      switch (name) {
        case "wallet_balance": {
          const sum = this.table("point_transactions")
            .filter((r) => r.wallet_id === args.p_wallet_id)
            .reduce((acc, r) => acc + (r.points_delta as number), 0);
          return { data: sum, error: null };
        }
        case "award_points": {
          return await this.withWalletLock(args.p_wallet_id as string, async () => {
            const wallet = this.table("wallets").find((w) => w.id === args.p_wallet_id);
            if (!wallet) return { data: null, error: { code: "KD001", message: "wallet not found" } };
            if (
              wallet.merchant_id !== args.p_merchant_id ||
              wallet.user_id !== args.p_user_id
            ) {
              return { data: null, error: { code: "KD001", message: "wallet mismatch" } };
            }
            if ((args.p_points as number) <= 0) {
              return { data: null, error: { code: "KD002", message: "points must be positive" } };
            }
            try {
              const row = this.insertRow("point_transactions", {
                wallet_id: args.p_wallet_id,
                merchant_id: args.p_merchant_id,
                user_id: args.p_user_id,
                location_id: args.p_location_id ?? null,
                transaction_type: "earn",
                points_delta: args.p_points,
                purchase_amount_cents: args.p_purchase_cents ?? null,
                external_reference: args.p_external_reference ?? null,
                created_by: args.p_created_by ?? null,
                metadata: args.p_metadata ?? {},
              });
              wallet.updated_at = new Date().toISOString();
              return { data: row, error: null };
            } catch (e) {
              const err = e as { code?: string; message?: string };
              return { data: null, error: { code: err.code, message: err.message ?? "insert failed" } };
            }
          });
        }
        case "redeem_reward": {
          return await this.withWalletLock(args.p_wallet_id as string, async () => {
            const wallet = this.table("wallets").find((w) => w.id === args.p_wallet_id);
            if (!wallet) return { data: null, error: { code: "KD001", message: "wallet not found" } };
            if (
              wallet.merchant_id !== args.p_merchant_id ||
              wallet.user_id !== args.p_user_id
            ) {
              return { data: null, error: { code: "KD001", message: "wallet mismatch" } };
            }
            const reward = this.table("rewards").find((r) => r.id === args.p_reward_id);
            if (!reward) return { data: null, error: { code: "KD001", message: "reward not found" } };
            if (reward.merchant_id !== args.p_merchant_id) {
              return { data: null, error: { code: "KD001", message: "reward wrong merchant" } };
            }
            if (!reward.is_active) {
              return { data: null, error: { code: "KD004", message: "reward inactive" } };
            }
            const balance = this.table("point_transactions")
              .filter((r) => r.wallet_id === args.p_wallet_id)
              .reduce((acc, r) => acc + (r.points_delta as number), 0);
            const needed = reward.points_required as number;
            if (balance < needed) {
              return { data: null, error: { code: "KD003", message: "insufficient balance" } };
            }
            const tx = this.insertRow("point_transactions", {
              wallet_id: args.p_wallet_id,
              merchant_id: args.p_merchant_id,
              user_id: args.p_user_id,
              location_id: args.p_location_id ?? null,
              transaction_type: "redeem",
              points_delta: -needed,
              created_by: args.p_redeemed_by ?? null,
              metadata: { reward_id: args.p_reward_id, reward_name: reward.name },
            });
            const red = this.insertRow("redemptions", {
              reward_id: args.p_reward_id,
              wallet_id: args.p_wallet_id,
              merchant_id: args.p_merchant_id,
              user_id: args.p_user_id,
              points_spent: needed,
              status: "completed",
              redeemed_by: args.p_redeemed_by ?? null,
              redeemed_at: new Date().toISOString(),
            });
            wallet.updated_at = new Date().toISOString();
            return {
              data: [
                {
                  redemption_id: red.id,
                  transaction_id: tx.id,
                  points_spent: needed,
                  new_balance: balance - needed,
                },
              ],
              error: null,
            };
          });
        }
      }
    } catch (e) {
      const err = e as Error & { code?: string };
      return { data: null, error: { code: err.code, message: err.message } };
    }
    return { data: null, error: { message: `unknown rpc ${name}` } };
  }

  private async withWalletLock<T>(walletId: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.walletLocks.get(walletId) ?? Promise.resolve();
    let release!: () => void;
    const lock = new Promise<void>((r) => (release = r));
    this.walletLocks.set(walletId, prev.then(() => lock));
    await prev;
    try {
      return await fn();
    } finally {
      release();
      // Best-effort GC of resolved lock chain.
      if (this.walletLocks.get(walletId) === lock) this.walletLocks.delete(walletId);
    }
  }
}

// Seed factory used by tests.
export function seedFake() {
  const db = new FakeDb();
  const merchant = db.insertRow("merchants", {
    name: "Test Coffee",
    slug: "test-coffee",
    description: null,
    logo_url: null,
    is_active: true,
  });
  const merchant2 = db.insertRow("merchants", {
    name: "Other Cafe",
    slug: "other-cafe",
    is_active: true,
  });
  const location = db.insertRow("locations", {
    merchant_id: merchant.id,
    name: "Main St",
    address: "123 Main St",
    city: "Austin",
    state: "TX",
    postal_code: "78701",
    is_active: true,
  });
  const customer = db.insertRow("profiles", {
    id: crypto.randomUUID(),
    email: "cust@example.com",
    first_name: "Vish",
    last_name: "A",
  });
  const employee = db.insertRow("profiles", {
    id: crypto.randomUUID(),
    email: "emp@example.com",
    first_name: "Emp",
    last_name: "Loyee",
  });
  db.insertRow("merchant_users", {
    merchant_id: merchant.id,
    user_id: employee.id,
    role: "employee",
  });
  const reward = db.insertRow("rewards", {
    merchant_id: merchant.id,
    name: "Free coffee",
    description: null,
    points_required: 50,
    is_active: true,
  });
  return { db, merchant, merchant2, location, customer, employee, reward };
}
