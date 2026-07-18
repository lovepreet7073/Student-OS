import type { QuizQuestionType } from "@/lib/gemini/prompts/quiz";

export type { QuizQuestionType };

export type QuizStatus = "in_progress" | "completed";

export type Quiz = {
  id: string;
  userId: string;
  boardId: string;
  classId: string;
  mediumId: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  questionTypes: QuizQuestionType[];
  totalQuestions: number;
  correctCount: number | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QuizQuestion = {
  id: string;
  quizId: string;
  ordinal: number;
  type: QuizQuestionType;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

export type QuizAnswer = {
  id: string;
  quizId: string;
  questionId: string;
  userAnswer: string;
  isCorrect: boolean | null;
  selfMarkedCorrect: boolean | null;
  answeredAt: string;
};

export type QuizWithQuestions = Quiz & {
  questions: QuizQuestion[];
  answers: Record<string, QuizAnswer>; // keyed by questionId
};

export type QuizListItem = Pick<
  Quiz,
  "id" | "topic" | "subjectId" | "subjectName" | "totalQuestions" | "correctCount" | "completedAt" | "createdAt"
>;
