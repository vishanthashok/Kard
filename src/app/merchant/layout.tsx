import {
  MerchantMobileNav,
  MerchantSidebar,
} from "@/components/kard/merchant-sidebar";
import { getCurrentMerchant } from "@/lib/api-client";

/** Mock data is relative to the current date, so render per request. */
export const dynamic = "force-dynamic";

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const merchant = await getCurrentMerchant();
  const merchantMeta = `${merchant.locationCount} locations · Austin, TX`;

  return (
    <div className="flex flex-1">
      <MerchantSidebar merchantName={merchant.name} merchantMeta={merchantMeta} />

      <div className="flex min-w-0 flex-1 flex-col">
        <MerchantMobileNav merchantName={merchant.name} merchantMeta={merchantMeta} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
