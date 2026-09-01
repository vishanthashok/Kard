import { LoadingRegion, RowListSkeleton } from "@/components/kard/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function ActivityLoading() {
  return (
    <LoadingRegion label="Loading activity">
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-52" />
        </div>
        <RowListSkeleton rows={7} />
      </div>
    </LoadingRegion>
  );
}
