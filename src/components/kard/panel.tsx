import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PanelProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/** Bordered surface used across the merchant dashboard and detail views. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: PanelProps) {
  return (
    <section className={cn("rounded-2xl border border-border/70 bg-card", className)}>
      <header className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
        <div>
          <h2 className="font-heading text-base font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </header>
      <div className={cn("px-5 pb-5", contentClassName)}>{children}</div>
    </section>
  );
}
