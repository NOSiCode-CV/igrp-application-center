import { Skeleton } from "@igrp/igrp-framework-react-design-system";

export default function Loading() {
  return (
    <div className="flex gap-4 p-4">
      <div className="flex flex-col gap-2 w-72">
        {Array.from({ length: 10 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
      <Skeleton className="h-96 flex-1" />
    </div>
  );
}
