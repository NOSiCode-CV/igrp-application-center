import { IGRPTemplateLoading } from '@igrp/framework-next-ui';

export default function Loading() {
  const appCode = process.env.IGRP_APP_CODE || '';

  return <IGRPTemplateLoading appCode={appCode} />;
}
