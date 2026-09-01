import type { Metadata } from "next";

import { MerchantScanner } from "@/components/kard/merchant-scanner";
import { getCurrentMerchant } from "@/lib/api-client";
import { MOCK_DEMO_QR_VALUE } from "@/lib/mock-qr";

export const metadata: Metadata = { title: "Scan" };

export default async function MerchantScanPage() {
  const merchant = await getCurrentMerchant();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Scan customer Kard
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Read a customer code, award points and redeem rewards.
        </p>
      </header>

      <MerchantScanner
        merchantId={merchant.id}
        // TODO(backend): pass the register's location once merchant auth exists.
        locationId={null}
        testQrValue={MOCK_DEMO_QR_VALUE}
      />
    </div>
  );
}
