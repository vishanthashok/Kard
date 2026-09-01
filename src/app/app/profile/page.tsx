import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, CreditCard, Receipt, Store } from "lucide-react";

import { PersonAvatar } from "@/components/kard/person-avatar";
import { ScreenHeader } from "@/components/kard/screen-header";
import { getCurrentUser, getWallets } from "@/lib/api-client";
import { formatPoints } from "@/lib/format";

export const metadata: Metadata = { title: "Profile" };

const links = [
  { href: "/app", label: "Your Kards", icon: CreditCard },
  { href: "/app/activity", label: "Activity", icon: Receipt },
  { href: "/merchant/dashboard", label: "Switch to merchant tools", icon: Store },
] as const;

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const wallets = await getWallets(user.id);
  const totalPoints = wallets.reduce(
    (total, summary) => total + summary.wallet.pointsBalance,
    0,
  );

  return (
    <div className="space-y-6">
      <ScreenHeader title="Profile" backHref="/app" />

      <section className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-5">
        <PersonAvatar name={user.fullName} className="size-14 text-base" />
        <div className="min-w-0">
          <p className="truncate font-medium">{user.fullName}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{user.memberId}</p>
        </div>
      </section>

      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <dt className="text-sm text-muted-foreground">Total points</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">
            {formatPoints(totalPoints)}
          </dd>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <dt className="text-sm text-muted-foreground">Kards</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">{wallets.length}</dd>
        </div>
      </dl>

      <ul className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href} className="border-b border-border/70 last:border-b-0">
            <Link
              href={href}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <Icon aria-hidden className="size-4 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">{label}</span>
              <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>

      {/* TODO(backend): wire sign out to the Supabase session once auth lands. */}
      <p className="text-center text-xs text-muted-foreground">
        Member since {new Date(user.joinedAt).getFullYear()}
      </p>
    </div>
  );
}
