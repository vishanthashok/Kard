import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function BalanceCardSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-56 rounded-3xl", className)} />;
}

export function MerchantCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="mt-4 h-3 w-40" />
      <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
    </div>
  );
}

export function RowListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

export function CardListSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: cards }, (_, index) => (
        <Skeleton key={index} className="h-36 rounded-2xl" />
      ))}
    </div>
  );
}

export function StatGridSkeleton({ tiles = 4 }: { tiles?: number }) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-hidden
    >
      {Array.from({ length: tiles }, (_, index) => (
        <Skeleton key={index} className="h-32 rounded-2xl" />
      ))}
    </div>
  );
}

/** Announces that a screen is loading for assistive technology. */
export function LoadingRegion({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
