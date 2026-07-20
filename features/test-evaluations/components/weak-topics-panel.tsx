import Link from "next/link";
import { BookText, Lightbulb, Sparkles } from "lucide-react";

interface WeakTopicsPanelProps {
  topics: string[];
  subjectId: string;
  subjectName: string;
}

/**
 * Weak-topic → revision loop (Module 22).
 *
 * The AI marks 3–8 short revision topics per test. Instead of showing them as
 * dead bullets, each becomes a card with two CTAs:
 *   - Find notes  → `/app/notes?subject=<id>&q=<topic>` — reuses the notes
 *                    ILIKE search so any note whose title/content matches
 *                    surfaces immediately.
 *   - Practice    → `/app/study/new?subject=<id>&topic=<topic>` — deep-links
 *                    into the quiz generator with subject + topic pre-filled.
 *
 * Both routes already exist; this component is pure composition. Nothing new
 * to persist — the recommendation lifecycle is: AI writes → student clicks
 * one of the CTAs → activity_events records the follow-through elsewhere.
 */
export function WeakTopicsPanel({ topics, subjectId, subjectName }: WeakTopicsPanelProps) {
  if (topics.length === 0) return null;

  return (
    <section
      aria-labelledby="weak-topics-title"
      className="rounded-xl border border-primary/30 bg-accent p-5"
    >
      <div className="mb-1 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-primary" aria-hidden />
        <h3
          id="weak-topics-title"
          className="text-[13px] font-bold uppercase tracking-wider text-accent-foreground"
        >
          Revise these topics
        </h3>
      </div>
      <p className="mb-3 text-[12px] text-muted-foreground">
        Tap a topic to jump into your notes or run a quick practice quiz.
      </p>
      <ul className="flex flex-col gap-2">
        {topics.map((topic, i) => {
          const notesHref = `/app/notes?subject=${encodeURIComponent(subjectId)}&q=${encodeURIComponent(topic)}`;
          const quizHref = `/app/study/new?subject=${encodeURIComponent(subjectId)}&topic=${encodeURIComponent(topic)}`;
          return (
            <li
              key={i}
              className="rounded-lg border border-border/70 bg-card p-3"
            >
              <div className="mb-2 text-[13.5px] font-bold text-foreground">
                {topic}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={notesHref}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-[11.5px] font-bold text-foreground transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <BookText className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
                  Find notes
                </Link>
                <Link
                  href={quizHref}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-2.5 text-[11.5px] font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
                  Practice quiz
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Scope: {subjectName}
      </p>
    </section>
  );
}
