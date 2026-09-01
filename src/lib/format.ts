/** Formatting helpers shared by the customer and merchant interfaces. */

const numberFormatter = new Intl.NumberFormat("en-US");

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const monthDayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export function formatPoints(points: number): string {
  return numberFormatter.format(points);
}

export function formatSignedPoints(points: number): string {
  const sign = points > 0 ? "+" : points < 0 ? "−" : "";
  return `${sign}${numberFormatter.format(Math.abs(points))}`;
}

export function formatCurrencyFromCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

export function formatDistance(miles: number): string {
  return miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles)} mi`;
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}%`;
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** "Today", "Yesterday" or "Aug 28". */
export function formatRelativeDay(iso: string): string {
  const date = new Date(iso);
  const dayDelta = Math.round(
    (startOfDay(new Date()) - startOfDay(date)) / 86_400_000,
  );

  if (dayDelta <= 0) return "Today";
  if (dayDelta === 1) return "Yesterday";
  return monthDayFormatter.format(date);
}

/** "Today · 8:42 AM" style stamp for detail views. */
export function formatDayAndTime(iso: string): string {
  return `${formatRelativeDay(iso)} · ${timeFormatter.format(new Date(iso))}`;
}

/** Groups a list into "Today" / "Yesterday" / "Aug 28" buckets, order kept. */
export function groupByRelativeDay<T>(
  items: T[],
  getDate: (item: T) => string,
): Array<{ label: string; items: T[] }> {
  const groups: Array<{ label: string; items: T[] }> = [];

  for (const item of items) {
    const label = formatRelativeDay(getDate(item));
    const current = groups.at(-1);
    if (current?.label === label) {
      current.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }

  return groups;
}
