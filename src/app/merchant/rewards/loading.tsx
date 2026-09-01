import { LoadingRegion } from "@/components/kard/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function MerchantRewardsLoading() {
  return (
    <LoadingRegion label="Loading rewards">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </LoadingRegion>
  );
}
