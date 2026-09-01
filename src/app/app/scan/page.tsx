import type { Metadata } from "next";
import { Sun } from "lucide-react";

import { CustomerQRCode } from "@/components/kard/customer-qr-code";
import { ScreenHeader } from "@/components/kard/screen-header";
import { getCurrentUser, getCustomerQrToken } from "@/lib/api-client";

export const metadata: Metadata = { title: "Scan" };

export default async function ScanPage() {
  const user = await getCurrentUser();
  // Mock token today — see lib/mock-qr.ts for the swap-in point.
  const qrToken = await getCustomerQrToken(user.id);

  return (
    <div className="space-y-6">
      <ScreenHeader title="Your Kard" backHref="/app" />

      <CustomerQRCode
        value={qrToken}
        customerName={user.fullName}
        memberId={user.memberId}
      />

      <div className="space-y-2 text-center">
        <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <Sun aria-hidden className="size-4" />
          Turn your brightness up for a faster scan.
        </p>
        <p className="text-xs text-muted-foreground">
          Hold the code up to the Kard reader at the counter.
        </p>
      </div>
    </div>
  );
}
