import type { Metadata } from "next";

import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { QuizGeneratorForm } from "@/features/quizzes/components/quiz-generator-form";

export const metadata: Metadata = { title: "New quiz" };

interface NewQuizPageProps {
  searchParams: Promise<{ subject?: string; topic?: string; mode?: string }>;
}

export default async function NewQuizPage({ searchParams }: NewQuizPageProps) {
  const [profile, params] = await Promise.all([getMyProfile(), searchParams]);
  if (!profile) return null;

  const prefillSubject =
    params.subject && profile.subjects.some((s) => s.id === params.subject)
      ? params.subject
      : undefined;
  const prefillMode = params.mode === "board_paper" ? "board_paper" : undefined;

  return (
    <QuizGeneratorForm
      subjects={profile.subjects}
      defaultSubjectId={prefillSubject}
      defaultTopic={params.topic}
      defaultMode={prefillMode}
    />
  );
}
