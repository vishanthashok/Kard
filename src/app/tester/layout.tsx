import type { ReactNode } from "react";

import { BackendToolsShell } from "@/components/kard/backend-tools-shell";

export default function TesterLayout({ children }: { children: ReactNode }) {
  return <BackendToolsShell>{children}</BackendToolsShell>;
}
