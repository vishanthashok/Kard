import { CustomerBottomNav } from "@/components/kard/customer-bottom-nav";

/**
 * Mock data derives "Today" / "Yesterday" labels from the current date, so the
 * customer screens render per request instead of being frozen at build time.
 */
export const dynamic = "force-dynamic";

export default function CustomerLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <main className="flex-1 px-5 pt-6 pb-28">{children}</main>
      <CustomerBottomNav />
    </div>
  );
}
