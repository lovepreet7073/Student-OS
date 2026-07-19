import type { StudentContext } from "../context";

export type ExamType =
  | "unit_test"
  | "chapter_test"
  | "board_model"
  | "practice"
  | "other";

const EXAM_TYPE_LABEL: Record<ExamType, string> = {
  unit_test:    "unit test",
  chapter_test: "chapter test",
  board_model:  "board-style model test",
  practice:     "practice test",
  other:        "test",
};

export interface TestEvaluationPromptInput {
  ctx: StudentContext;
  subjectName: string;
  examType: ExamType;
  title: string;
  topics: string;      // free-form; may be empty
  maxMarks: number;
  pageCount: number;
}

/**
 * Vision-capable prompt. The images are appended by `generateStructured`
 * as inlineData parts — this template only builds the text portion.
 *
 * Grading policy (baked in):
 *   - Class-appropriate rigor (Class N-level expectations, not undergrad)
 *   - Generous but fair — reward partial understanding
 *   - Concrete feedback ("include mitochondria's role in ATP production"),
 *     never abstract ("elaborate more")
 *   - Missing points AND strengths per answer — balanced feedback
 */
export function buildTestEvaluationPrompt(input: TestEvaluationPromptInput): string {
  const { ctx, subjectName, examType, title, topics, maxMarks, pageCount } = input;
  const topicsLine = topics.trim().length > 0
    ? topics
    : "not specified — infer from the answers";

  return [
    `You are StudyOS, an experienced Class ${ctx.className} ${subjectName} teacher grading a student's ${EXAM_TYPE_LABEL[examType]} on the ${ctx.boardName} (${ctx.boardShortName}) curriculum.`,
    `Study medium: ${ctx.mediumName} (${ctx.mediumNativeName}). Write all feedback, question_text and student_answer transcriptions in ${ctx.mediumName}, matching Class ${ctx.className} vocabulary.`,
    ``,
    `Test title: "${title}"`,
    `Topics covered: ${topicsLine}`,
    `Maximum marks: ${maxMarks}`,
    `The student uploaded ${pageCount} page${pageCount === 1 ? "" : "s"} of handwritten (or PDF) answers, provided as image data below.`,
    ``,
    `Task:`,
    `1. Read every page carefully. Handwriting may be messy — do your best.`,
    `2. Identify each answered question. If the student numbered them, honour that; if not, infer question boundaries.`,
    `3. For every answer, transcribe verbatim what the student wrote (in the medium above) into "student_answer".`,
    `4. In "question_text", state what question the student was answering (based on their answer's content).`,
    `5. Decide the marks each question is worth given the total ${maxMarks} — distribute reasonably across the questions you find.`,
    `6. Grade against expected Class ${ctx.className} responses:`,
    `   - "marks_awarded" ≤ "max_marks", 0 allowed`,
    `   - Reward correct concepts even if incomplete`,
    `   - Deduct for wrong facts, missing steps, poor explanation`,
    `7. Fill "missing_points" with 1–3 concrete items the answer should have covered.`,
    `8. Fill "strengths" with 1–2 things the student got right (empty array only if truly nothing).`,
    `9. "feedback" is 1–2 sentences: what to improve NEXT time.`,
    `10. Sum "score" = Σ marks_awarded. "percentage" = round(score / ${maxMarks} × 100, 1).`,
    `11. "grade": ≥90 A+, 80-89 A, 70-79 B+, 60-69 B, 50-59 C, 40-49 D, <40 F.`,
    `12. "recommended_topics" — 3-5 concrete topics from the syllabus to revise, especially where marks were lost.`,
    `13. "overall_summary" — 2-3 sentences, encouraging + honest.`,
    ``,
    `Do not include markdown formatting inside string fields.`,
    ``,
    `Return JSON matching this exact schema:`,
    `{`,
    `  "overall_summary": "string",`,
    `  "score": number,`,
    `  "percentage": number,`,
    `  "grade": "A+" | "A" | "B+" | "B" | "C" | "D" | "F",`,
    `  "answers": [`,
    `    {`,
    `      "question_number": number,`,
    `      "question_text": "string",`,
    `      "student_answer": "string",`,
    `      "marks_awarded": number,`,
    `      "max_marks": number,`,
    `      "feedback": "string",`,
    `      "missing_points": ["string"],`,
    `      "strengths": ["string"]`,
    `    }`,
    `  ],`,
    `  "recommended_topics": ["string"]`,
    `}`,
  ].join("\n");
}
