export interface Exam {
  id: string;
  subjectId: string | null;
  subjectName: string | null;
  name: string;
  examDate: string; // YYYY-MM-DD
  notes: string | null;
  daysUntil: number; // negative for past
  createdAt: string;
}
