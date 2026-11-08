import { Skeleton } from "@/components/ui/skeleton";
import { Page } from "./PageHeader";

export function PageSkeleton() {
  return (
    <Page>
      <Skeleton className="mb-2 h-7 w-48" />
      <Skeleton className="mb-8 h-4 w-72" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[92px] rounded-lg" />
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-lg lg:col-span-2" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </Page>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-px overflow-hidden rounded-lg border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 bg-card px-4 py-3">
          <Skeleton className="size-6 rounded-md" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="size-6 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function BoardSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="w-[280px] shrink-0 space-y-2">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 3 - (i % 2) }).map((_, j) => (
            <Skeleton key={j} className="h-[104px] rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <Skeleton key={i} className="h-[168px] rounded-lg" />
      ))}
    </div>
  );
}
