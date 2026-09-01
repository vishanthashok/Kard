import type { Metadata } from "next";
import { MapPin } from "lucide-react";

import { MerchantAvatar } from "@/components/kard/merchant-avatar";
import { Panel } from "@/components/kard/panel";
import { getCurrentMerchant, getMerchantDetail } from "@/lib/api-client";
import { MOCK_CURRENT_USER_ID } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Settings" };

export default async function MerchantSettingsPage() {
  const merchant = await getCurrentMerchant();
  const { locations } = await getMerchantDetail(MOCK_CURRENT_USER_ID, merchant.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Business profile and earning rules.
        </p>
      </header>

      <Panel title="Business profile">
        <div className="flex items-center gap-4">
          <MerchantAvatar
            name={merchant.name}
            logoText={merchant.logoText}
            brandColor={merchant.brandColor}
            size="lg"
          />
          <div className="min-w-0">
            <p className="font-medium">{merchant.name}</p>
            <p className="text-sm text-muted-foreground">{merchant.tagline}</p>
          </div>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Category</dt>
            <dd className="mt-0.5 font-medium">{merchant.category}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Earning rate</dt>
            <dd className="mt-0.5 font-medium">
              {merchant.pointsPerDollar} pt{merchant.pointsPerDollar === 1 ? "" : "s"} per
              $1
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Kard handle</dt>
            <dd className="mt-0.5 font-mono text-sm">{merchant.slug}</dd>
          </div>
        </dl>
      </Panel>

      <Panel title="Locations" description={`${locations.length} registered`}>
        <ul className="divide-y divide-border/70">
          {locations.map((location) => (
            <li key={location.id} className="py-4 first:pt-0 last:pb-0">
              <p className="font-medium">{location.name}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin aria-hidden className="size-3.5 shrink-0" />
                {location.addressLine1}, {location.city} {location.region}{" "}
                {location.postalCode}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{location.hours}</p>
            </li>
          ))}
        </ul>
      </Panel>

      {/* TODO(backend): editing settings needs merchant auth plus a settings API. */}
      <p className="text-sm text-muted-foreground">
        Editing is read-only in this build. Settings become editable once merchant
        accounts are connected.
      </p>
    </div>
  );
}
