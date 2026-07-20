export type DoubtStatus = "processing" | "answered" | "failed";

export interface Doubt {
  id: string;
  subjectId: string | null;
  question: string;
  answer: string;
  status: DoubtStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}
