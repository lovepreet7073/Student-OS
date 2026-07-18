import { getRequestConfig } from "next-intl/server";

import { DEFAULT_LOCALE, isSupportedLocale, type Locale } from "@/lib/i18n/config";
import { getUserLocale } from "@/lib/i18n/get-locale";

/**
 * next-intl entry — no URL-based locale routing.
 * The locale is resolved from the user's saved `preferred_language`.
 * Anonymous / pre-onboarded users see `DEFAULT_LOCALE`.
 */
export default getRequestConfig(async () => {
  const requested = await getUserLocale();
  const locale: Locale = isSupportedLocale(requested) ? requested : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`./lib/i18n/messages/${locale}.json`)).default,
  };
});
