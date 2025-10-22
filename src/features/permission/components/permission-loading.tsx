import { IGRPSkeletonPrimitive } from "@igrp/igrp-framework-react-design-system";

// TODO: do this with Skeleton component
export function PermissionLoading() {
  return (
    <div className="grid gap-4 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <IGRPSkeletonPrimitive key={i} className="h-12 rounded-lg bg-muted" />
      ))}
    </div>
  );
}
