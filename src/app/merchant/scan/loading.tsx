import { LoadingRegion } from "@/components/kard/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function MerchantScanLoading() {
  return (
    <LoadingRegion label="Loading scanner">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="aspect-square w-full rounded-3xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </LoadingRegion>
  );
}
