import type { Locale } from "./config";
import type { Messages } from "./messages";

// Types `useTranslations` / `getTranslations` keys from the module default
// (`pt.json`): `tsc --noEmit` fails on any key that does not exist there.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
