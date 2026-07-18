import type { StudentContext } from "../context";

export interface StudyPlanPromptInput {
  ctx: StudentContext;
  focusSubjects: string[];  // subject names the plan should concentrate on
  goal: string;              // free-form "Board exam prep", "Weekly review", etc.
  startDate: string;         // YYYY-MM-DD
  endDate: string;           // YYYY-MM-DD (inclusive)
  daysCount: number;         // computed from range
  dailyHours: number;        // 1..10
}

/**
 * The AI plan is returned as day-relative offsets ("day 0 = start_date").
 * We convert offsets to actual dates when persisting, so the AI doesn't need
 * to reason about the calendar.
 */
export function buildStudyPlanPrompt(input: StudyPlanPromptInput): string {
  const {
    ctx,
    focusSubjects,
    goal,
    startDate,
    endDate,
    daysCount,
    dailyHours,
  } = input;

  const totalDailyMinutes = dailyHours * 60;
  const subjectsLine =
    focusSubjects.length > 0 ? focusSubjects.join(", ") : ctx.subjectNames.join(", ");
  const goalLine = goal.trim().length > 0 ? goal : "Balanced revision across all subjects";

  return [
    `You are StudyOS, an AI study planner for a Class ${ctx.className} student on the ${ctx.boardName} (${ctx.boardShortName}) curriculum.`,
    `Study medium: ${ctx.mediumName} (${ctx.mediumNativeName}). Generate all topic names and notes in ${ctx.mediumName}. Use Class ${ctx.className}-appropriate vocabulary.`,
    ``,
    `Focus subjects: ${subjectsLine}.`,
    `Goal: ${goalLine}.`,
    `Plan window: ${startDate} to ${endDate} (${daysCount} days inclusive).`,
    `Study time per day: ${dailyHours} hour(s) = ${totalDailyMinutes} minutes.`,
    ``,
    `Rules:`,
    `- Generate exactly ${daysCount} days of sessions, day_offset from 0 (= ${startDate}) to ${daysCount - 1} (= ${endDate}).`,
    `- Each day has 1–4 sessions. Each session covers ONE topic on ONE subject.`,
    `- Each session duration_minutes is between 20 and 90 minutes, in multiples of 5.`,
    `- The sum of durations for a day should be close to ${totalDailyMinutes} minutes (± 15).`,
    `- Rotate subjects across days — don't cluster the same subject on consecutive days.`,
    `- Order sessions within a day from harder → easier (hardest first).`,
    `- "notes" is 1–2 sentences of concrete guidance (what to focus on, common pitfalls). Never repeat the topic name.`,
    `- "subject_name" must be one of: ${subjectsLine}. Exact spelling required.`,
    `- Do not include markdown formatting inside strings.`,
    ``,
    `Return JSON matching this exact shape:`,
    `{`,
    `  "days": [`,
    `    {`,
    `      "day_offset": 0,`,
    `      "sessions": [`,
    `        {`,
    `          "subject_name": "string",`,
    `          "topic": "string",`,
    `          "duration_minutes": 45,`,
    `          "notes": "string"`,
    `        }`,
    `      ]`,
    `    }`,
    `  ]`,
    `}`,
  ].join("\n");
}
