import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

interface ScreenHeaderProps {
  title: string;
  description?: string;
  /** Renders a back chevron pointing at this route. */
  backHref?: "/app" | "/app/rewards" | "/app/explore" | "/app/activity";
  action?: ReactNode;
  className?: string;
}

/** Title block at the top of a customer screen. */
export function ScreenHeader({
  title,
  description,
  backHref,
  action,
  className,
}: ScreenHeaderProps) {
  return (
    <header className={cn("flex items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 items-center gap-2">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Back"
            className="-ml-2 grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <ChevronLeft aria-hidden className="size-5" />
          </Link>
        ) : null}

        <div className="min-w-0">
          <h1 className="truncate font-heading text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>

      {action}
    </header>
  );
}
