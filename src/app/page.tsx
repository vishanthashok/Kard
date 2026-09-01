import Link from "next/link";
import { ArrowRight, QrCode, Store, TerminalSquare } from "lucide-react";

import { KardLogo } from "@/components/kard/kard-logo";

const entries = [
  {
    href: "/app",
    title: "Customer app",
    description: "Your Kard, rewards, nearby spots and activity.",
    icon: QrCode,
  },
  {
    href: "/merchant/dashboard",
    title: "Merchant tools",
    description: "Scan customers, award points and manage rewards.",
    icon: Store,
  },
  {
    href: "/tester",
    title: "API tester",
    description: "Backend flow for scan → earn → redeem against real routes.",
    icon: TerminalSquare,
  },
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <KardLogo />

      <h1 className="mt-8 font-heading text-3xl font-semibold tracking-tight">
        One card for every local spot.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Earn points anywhere you go in Austin and redeem them without carrying a
        stack of punch cards.
      </p>

      <ul className="mt-10 space-y-3">
        {entries.map(({ href, title, description, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
                <Icon aria-hidden className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{title}</span>
                <span className="block text-sm text-muted-foreground">
                  {description}
                </span>
              </span>
              <ArrowRight aria-hidden className="size-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-xs text-muted-foreground">
        API routes live under <code className="font-mono">/api/*</code> — see the README
        for the full route map.
      </p>
    </main>
  );
}
