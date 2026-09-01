import type { ReactNode } from "react";
import { Camera } from "lucide-react";

import { cn } from "@/lib/utils";

interface ScannerFrameProps {
  /** Overlay content, e.g. a spinner while the mock scan resolves. */
  children?: ReactNode;
  className?: string;
}

/**
 * The camera viewport placeholder.
 *
 * TODO(backend/native): replace the placeholder with a real camera stream and
 * post the decoded value to the verification endpoint. Nothing here decodes or
 * trusts a QR code.
 */
export function ScannerFrame({ children, className }: ScannerFrameProps) {
  return (
    <div
      className={cn(
        "relative grid aspect-square w-full place-items-center overflow-hidden rounded-3xl bg-neutral-950 text-neutral-400",
        className,
      )}
    >
      <div aria-hidden className="absolute inset-6 rounded-2xl">
        <span className="absolute top-0 left-0 size-10 rounded-tl-2xl border-t-2 border-l-2 border-white/70" />
        <span className="absolute top-0 right-0 size-10 rounded-tr-2xl border-t-2 border-r-2 border-white/70" />
        <span className="absolute bottom-0 left-0 size-10 rounded-bl-2xl border-b-2 border-l-2 border-white/70" />
        <span className="absolute right-0 bottom-0 size-10 rounded-br-2xl border-r-2 border-b-2 border-white/70" />
      </div>

      <div className="relative flex flex-col items-center gap-2 px-8 text-center">
        {children ?? (
          <>
            <Camera aria-hidden className="size-6" />
            <p className="text-sm font-medium text-neutral-200">Scan customer Kard</p>
            <p className="text-xs text-neutral-500">
              Camera capture is not enabled in this build. Use the test button below.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
