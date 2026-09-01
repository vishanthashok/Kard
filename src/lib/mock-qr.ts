/**
 * MOCK QR LAYER — replace when the backend ships QR security.
 *
 * Every piece of QR encoding/decoding used by the frontend lives here so the
 * real implementation can swap this module out without touching components.
 *
 * Expected production behaviour (backend owned):
 *   - the customer app requests a short-lived, signed token from the API
 *     (something like `GET /api/customer/qr-token`) and re-requests it before
 *     it expires;
 *   - the merchant scanner posts the raw scanned string to the API, which
 *     verifies the signature and expiry server side.
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
 * Reads the customer handle out of a scanned string.
 *
 * TODO(backend): replace with a server-side verification call. The frontend
 * must never decide on its own whether a QR code is valid.
 */
export function parseMockCustomerQrValue(value: string): string | null {
  if (!value.startsWith(MOCK_QR_PREFIX)) {
    return null;
  }
  const handle = value.slice(MOCK_QR_PREFIX.length).trim();
  return handle.length > 0 ? handle : null;
}

/** True when a scanned string looks like a Kard customer code. */
export function isMockCustomerQrValue(value: string): boolean {
  return parseMockCustomerQrValue(value) !== null;
}
