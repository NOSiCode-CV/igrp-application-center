import { Skeleton } from "@igrp/igrp-framework-react-design-system";

export function ReportTableSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true">
      {Array.from({ length: 8 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
