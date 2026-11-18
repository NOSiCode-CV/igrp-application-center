import type { ReactElement, ReactNode } from "react";

import type { IGRPLocale } from "@igrp/framework-next/i18n";
import { IGRPIntlTestProvider } from "@igrp/framework-next/i18n/testing";
import { render } from "@testing-library/react";
import type { AbstractIntlMessages } from "next-intl";

import en from "@/i18n/messages/en.json";
import fr from "@/i18n/messages/fr.json";
import pt from "@/i18n/messages/pt.json";

// Built once: a new object per render would make every consumer re-render.
const CATALOGS = { pt, en, fr };

/** Wraps `ui` in the same next-intl client context the root layout mounts. */
export function IntlWrapper({
  locale = "pt",
  messages,
  children,
}: {
  locale?: IGRPLocale;
  messages?: AbstractIntlMessages;
  children: ReactNode;
}) {
  return (
    <IGRPIntlTestProvider
      locale={locale}
      timeZone="Atlantic/Cape_Verde"
      messages={messages ? { [locale]: messages } : CATALOGS}
    >
      {children}
    </IGRPIntlTestProvider>
  );
}

export function renderWithIntl(
  ui: ReactElement,
  options: { locale?: IGRPLocale; messages?: AbstractIntlMessages } = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <IntlWrapper locale={options.locale} messages={options.messages}>
        {children}
      </IntlWrapper>
    ),
  });
}
