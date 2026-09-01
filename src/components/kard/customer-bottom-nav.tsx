"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Gift, Home, QrCode, Receipt } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/rewards", label: "Rewards", icon: Gift },
  { href: "/app/explore", label: "Explore", icon: Compass },
  { href: "/app/activity", label: "Activity", icon: Receipt },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/app") {
    return pathname === "/app" || pathname.startsWith("/app/merchant");
  }
  return pathname.startsWith(href);
}

/** Fixed bottom navigation for the customer app, with Scan as the primary action. */
export function CustomerBottomNav() {
  const pathname = usePathname();
  const scanActive = pathname.startsWith("/app/scan");

  return (
    <nav
      aria-label="Customer navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.slice(0, 2).map((item) => (
          <NavItem key={item.href} {...item} active={isActive(pathname, item.href)} />
        ))}

        <li className="flex justify-center">
          <Link
            href="/app/scan"
            aria-label="Scan"
            aria-current={scanActive ? "page" : undefined}
            className={cn(
              "-mt-6 grid size-14 place-items-center rounded-full border-4 border-background bg-foreground text-background shadow-md transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              scanActive && "bg-foreground/85",
            )}
          >
            <QrCode aria-hidden className="size-6" />
          </Link>
        </li>

        {navItems.slice(2).map((item) => (
          <NavItem key={item.href} {...item} active={isActive(pathname, item.href)} />
        ))}
      </ul>
    </nav>
  );
}

interface NavItemProps {
  href: (typeof navItems)[number]["href"];
  label: string;
  icon: (typeof navItems)[number]["icon"];
  active: boolean;
}

function NavItem({ href, label, icon: Icon, active }: NavItemProps) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Icon aria-hidden className="size-5" />
        {label}
      </Link>
    </li>
  );
}
