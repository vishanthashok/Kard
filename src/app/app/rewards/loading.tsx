import { CardListSkeleton, LoadingRegion } from "@/components/kard/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function RewardsLoading() {
  return (
    <LoadingRegion label="Loading rewards">
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <CardListSkeleton cards={4} />
      </div>
    </LoadingRegion>
  );
}
