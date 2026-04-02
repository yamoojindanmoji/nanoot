import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col flex-1 pb-24 bg-gray-50 relative min-h-screen">
      {/* Header Skeleton */}
      <header className="absolute top-0 left-0 w-full z-20 px-4 py-3 flex items-center justify-between">
        <div className="w-10 h-10 bg-black/10 backdrop-blur-md rounded-full flex items-center justify-center text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </div>
      </header>

      {/* Main Image Skeleton */}
      <Skeleton className="w-full aspect-square rounded-none bg-gray-200" />

      {/* Content Skeleton */}
      <div className="bg-white px-5 pt-6 pb-8">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-16 rounded-sm" />
          <Skeleton className="h-4 w-24 rounded-sm" />
        </div>
        <Skeleton className="h-7 w-full mb-3" />
        <Skeleton className="h-7 w-2/3 mb-6" />
        <Skeleton className="h-20 w-full" />
      </div>

      {/* Progress Skeleton */}
      <div className="mt-2 bg-white px-5 py-6">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <Skeleton className="w-full h-3 rounded-full mb-4" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button Skeleton */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-white border-t border-gray-100 p-4 pb-8 z-30">
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </div>
  );
}
