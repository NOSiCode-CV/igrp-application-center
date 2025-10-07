import {
  IGRPTooltipPrimitive,
  IGRPTooltipContentPrimitive,
  IGRPTooltipProviderPrimitive,
  IGRPTooltipTriggerPrimitive,
  IGRPButton,
} from '@igrp/igrp-framework-react-design-system';

type ButtonTooltipProps = React.ComponentProps<typeof IGRPButton> & {
  children: React.ReactNode;
  label?: string;
};

export function ButtonTooltip({ children, label, ...props }: ButtonTooltipProps) {
  return (
    <IGRPTooltipProviderPrimitive>
      <IGRPTooltipPrimitive>
        <IGRPTooltipTriggerPrimitive asChild>
          <IGRPButton {...props}>{children}</IGRPButton>
        </IGRPTooltipTriggerPrimitive>
        <IGRPTooltipContentPrimitive>
          <p>{label}</p>
        </IGRPTooltipContentPrimitive>
      </IGRPTooltipPrimitive>
    </IGRPTooltipProviderPrimitive>
  );
}
