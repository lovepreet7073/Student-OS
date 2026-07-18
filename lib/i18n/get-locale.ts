import { cache } from "react";

import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";

import { DEFAULT_LOCALE, isSupportedLocale, type Locale } from "./config";

/**
 * Server-side helper: reads the caller's UI locale from their preferences.
 * Falls back to `DEFAULT_LOCALE` for signed-out users or when the saved
 * locale is not (or no longer) supported.
 */
export const getUserLocale = cache(async (): Promise<Locale> => {
  const profile = await getMyProfile();
  if (!profile) return DEFAULT_LOCALE;
  return isSupportedLocale(profile.preferredLanguage)
    ? profile.preferredLanguage
    : DEFAULT_LOCALE;
});
