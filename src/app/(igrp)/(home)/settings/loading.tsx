import { Skeleton } from "@igrp/igrp-framework-react-design-system";

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-12" aria-busy="true">
      <section>
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-64 mt-2 mb-6" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </section>
    </div>
  );
}
