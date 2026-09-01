import {
  BalanceCardSkeleton,
  LoadingRegion,
  MerchantCardSkeleton,
} from "@/components/kard/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerHomeLoading() {
  return (
    <LoadingRegion label="Loading your Kard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="size-10 rounded-full" />
        </div>

        <BalanceCardSkeleton />

        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>

        <div className="space-y-3">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 3 }, (_, index) => (
            <MerchantCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}
