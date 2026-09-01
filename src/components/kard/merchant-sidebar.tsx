"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gift,
  LayoutDashboard,
  Menu,
  QrCode,
  Settings,
  Users,
} from "lucide-react";

import { KardLogo } from "@/components/kard/kard-logo";
import { PersonAvatar } from "@/components/kard/person-avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const merchantNavItems = [
  { href: "/merchant/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/merchant/scan", label: "Scan", icon: QrCode },
  { href: "/merchant/customers", label: "Customers", icon: Users },
  { href: "/merchant/rewards", label: "Rewards", icon: Gift },
  { href: "/merchant/settings", label: "Settings", icon: Settings },
] as const;

interface MerchantNavProps {
  merchantName: string;
  /** Shown under the merchant name, e.g. "Guadalupe · 3 locations". */
  merchantMeta: string;
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <ul className="space-y-1">
      {merchantNavItems.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon aria-hidden className="size-4" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Persistent sidebar shown from the large breakpoint up. */
export function MerchantSidebar({ merchantName, merchantMeta }: MerchantNavProps) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/70 bg-card lg:flex lg:flex-col">
      <div className="px-5 py-5">
        <KardLogo variant="merchant" />
      </div>

      <nav aria-label="Merchant navigation" className="flex-1 px-3">
        <NavLinks />
      </nav>

      <div className="flex items-center gap-3 border-t border-border/70 px-5 py-4">
        <PersonAvatar name={merchantName} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{merchantName}</p>
          <p className="truncate text-xs text-muted-foreground">{merchantMeta}</p>
        </div>
      </div>
    </aside>
  );
}

/** Top bar with a slide-out menu, used below the large breakpoint. */
export function MerchantMobileNav({ merchantName, merchantMeta }: MerchantNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex items-center justify-between border-b border-border/70 bg-card px-4 py-3 lg:hidden">
      <KardLogo variant="merchant" />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon-lg" aria-label="Open menu">
            <Menu aria-hidden />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle>{merchantName}</SheetTitle>
            <p className="text-xs text-muted-foreground">{merchantMeta}</p>
          </SheetHeader>
          <nav aria-label="Merchant navigation" className="px-3">
            <NavLinks onNavigate={() => setOpen(false)} />
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
