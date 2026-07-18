import { redirect } from "next/navigation";

import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import type { AcademicProfile } from "@/features/academic-identity/types";

/**
 * Route-level gate for `/app/*` layouts.
 *
 * Guarantees the caller is signed in AND has completed academic onboarding.
 * Returns the profile so downstream RSCs can use it without a second fetch
 * (React `cache()` on `getMyProfile` shares the query).
 *
 * Behavior:
 *   - No user           → redirect to /login
 *   - No profile        → redirect to /onboarding
 *   - Profile exists    → return profile
 */
export async function requireOnboardedProfile(): Promise<AcademicProfile> {
  const profile = await getMyProfile();
  if (!profile) {
    redirect("/onboarding");
  }
  return profile;
}
