import { AppShell } from "@/components/layout/app-shell";
import { AcademicProfileProvider } from "@/features/academic-identity/hooks/use-academic-profile";
import { requireOnboardedProfile } from "@/lib/academic/assert-onboarded";

/**
 * Protected app shell.
 *
 * Guards:
 *   - Middleware ensures the user is authenticated for `/app/*`.
 *   - `requireOnboardedProfile()` server-side ensures the user has completed
 *     onboarding — redirects to `/onboarding` if not.
 *
 * The resolved profile is threaded via `<AcademicProfileProvider>` so any
 * client component under `/app/*` can call `useAcademicProfile()` without a
 * round-trip. `<AppShell>` renders the desktop sidebar and mobile bottom nav.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireOnboardedProfile();

  return (
    <AcademicProfileProvider profile={profile}>
      <AppShell>{children}</AppShell>
    </AcademicProfileProvider>
  );
}
