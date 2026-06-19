import { IGRPIcon } from "@igrp/igrp-framework-react-design-system";

export function AppCenterLoading({ description }: { description: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full flex items-center justify-center py-10"
    >
      <div className="text-center text-primary">
        <IGRPIcon
          iconName="LoaderCircle"
          strokeWidth={1}
          aria-hidden="true"
          className="size-16 animate-spin mx-auto mb-4"
        />
        <p className="text-primary">{description}</p>
      </div>
    </div>
  );
}
