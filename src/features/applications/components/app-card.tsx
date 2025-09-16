import {
  IGRPBadgePrimitive,
  IGRPIcon,
  IGRPCardPrimitive,
  IGRPCardContentPrimitive,
  IGRPCardFooterPrimitive,
  IGRPCardHeaderPrimitive,
  IGRPCardTitlePrimitive,
  IGRPCardDescriptionPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPApplicationArgs } from '@igrp/framework-next-types';

import { cn, showStatus, statusClass } from '@/lib/utils';
import { ButtonTooltip } from '@/components/button-tooltip';
import { formatSlug } from '@/features/applications/app-utils';
import { ROUTES } from '@/lib/constants';

// TODO: see picture if exists

export function ApplicationCard({ app }: { app: IGRPApplicationArgs }) {
  const { name, code, status, description, slug, url } = app;
  const href = slug ? formatSlug(slug) : url;

  return (
    <IGRPCardPrimitive className='overflow-hidden card-hover gap-3 pt-4 pb-2 justify-between'>
      <IGRPCardHeaderPrimitive className='px-4 pb-0'>
        <div className='flex items-start justify-between'>
          <div className='flex items-start'>
            <div className='mr-2 rounded-md bg-primary/10 p-2'>
              <IGRPIcon
                iconName='AppWindow'
                className='text-primary'
              />
            </div>
            <div>
              <IGRPCardTitlePrimitive className='text-base line-clamp-2'>
                {name}
              </IGRPCardTitlePrimitive>
              <IGRPCardDescriptionPrimitive className='text-xs'>
                {code}
              </IGRPCardDescriptionPrimitive>
            </div>
          </div>
        </div>
      </IGRPCardHeaderPrimitive>
      <IGRPCardContentPrimitive className='px-4'>
        <p className='text-sm text-muted-foreground line-clamp-2 h-10'>
          {description || 'Sem descrição.'}
        </p>
      </IGRPCardContentPrimitive>
      <IGRPCardFooterPrimitive className='flex items-center justify-between px-4'>
        <div className='flex items-center'>
          <IGRPBadgePrimitive className={cn(statusClass(status), 'capitalize')}>
            {showStatus(status)}
          </IGRPBadgePrimitive>
        </div>
        <div className='flex items-center gap-1'>
          <ButtonTooltip
            href={`${ROUTES.APPS}/${code}`}
            icon='Eye'
            label='Ver'
          />
          <ButtonTooltip
            href={`${ROUTES.APPS}/${code}/editar`}
            icon='SquarePen'
            label='Editar'
          />
          <ButtonTooltip
            href={href || ''}
            icon='ExternalLink'
            label='Abrir'
          />
        </div>
      </IGRPCardFooterPrimitive>
    </IGRPCardPrimitive>
  );
}
