import type { ReactNode } from "react";

import { BackendToolsShell } from "@/components/kard/backend-tools-shell";

export default function CustomerScanLayout({ children }: { children: ReactNode }) {
  return <BackendToolsShell>{children}</BackendToolsShell>;
}
