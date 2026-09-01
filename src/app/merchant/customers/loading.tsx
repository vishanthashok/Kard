import { LoadingRegion } from "@/components/kard/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function MerchantCustomersLoading() {
  return (
    <LoadingRegion label="Loading customers">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-52" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Skeleton className="h-[520px] rounded-2xl" />
          <Skeleton className="hidden h-[520px] rounded-2xl lg:block" />
        </div>
      </div>
    </LoadingRegion>
  );
}
