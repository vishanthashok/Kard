import { cn } from "@/lib/utils";

interface KardLogoProps {
  /** Adds the "Merchant" qualifier used across the /merchant interface. */
  variant?: "customer" | "merchant";
  className?: string;
}

export function KardLogo({ variant = "customer", className }: KardLogoProps) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span
        aria-hidden
        className="grid size-7 place-items-center rounded-lg bg-foreground text-[11px] font-semibold tracking-tight text-background"
      >
        K
      </span>
      <span className="text-base font-semibold tracking-tight">
        Kard
        {variant === "merchant" ? (
          <span className="ml-1.5 font-normal text-muted-foreground">Merchant</span>
        ) : null}
      </span>
    </span>
  );
}
