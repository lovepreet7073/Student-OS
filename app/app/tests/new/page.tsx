import type { Metadata } from "next";

import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { EvaluationCreatorForm } from "@/features/test-evaluations/components/evaluation-creator-form";

export const metadata: Metadata = { title: "Grade a test" };

export default async function NewEvaluationPage() {
  const profile = await getMyProfile();
  if (!profile) return null;
  return <EvaluationCreatorForm subjects={profile.subjects} />;
}
