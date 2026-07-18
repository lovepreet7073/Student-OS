import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getQuiz } from "@/features/quizzes/actions/get-quiz";
import { QuizResults } from "@/features/quizzes/components/quiz-results";
import { QuizTaker } from "@/features/quizzes/components/quiz-taker";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getQuiz(id);
  return { title: result.ok ? result.data.topic : "Quiz" };
}

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getQuiz(id);
  if (!result.ok) notFound();

  const quiz = result.data;
  return quiz.completedAt ? <QuizResults quiz={quiz} /> : <QuizTaker quiz={quiz} />;
}
