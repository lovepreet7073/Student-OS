import type { ExamType } from "@/lib/gemini/prompts/test-evaluation";

export type { ExamType };

export type EvaluationStatus = "pending" | "evaluating" | "completed" | "failed";

export type EvaluationGrade = "A+" | "A" | "B+" | "B" | "C" | "D" | "F";

export type EvaluationAnswer = {
  question_number: number;
  question_text: string;
  student_answer: string;
  marks_awarded: number;
  max_marks: number;
  feedback: string;
  missing_points: string[];
  strengths: string[];
};

export type EvaluationPage = {
  id: string;
  evaluationId: string;
  pageNumber: number;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type TestEvaluation = {
  id: string;
  userId: string;
  boardId: string;
  classId: string;
  mediumId: string;
  subjectId: string;
  subjectName: string;
  title: string;
  examType: ExamType;
  maxMarks: number;
  topics: string | null;
  status: EvaluationStatus;
  aiScore: number | null;
  aiPercentage: number | null;
  aiGrade: EvaluationGrade | null;
  aiSummary: string | null;
  answers: EvaluationAnswer[] | null;
  recommendedTopics: string[] | null;
  errorMessage: string | null;
  evaluatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TestEvaluationWithPages = TestEvaluation & {
  pages: EvaluationPage[];
};

export type TestEvaluationListItem = Pick<
  TestEvaluation,
  "id" | "title" | "examType" | "subjectId" | "subjectName" | "status" |
  "aiScore" | "aiPercentage" | "aiGrade" | "maxMarks" | "createdAt"
>;

export type BeginEvaluationPageInput = {
  pageNumber: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type BeginEvaluationOutput = {
  evaluationId: string;
  bucket: string;
  pages: {
    pageNumber: number;
    storagePath: string;
  }[];
};
