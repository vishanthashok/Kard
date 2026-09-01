import type { ReactNode } from "react";

/**
 * Dark chrome for the backend's own pages (`/tester`, `/c/[token]`).
 *
 * Those pages were written against a dark root layout with inline styles. The
 * root layout is now the Tailwind themed app shell, so this wrapper keeps them
 * looking and reading exactly as their author intended.
 */
export function BackendToolsShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-[#0b0b0d] text-[#f4f4f5] [&_a]:underline-offset-4">
      {children}
    </div>
  );
}
