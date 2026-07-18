import type { Metadata } from "next";

import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { QuizGeneratorForm } from "@/features/quizzes/components/quiz-generator-form";

export const metadata: Metadata = { title: "New quiz" };

export default async function NewQuizPage() {
  const profile = await getMyProfile();
  if (!profile) return null;

  return <QuizGeneratorForm subjects={profile.subjects} />;
}
