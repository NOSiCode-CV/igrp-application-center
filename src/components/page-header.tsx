import { BackButton } from '@/components/back-button';

interface PageHeaderProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  linkBackButton?: string;
  showActions?: boolean;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  showBackButton = false,
  linkBackButton = '/',
  showActions = false,
  children,
}: PageHeaderProps) {
  return (
    <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-2 min-w-0'>
          {showBackButton && <BackButton href={linkBackButton} />}

          <div className='flex flex-col min-w-0'>
            <h2 className='text-2xl font-bold tracking-tight truncate'>{title}</h2>

            {description && <p className='text-muted-foreground text-sm'>{description}</p>}
          </div>
        </div>
      </div>
      {showActions && (
        <div className='flex flex-col sm:flex-row sm:items-center gap-2'>{children}</div>
      )}
    </div>
  );
}
