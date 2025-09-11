'use client';

import { IGRPGlobalError } from '@igrp/framework-next-ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <IGRPGlobalError
      error={error}
      reset={reset}
    />
  );
}
