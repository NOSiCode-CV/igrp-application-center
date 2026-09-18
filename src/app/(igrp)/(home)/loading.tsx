import { Skeleton } from "@igrp/igrp-framework-react-design-system";

export default function HomeLoading() {
  return (
    <div className="flex flex-col">
      <div className="flex w-full flex-col mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 p-4">         
          <div className="rounded-xl border border-border bg-card p-5 flex min-w-0 gap-4">
            <Skeleton className="size-13 rounded-full shrink-0" />
            <div className="flex flex-col gap-2.5 min-w-0">
              <Skeleton className="h-5 w-56" />              
              <div className="flex flex-wrap items-center gap-1.5">
                <Skeleton className="h-5.5 w-16 rounded-full" />
                <Skeleton className="h-5.5 w-32 rounded-full" />
              </div>
            </div>
          </div>

          {/* Recently accessed */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-8 w-40" />
            </div>           
            <div className="flex gap-3.5 overflow-hidden">
              {[0, 1, 2].map((i) => (
                <Skeleton
                  key={i}
                  className="h-17 basis-69 grow shrink-0 rounded-xl"
                />
              ))}
            </div>
          </section>

          {/* Catalogue */}
          <section className="flex flex-col gap-3">
            <Skeleton className="h-5 w-40" />           
            <div className="flex flex-wrap items-end gap-2">
              <Skeleton className="h-10 w-full sm:w-75" />
              <Skeleton className="h-10 w-28" />
              <div className="flex w-full min-w-0 flex-col gap-2 sm:w-56">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
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
