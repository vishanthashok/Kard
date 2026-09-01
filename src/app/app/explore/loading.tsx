import { CardListSkeleton, LoadingRegion } from "@/components/kard/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExploreLoading() {
  return (
    <LoadingRegion label="Loading nearby businesses">
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-56" />
        </div>
        <CardListSkeleton cards={5} />
      </div>
    </LoadingRegion>
  );
}
