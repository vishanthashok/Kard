import { CardListSkeleton, LoadingRegion } from "@/components/kard/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function MerchantDetailLoading() {
  return (
    <LoadingRegion label="Loading merchant">
      <div className="space-y-6">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-60 rounded-3xl" />
        <Skeleton className="h-5 w-36" />
        <CardListSkeleton cards={2} />
      </div>
    </LoadingRegion>
  );
}
