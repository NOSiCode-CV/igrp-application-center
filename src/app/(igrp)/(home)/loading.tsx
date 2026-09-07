import { Skeleton } from "@igrp/igrp-framework-react-design-system";

/**
 * The route awaits six prefetches server-side, so without this the whole page
 * blocks on the slowest one with nothing on screen. Mirrors the launcher's
 * shape: banner, recents row, catalogue toolbar and grid.
 */
export default function HomeLoading() {
  return (
    <div className="h-(--home-scroll-h) lg:h-(--home-scroll-h-lg) overflow-hidden flex flex-col">
      <div className="border-b border-border px-4">
        <div className="flex gap-6 py-3.5">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 p-4 lg:p-6">
        {/* Welcome banner */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col lg:flex-row lg:items-center gap-5">
          <div className="flex-1 flex items-center gap-4">
            <Skeleton className="size-13 rounded-full shrink-0" />
            <div className="flex flex-col gap-2.5 min-w-0">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="flex gap-7 shrink-0">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Recently accessed */}
        <section className="flex flex-col gap-3">
          <Skeleton className="h-4 w-36" />
          <div className="flex gap-3.5 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-17 w-69 shrink-0 rounded-xl" />
            ))}
          </div>
        </section>

        {/* Catalogue */}
        <section className="flex flex-col gap-3">
          <Skeleton className="h-4 w-32" />
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-10 w-75" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-44" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
