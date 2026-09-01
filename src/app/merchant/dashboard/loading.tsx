import { LoadingRegion, StatGridSkeleton } from "@/components/kard/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function MerchantDashboardLoading() {
  return (
    <LoadingRegion label="Loading dashboard">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-64 rounded-xl" />
        </div>

        <StatGridSkeleton />

        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>

        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </LoadingRegion>
  );
}
