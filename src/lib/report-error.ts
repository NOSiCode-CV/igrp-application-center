export type ReportErrorContext = {
  segment?: string;
  [key: string]: unknown;
};

export function reportError(error: unknown, context?: ReportErrorContext): void {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[reportError]', context?.segment ?? 'unknown', error, context);
      return;
    }
    const payload = {
      name: getStringField(error, 'name') ?? 'Error',
      message: getStringField(error, 'message') ?? 'Unknown error',
      digest: getStringField(error, 'digest'),
      code: getStringField(error, 'code'),
      context,
    };
    console.error('[reportError:prod]', payload);
  } catch {}
}

function getStringField(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = (value as Record<string, unknown>)[key];
  return typeof raw === 'string' ? raw : undefined;
}
