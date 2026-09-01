import type { Metadata } from "next";

import { MerchantCustomerDirectory } from "@/components/kard/merchant-customer-directory";
import { getCurrentMerchant, getMerchantCustomers } from "@/lib/api-client";

export const metadata: Metadata = { title: "Customers" };

export default async function MerchantCustomersPage() {
  const merchant = await getCurrentMerchant();
  const customers = await getMerchantCustomers(merchant.id);

  return (
    <div className="mx-auto max-w-6xl">
      <MerchantCustomerDirectory merchantId={merchant.id} customers={customers} />
    </div>
  );
}
