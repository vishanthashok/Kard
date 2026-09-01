/**
 * MOCK QR LAYER — replace when the backend ships QR security.
 *
 * Every piece of QR encoding/decoding used by the frontend lives here so the
 * real implementation can swap this module out without touching components.
 *
 * Production behaviour (already implemented backend side):
 *   - the customer app calls `GET /api/me/qr`, which mints a short-lived token,
 *     stores only its HMAC hash and returns `{ token, url, expires_at }`. The
 *     QR image encodes `url`, i.e. `{NEXT_PUBLIC_APP_URL}/c/{token}`, and the
 *     app re-requests it before `expires_at`;
 *   - the merchant scanner sends the raw scanned string to
 *     `GET /api/merchant/customers/[token]`, which resolves and validates it
 *     server side.
 *
 * Nothing here is secure. It exists only so the UI has something to render.
 */

/** URI scheme the demo QR payload uses. */
export const MOCK_QR_PREFIX = "kard://customer/";

/** Stable demo payload requested in the frontend spec. */
export const MOCK_DEMO_QR_VALUE = `${MOCK_QR_PREFIX}demo-user-123`;

/** Seconds a real token would stay valid — drives the refresh countdown UI. */
export const MOCK_QR_TTL_SECONDS = 60;

/**
 * Builds the string encoded into the customer QR code.
 *
 * TODO(backend): replace with the signed token returned by the Kard API.
 */
export function createMockCustomerQrValue(memberId: string): string {
  const handle = memberId.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `${MOCK_QR_PREFIX}${handle || "demo-user-123"}`;
}

/**
 * Reads the customer handle out of a scanned string, accepting both the mock
 * `kard://customer/<handle>` form and the production `<origin>/c/<token>` form
 * so a real code scans without a UI change.
 *
 * TODO(backend): replace with a server-side verification call. The frontend
 * must never decide on its own whether a QR code is valid.
 */
export function parseMockCustomerQrValue(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed.startsWith(MOCK_QR_PREFIX)) {
    const handle = trimmed.slice(MOCK_QR_PREFIX.length);
    return handle.length > 0 ? handle : null;
  }

  const urlMatch = /^https?:\/\/[^/]+\/c\/(.+)$/.exec(trimmed);
  return urlMatch?.[1] ?? null;
}

/** True when a scanned string looks like a Kard customer code. */
export function isMockCustomerQrValue(value: string): boolean {
  return parseMockCustomerQrValue(value) !== null;
}
