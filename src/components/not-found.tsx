import { IGRPIcon, IGRPIconProps } from '@igrp/igrp-framework-react-design-system';

export interface AppCenterNotFoundProps {
  iconName: IGRPIconProps['iconName'];
  title: string;
  children?: React.ReactNode;
  // imagURL?: string;
}

export function AppCenterNotFound({ iconName, title, children }: AppCenterNotFoundProps) {
  return (
    <div className='flex flex-col items-center py-10'>
      <IGRPIcon
        iconName={iconName}
        strokeWidth={0.2}
        className='size-50'
      />
      <div className='text-center'>
        <div className='text-xl font-medium tracking-tight'>{title}</div>
        <div className='text-lg font-light tracking-tight'>{children}</div>
      </div>
    </div>
  );
}
