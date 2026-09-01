"use client";

import { useCallback, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";

import { CustomerDetailPanel } from "@/components/kard/customer-detail-panel";
import { CustomerRow } from "@/components/kard/customer-row";
import { EmptyState } from "@/components/kard/empty-state";
import { Panel } from "@/components/kard/panel";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { getMerchantCustomerDetail } from "@/lib/api-client";
import {
  KardApiError,
  type MerchantCustomer,
  type MerchantCustomerDetail,
} from "@/lib/api-types";

interface MerchantCustomerDirectoryProps {
  merchantId: string;
  customers: MerchantCustomer[];
}

/** Searchable customer list with a detail panel (side column or sheet). */
export function MerchantCustomerDirectory({
  merchantId,
  customers,
}: MerchantCustomerDirectoryProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MerchantCustomerDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  /**
   * Filtering happens client side against the loaded page of customers.
   * TODO(backend): switch to `getMerchantCustomers(merchantId, query)` once the
   * API paginates, so search covers the full customer base.
   */
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length === 0) return customers;
    return customers.filter((customer) =>
      customer.displayName.toLowerCase().includes(normalized),
    );
  }, [customers, query]);

  const loadDetail = useCallback(
    async (customerId: string) => {
      setIsLoadingDetail(true);
      setDetailError(null);
      try {
        setDetail(await getMerchantCustomerDetail(merchantId, customerId));
      } catch (error) {
        setDetail(null);
        setDetailError(
          error instanceof KardApiError
            ? error.message
            : "We could not load this customer.",
        );
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [merchantId],
  );

  function handleSelect(customer: MerchantCustomer) {
    setSelectedId(customer.id);
    // On desktop the detail lives in the side column, so the sheet stays shut.
    setIsSheetOpen(!isDesktop);
    void loadDetail(customer.id);
  }

  const detailPanel = (
    <CustomerDetailPanel
      detail={detail}
      isLoading={isLoadingDetail}
      error={detailError}
      onRetry={() => selectedId && void loadDetail(selectedId)}
    />
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {customers.length} people carry your Kard.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Panel
          title="All customers"
          action={
            <div className="relative w-48 sm:w-60">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search customers"
                aria-label="Search customers"
                className="pl-9"
              />
            </div>
          }
          contentClassName="px-2 pb-3"
        >
          {filtered.length === 0 ? (
            <EmptyState
              className="m-3"
              icon={Users}
              title="No customers found"
              description={
                query.length > 0
                  ? `Nobody matches "${query}".`
                  : "Scan a Kard to add your first customer."
              }
            />
          ) : (
            <ul>
              {filtered.map((customer) => (
                <li key={customer.id}>
                  <CustomerRow
                    customer={customer}
                    onSelect={handleSelect}
                    isSelected={customer.id === selectedId}
                  />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="hidden lg:block">
          <Panel title="Customer detail" className="sticky top-6">
            {detailPanel}
          </Panel>
        </div>
      </div>

      <Sheet open={isSheetOpen && !isDesktop} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Customer detail</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">{detailPanel}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
