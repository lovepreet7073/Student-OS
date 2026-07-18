import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ErrorState } from "@/components/shared/error-state";
import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { getReferenceData } from "@/features/academic-identity/actions/get-reference-data";
import { OnboardingWizard } from "@/features/academic-identity/components/onboarding-wizard";

export const metadata: Metadata = {
  title: "Set up your studies",
  description: "Personalise StudyOS for your board, class and medium.",
};

interface OnboardingPageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const { edit } = await searchParams;

  // Already onboarded → straight into the app, unless the user explicitly
  // asked to re-enter the wizard (Profile → Edit sends `?edit=1`).
  const existing = await getMyProfile();
  if (existing && edit !== "1") {
    redirect("/app/dashboard");
  }

  const reference = await getReferenceData();
  if (!reference.ok) {
    return (
      <main className="flex min-h-svh items-center justify-center px-4">
        <ErrorState
          title="Couldn't load setup"
          description={reference.error.message}
        />
      </main>
    );
  }

  return (
    <OnboardingWizard
      boards={reference.data.boards}
      mediums={reference.data.mediums}
      classes={reference.data.classes}
    />
  );
}
