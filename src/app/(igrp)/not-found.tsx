import { IGRPTemplateNotFound } from '@igrp/framework-next-ui';

export default function NotFound() {
  const appCode = process.env.IGRP_APP_CODE || '';

  return <IGRPTemplateNotFound appCode={appCode} />;
}
