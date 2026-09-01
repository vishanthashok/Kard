import type { Metadata } from "next";
import { Compass } from "lucide-react";

import { EmptyState } from "@/components/kard/empty-state";
import { NearbyMerchantCard } from "@/components/kard/nearby-merchant-card";
import { ScreenHeader } from "@/components/kard/screen-header";
import { getCurrentUser, getNearbyMerchants } from "@/lib/api-client";

export const metadata: Metadata = { title: "Explore" };

export default async function ExplorePage() {
  const user = await getCurrentUser();
  const nearby = await getNearbyMerchants(user.id);

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Nearby"
        description={`Kard businesses around ${user.homeCity}.`}
      />

      {nearby.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="Nothing nearby yet"
          description="We are signing up more local spots. Check back soon."
        />
      ) : (
        <ul className="space-y-3">
          {nearby.map((entry) => (
            <li key={entry.merchant.id}>
              <NearbyMerchantCard entry={entry} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
