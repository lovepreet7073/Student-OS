import { redirect } from "next/navigation";

import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Onboarding sits between "authenticated" and "onboarded". It requires a
 * user session but does NOT require an academic profile. This layout only
 * enforces the auth gate — the page itself checks profile completeness and
 * redirects onboarded users into the app.
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/onboarding");
  }
  return <>{children}</>;
}
