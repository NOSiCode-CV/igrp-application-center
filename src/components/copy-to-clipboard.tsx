'use client';

import { useState } from 'react';
import {
  IGRPButtonPrimitive,
  IGRPTooltipPrimitive,
  IGRPTooltipContentPrimitive,
  IGRPTooltipProviderPrimitive,
  IGRPTooltipTriggerPrimitive,
  IGRPIcon,
  useIGRPToast,
} from '@igrp/igrp-framework-react-design-system';
import { cn } from '@/lib/utils';

interface CopyToClipboardProps {
  value: string;
  className?: string;
}

// TODO: Move to design-system package

export function CopyToClipboard({ value }: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false);
  const { igrpToast } = useIGRPToast();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      const displayValue = value.length > 50 ? `${value.substring(0, 47)}...` : value;

      setCopied(true);
      igrpToast({
        type: 'success',
        title: 'Copiado para a área de transferência',
        description: displayValue,
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      igrpToast({
        type: 'error',
        title: 'Não foi possível copiar para a área de transferência',
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.',
        duration: 2000,
      });
    }
  }

  return (
    <IGRPTooltipProviderPrimitive delayDuration={350}>
      <IGRPTooltipPrimitive>
        <IGRPTooltipTriggerPrimitive asChild>
          <IGRPButtonPrimitive
            variant='ghost'
            size='icon'
            className='disabled:opacity-100 size-7'
            onClick={handleCopy}
            aria-label={copied ? 'Copiado' : 'Copiar para a área de transferênciawwwww'}
            disabled={copied}
          >
            <div
              className={cn(
                'transition-all',
                copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
              )}
            >
              <IGRPIcon
                iconName='Check'
                className='stroke-primary size'
                aria-hidden='true'
                strokeWidth={2}
              />
            </div>
            <div
              className={cn(
                'absolute transition-all',
                copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
              )}
            >
              <IGRPIcon
                iconName='Copy'
                aria-hidden='true'
                strokeWidth={2}
                className='size-3'
              />
            </div>
          </IGRPButtonPrimitive>
        </IGRPTooltipTriggerPrimitive>
        <IGRPTooltipContentPrimitive className='px-2 py-1 text-xs'>
          Clique para copiar
        </IGRPTooltipContentPrimitive>
      </IGRPTooltipPrimitive>
    </IGRPTooltipProviderPrimitive>
  );
}
