import { ChevronRight } from "lucide-react";

import { PersonAvatar } from "@/components/kard/person-avatar";
import { formatPoints, formatRelativeDay } from "@/lib/format";
import type { MerchantCustomer } from "@/lib/api-types";
import { cn } from "@/lib/utils";

interface CustomerRowProps {
  customer: MerchantCustomer;
  /** When provided the row becomes a button that opens the detail panel. */
  onSelect?: (customer: MerchantCustomer) => void;
  isSelected?: boolean;
  className?: string;
}

/** One customer in a merchant list, interactive or read-only. */
export function CustomerRow({
  customer,
  onSelect,
  isSelected = false,
  className,
}: CustomerRowProps) {
  const content = (
    <>
      <PersonAvatar name={customer.displayName} />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{customer.displayName}</p>
        <p className="text-sm text-muted-foreground">
          {customer.visitCount} {customer.visitCount === 1 ? "visit" : "visits"} ·{" "}
          {formatRelativeDay(customer.lastVisitAt)}
        </p>
      </div>

      <div className="text-right">
        <p className="font-medium tabular-nums">{formatPoints(customer.pointsBalance)}</p>
        <p className="text-xs text-muted-foreground">points</p>
      </div>

      {onSelect ? (
        <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      ) : null}
    </>
  );

  const baseClassName = cn(
    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left",
    className,
  );

  if (!onSelect) {
    return <div className={baseClassName}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(customer)}
      aria-current={isSelected ? "true" : undefined}
      className={cn(
        baseClassName,
        "transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        isSelected && "bg-muted",
      )}
    >
      {content}
    </button>
  );
}
