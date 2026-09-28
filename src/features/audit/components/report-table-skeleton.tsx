import { Skeleton } from "@igrp/igrp-framework-react-design-system";

export function ReportTableSkeleton() {
  return (
    <div className="flex flex-col gap-2" role="status" aria-busy="true">
      <span className="sr-only">A carregar eventos…</span>
      {Array.from({ length: 8 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
