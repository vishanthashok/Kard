"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/kard/error-state";

export default function MerchantError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO(observability): forward to the Kard error reporter once it exists.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg pt-10">
      <ErrorState
        title="We could not load this page"
        description="Something went wrong while loading your merchant data. Try again in a moment."
        onRetry={reset}
      />
    </div>
  );
}
