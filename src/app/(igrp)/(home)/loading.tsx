import { Skeleton } from "@igrp/igrp-framework-react-design-system";

/**
 * The route awaits six prefetches server-side, so without this the whole page
 * blocks on the slowest one with nothing on screen.
 *
 * It has to mirror `EnterpriseWorkspace` exactly, or the swap from skeleton to
 * content moves the layout under the user at the moment they are judging how
 * fast the app feels. Four mismatches were doing that: a tab strip that no
 * longer exists, three toolbar controls against the real four, a 2-column grid
 * where the real one is 1-column below 400px, and a full-width container
 * against the real `max-w-7xl` centred one.
 */
export default function HomeLoading() {
  return (
    <div className="h-(--home-scroll-h) lg:h-(--home-scroll-h-lg) overflow-hidden flex flex-col">
      <div className="flex min-h-0 w-full flex-1 flex-col mx-auto max-w-7xl">
        <div className="flex-1 flex flex-col gap-6 p-4 lg:p-6">
          {/* Welcome banner */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col lg:flex-row lg:items-center gap-5">
            <div className="flex-1 flex items-start gap-4">
              <Skeleton className="size-13 rounded-full shrink-0" />
              <div className="flex flex-col gap-2.5 min-w-0">
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-4 w-72" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <div className="flex gap-x-10 shrink-0">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>

          {/* Recently accessed */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-8 w-40" />
            </div>
            <div className="flex gap-3.5 overflow-hidden">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-17 w-69 shrink-0 rounded-xl" />
              ))}
            </div>
          </section>

          {/* Catalogue */}
          <section className="flex flex-col gap-3">
            <Skeleton className="h-5 w-40" />
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-10 w-full sm:w-75" />
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-44" />
              <Skeleton className="h-10 w-20 shrink-0 sm:ms-auto" />
            </div>
            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
