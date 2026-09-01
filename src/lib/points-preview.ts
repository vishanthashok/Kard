/**
 * PREVIEW-ONLY point math.
 *
 * These helpers exist so the merchant scanner can show a customer what they are
 * about to earn before the request is sent. They are NOT authoritative: the
 * backend calculates and persists the real point award, and the UI must always
 * display the value returned by the API after `awardPoints()` resolves.
 *
 * Never use these numbers to update a balance.
 */

/** Display-only fallback rate when a merchant rate is unavailable. */
export const PREVIEW_POINTS_PER_DOLLAR = 1;

/** Parses a currency text input ("12.50", "$12.50") into whole cents. */
export function parseCurrencyToCents(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, "");
  if (cleaned.length === 0) {
    return null;
  }
  if (!/^\d*(\.\d{0,2})?$/.test(cleaned)) {
    return null;
  }
  const amount = Number.parseFloat(cleaned);
  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }
  return Math.round(amount * 100);
}

/**
 * Preview of the points a purchase would earn.
 *
 * TODO(backend): drop this once `awardPoints()` returns a server-calculated
 * preview, or keep it strictly behind a "preview" label.
 */
export function previewPointsForAmount(
  amountCents: number,
  pointsPerDollar: number = PREVIEW_POINTS_PER_DOLLAR,
): number {
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return 0;
  }
  return Math.floor((amountCents / 100) * pointsPerDollar);
}
