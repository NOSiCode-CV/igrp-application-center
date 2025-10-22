import { IGRPIcon } from "@igrp/igrp-framework-react-design-system";

export function AppCenterLoading({ descrption }: { descrption: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center py-10">
      <div className="text-center text-primary">
        <IGRPIcon
          iconName="LoaderCircle"
          strokeWidth={1}
          className="size-16 animate-spin mx-auto mb-4"
        />
        <p className="text-primary">{descrption}</p>
      </div>
    </div>
  );
}
