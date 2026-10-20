import type { IGRPLocale } from "@igrp/framework-next/i18n";
import type { IGRPFrameworkMessages } from "@igrp/framework-next/i18n/messages";

import type pt from "./messages/pt.json";

// Types `useTranslations` / `getTranslations` keys from pt.json (the complete
// catalog) plus the framework's generic namespaces: `tsc` fails on unknown keys.
declare module "next-intl" {
  interface AppConfig {
    Locale: IGRPLocale;
    Messages: typeof pt & IGRPFrameworkMessages;
  }
}
