"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatPoints } from "@/lib/format";
import { parseCurrencyToCents, previewPointsForAmount } from "@/lib/points-preview";
import { cn } from "@/lib/utils";

interface AwardPointsFormProps {
  /** Display-only rate used for the preview number. */
  pointsPerDollar: number;
  isSubmitting: boolean;
  onSubmit: (amountCents: number) => void;
  className?: string;
}

/**
 * Purchase amount entry for the merchant scanner.
 *
 * The "+12 points" figure is a PREVIEW ONLY estimate from
 * `lib/points-preview.ts`. The authoritative award comes back from
 * `awardPoints()` and replaces this number once the request resolves.
 */
export function AwardPointsForm({
  pointsPerDollar,
  isSubmitting,
  onSubmit,
  className,
}: AwardPointsFormProps) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const amountCents = parseCurrencyToCents(amount);
  const previewPoints =
    amountCents === null ? 0 : previewPointsForAmount(amountCents, pointsPerDollar);
  const canSubmit = amountCents !== null && amountCents > 0 && !isSubmitting;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (amountCents === null || amountCents <= 0) {
      setError("Enter a purchase amount to award points.");
      return;
    }
    setError(null);
    onSubmit(amountCents);
    setAmount("");
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)} noValidate>
      <div className="space-y-2">
        <Label htmlFor="purchase-amount" className="text-sm font-medium">
          Purchase Amount
        </Label>

        <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-4 py-3 focus-within:ring-3 focus-within:ring-ring/50">
          <span aria-hidden className="text-2xl font-medium text-muted-foreground">
            $
          </span>
          <input
            id="purchase-amount"
            name="purchase-amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={amount}
            aria-describedby="purchase-amount-preview"
            aria-invalid={error !== null}
            onChange={(event) => {
              setAmount(event.target.value);
              setError(null);
            }}
            className="w-full bg-transparent text-2xl font-medium tabular-nums outline-none placeholder:text-muted-foreground/60"
          />
        </div>

        <p
          id="purchase-amount-preview"
          aria-live="polite"
          className="flex items-center justify-between text-sm"
        >
          <span className="text-muted-foreground">
            Preview only · {pointsPerDollar} pt{pointsPerDollar === 1 ? "" : "s"} per $1
          </span>
          <span
            className={cn(
              "font-medium tabular-nums",
              previewPoints > 0 ? "text-emerald-600" : "text-muted-foreground",
            )}
          >
            +{formatPoints(previewPoints)} points
          </span>
        </p>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" disabled={!canSubmit} className="h-14 w-full text-base">
        {isSubmitting ? (
          <>
            <Loader2 aria-hidden className="size-4 animate-spin" />
            Awarding…
          </>
        ) : (
          "Award Points"
        )}
      </Button>
    </form>
  );
}
