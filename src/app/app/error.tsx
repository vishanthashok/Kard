"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/kard/error-state";

export default function CustomerError({
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
    <div className="pt-10">
      <ErrorState
        title="We could not load your Kard"
        description="Something went wrong on our side. Give it another try in a moment."
        onRetry={reset}
      />
    </div>
  );
}
