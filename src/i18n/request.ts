import { igrpCreateRequestConfig } from "@igrp/framework-next/i18n/server";
import { getRequestConfig } from "next-intl/server";

import { i18n } from "./index";
import en from "./messages/en.json";
import fr from "./messages/fr.json";
import pt from "./messages/pt.json";

// Registered by createNextIntlPlugin in next.config.ts. The locale is resolved
// per request (cookie → session → Accept-Language → default), never from the URL.
export default getRequestConfig(igrpCreateRequestConfig(i18n, { pt, en, fr }));
