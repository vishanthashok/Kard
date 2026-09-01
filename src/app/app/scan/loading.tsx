import { LoadingRegion } from "@/components/kard/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function ScanLoading() {
  return (
    <LoadingRegion label="Loading your Kard code">
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-[420px] rounded-3xl" />
      </div>
    </LoadingRegion>
  );
}
