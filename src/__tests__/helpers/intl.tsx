import type { ReactElement, ReactNode } from "react";

import { render } from "@testing-library/react";
import { type AbstractIntlMessages, NextIntlClientProvider } from "next-intl";

import type { Locale } from "@/i18n/config";
import { getMessageFallback, onIntlError } from "@/i18n/fallback";
import { getMessagesFor } from "@/i18n/messages";

/** Wraps `ui` in the same next-intl client context the root layout mounts. */
export function IntlWrapper({
  locale = "pt",
  messages,
  children,
}: {
  locale?: Locale;
  messages?: AbstractIntlMessages;
  children: ReactNode;
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages ?? getMessagesFor(locale)}
      onError={onIntlError}
      getMessageFallback={getMessageFallback}
    >
      {children}
    </NextIntlClientProvider>
  );
}

export function renderWithIntl(
  ui: ReactElement,
  options: { locale?: Locale; messages?: AbstractIntlMessages } = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <IntlWrapper locale={options.locale} messages={options.messages}>
        {children}
      </IntlWrapper>
    ),
  });
}
