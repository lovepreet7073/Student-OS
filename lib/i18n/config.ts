/**
 * Supported UI locales. Add new ones by:
 *   1. Adding the code here
 *   2. Adding a `messages/{code}.json` dictionary
 *   3. Adding a matching row in the `mediums` table (locale column)
 */
export const SUPPORTED_LOCALES = ["en", "pa", "hi"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * UI metadata for each locale — used by the onboarding language step and the
 * profile settings page. `released` flags whether the dictionary is ready to
 * ship; unreleased locales render as "Coming soon" and can't be selected.
 */
export type LocaleMeta = {
  code: Locale;
  name: string;       // display name in that language
  flag: string;       // emoji flag
  released: boolean;
};

export const LOCALE_METADATA: LocaleMeta[] = [
  { code: "en", name: "English",  flag: "🇬🇧", released: true },
  { code: "pa", name: "ਪੰਜਾਬੀ",   flag: "🇮🇳", released: true },
  { code: "hi", name: "हिन्दी",    flag: "🇮🇳", released: false },
];
