import type { Metadata } from "next";

import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { PlanCreatorForm } from "@/features/study-planner/components/plan-creator-form";

export const metadata: Metadata = { title: "New study plan" };

export default async function NewPlanPage() {
  const profile = await getMyProfile();
  if (!profile) return null;

  return <PlanCreatorForm subjects={profile.subjects} />;
}
