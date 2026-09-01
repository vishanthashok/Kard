"use client";

// Minimal browser tester. Assumes you're already signed in with Supabase
// (sign in via the app's normal auth flow or paste a session cookie).
// Every action hits a real API route — no shortcuts.

import { useState } from "react";

async function call(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json();
  return { status: res.status, body };
}

export default function TesterPage() {
  const [log, setLog] = useState<Array<{ label: string; value: unknown }>>([]);
  const push = (label: string, value: unknown) =>
    setLog((l) => [{ label, value }, ...l]);

  const [token, setToken] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [amountCents, setAmountCents] = useState("875");
  const [rewardId, setRewardId] = useState("");

  return (
    <main
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "32px 20px",
        display: "grid",
        gap: 24,
      }}
    >
      <h1>Kard tester</h1>

      <section style={box}>
        <h2>Customer</h2>
        <button
          onClick={async () => push("/api/me", await call("/api/me"))}
          style={btn}
        >
          GET /api/me
        </button>
        <button
          onClick={async () => push("/api/me/wallets", await call("/api/me/wallets"))}
          style={btn}
        >
          GET /api/me/wallets
        </button>
        <button
          onClick={async () =>
            push("/api/me/transactions", await call("/api/me/transactions"))
          }
          style={btn}
        >
          GET /api/me/transactions
        </button>
        <button
          onClick={async () => {
            const r = await call("/api/me/qr");
            push("/api/me/qr", r);
            const t = (r.body as { token?: string }).token;
            if (t) setToken(t);
          }}
          style={btn}
        >
          GET /api/me/qr (autofill token)
        </button>
      </section>

      <section style={box}>
        <h2>Merchant</h2>
        <label style={label}>
          merchantId (optional if you belong to just one)
          <input value={merchantId} onChange={(e) => setMerchantId(e.target.value)} style={input} />
        </label>
        <label style={label}>
          customer QR token
          <input value={token} onChange={(e) => setToken(e.target.value)} style={input} />
        </label>
        <label style={label}>
          location_id (optional)
          <input value={locationId} onChange={(e) => setLocationId(e.target.value)} style={input} />
        </label>
        <label style={label}>
          purchase_amount_cents
          <input value={amountCents} onChange={(e) => setAmountCents(e.target.value)} style={input} />
        </label>
        <label style={label}>
          reward_id (for redeem)
          <input value={rewardId} onChange={(e) => setRewardId(e.target.value)} style={input} />
        </label>

        <button
          onClick={async () => {
            const qs = merchantId ? `?merchantId=${encodeURIComponent(merchantId)}` : "";
            push(
              `GET customers/${token}`,
              await call(`/api/merchant/customers/${encodeURIComponent(token)}${qs}`),
            );
          }}
          style={btn}
        >
          Resolve customer token
        </button>

        <button
          onClick={async () => {
            const qs = merchantId ? `?merchantId=${encodeURIComponent(merchantId)}` : "";
            push(
              "POST earn",
              await call(`/api/merchant/transactions/earn${qs}`, {
                method: "POST",
                body: JSON.stringify({
                  token,
                  location_id: locationId || null,
                  purchase_amount_cents: Number(amountCents),
                  external_reference: `tester-${Date.now()}`,
                }),
              }),
            );
          }}
          style={btn}
        >
          POST earn
        </button>

        <button
          onClick={async () => {
            const qs = merchantId ? `?merchantId=${encodeURIComponent(merchantId)}` : "";
            push(
              "POST redeem",
              await call(`/api/merchant/rewards/redeem${qs}`, {
                method: "POST",
                body: JSON.stringify({
                  token,
                  reward_id: rewardId,
                  location_id: locationId || null,
                }),
              }),
            );
          }}
          style={btn}
        >
          POST redeem
        </button>

        <button
          onClick={async () => {
            const qs = merchantId ? `?merchantId=${encodeURIComponent(merchantId)}` : "";
            push("GET dashboard", await call(`/api/merchant/dashboard${qs}`));
          }}
          style={btn}
        >
          GET dashboard
        </button>
      </section>

      <section style={box}>
        <h2>Log</h2>
        <div style={{ display: "grid", gap: 12 }}>
          {log.map((entry, i) => (
            <div key={i}>
              <div style={{ opacity: 0.7, fontSize: 12 }}>{entry.label}</div>
              <pre
                style={{
                  background: "#18181b",
                  color: "#e4e4e7",
                  padding: 12,
                  borderRadius: 6,
                  overflowX: "auto",
                }}
              >
                {JSON.stringify(entry.value, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const box: React.CSSProperties = {
  background: "#111114",
  border: "1px solid #27272a",
  borderRadius: 10,
  padding: 20,
  display: "grid",
  gap: 10,
};
const btn: React.CSSProperties = {
  padding: "8px 12px",
  background: "#2563eb",
  color: "white",
  border: 0,
  borderRadius: 6,
  cursor: "pointer",
  width: "fit-content",
};
const label: React.CSSProperties = {
  display: "grid",
  gap: 4,
  fontSize: 13,
  opacity: 0.9,
};
const input: React.CSSProperties = {
  padding: 8,
  borderRadius: 6,
  border: "1px solid #3f3f46",
  background: "#0b0b0d",
  color: "#f4f4f5",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};
