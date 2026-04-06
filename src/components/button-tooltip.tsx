import {
  IGRPButton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@igrp/igrp-framework-react-design-system";

type ButtonTooltipProps = React.ComponentProps<typeof IGRPButton> & {
  children: React.ReactNode;
  label?: string;
};

export function ButtonTooltip({
  children,
  label,
  ...props
}: ButtonTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <IGRPButton {...props}>{children}</IGRPButton>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
