import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export default function MediaDetailLoading() {
  return (
    <div>
      {/* Hero skeleton */}
      <div className="relative -mx-4 lg:-mx-6 -mt-4 lg:-mt-6 mb-8">
        <Skeleton className="h-[320px] sm:h-[400px] lg:h-[450px] w-full rounded-none" />
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-6 w-32" />
          <SkeletonText lines={5} />
          <div className="mt-8 space-y-3">
            <Skeleton className="h-6 w-24" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
