import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookText,
  Check,
  ClipboardList,
  GraduationCap,
  Sparkles,
} from "lucide-react";

import { listExams } from "@/features/exams/actions/list-exams";
import { getWorkspaceOverview } from "@/features/workspace/actions/get-workspace-overview";
import { cn } from "@/lib/utils";

/**
 * "Get started in 60 seconds" checklist on Today (Module 62).
 *
 * Renders ONLY for brand-new students — nothing to see once they've
 * hit any of the four milestones. Each step's "done" state is derived
 * from real data (a note exists, a task exists, an exam exists, a
 * chat exists) rather than a separate onboarding_progress table.
 * Cheaper, honest, and self-heals if a student deletes everything and
 * comes back — the checklist reappears.
 *
 * The section hides itself the moment the student is unambiguously NOT
 * new (any of the four exists). We deliberately don't wait for all
 * four to complete — one step is enough to prove the student
 * understands the app; the rest belong in normal flow.
 */

interface Step {
  key: string;
  done: boolean;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export async function GetStartedChecklist() {
  const [overview, examsResult] = await Promise.all([
    getWorkspaceOverview(),
    listExams({ includePast: false, limit: 1 }),
  ]);
  if (!overview.ok) return null;

  const data = overview.data;
  const examCount = examsResult.ok ? examsResult.data.length : 0;

  const steps: Step[] = [
    {
      key: "exam",
      done: examCount > 0,
      label: "Set an exam date",
      description: "So Today can count down for you.",
      href: "/app/profile",
      icon: GraduationCap,
    },
    {
      key: "note",
      done: data.notes > 0,
      label: "Write your first note",
      description: "Anything — a definition, a formula, class notes.",
      href: "/app/notes/new",
      icon: BookText,
    },
    {
      key: "task",
      done: data.tasks.total > 0,
      label: "Add a task",
      description: "One thing you'll finish today or tomorrow.",
      href: "/app/tasks",
      icon: ClipboardList,
    },
    {
      key: "chat",
      done: data.chatConversations > 0,
      label: "Try the AI",
      description: "Ask it to explain a concept in your subject.",
      href: "/app/chat/new",
      icon: Sparkles,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  // Hide once the student has hit any milestone — they're not new
  // anymore. One completion is enough to prove the student found their
  // footing; the rest happen in normal flow.
  if (doneCount > 0) return null;

  return (
    <section
      aria-label="Get started"
      className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-5 shadow-sm"
    >
      <div className="mb-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
          Get started
        </div>
        <h2 className="mt-1 text-[18px] font-extrabold tracking-tight">
          Set up in 60 seconds
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Do any one of these and Today starts telling you what to study.
        </p>
      </div>

      <ol className="flex flex-col gap-2">
        {steps.map((step, i) => (
          <li key={step.key}>
            <Link
              href={step.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors",
                "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                step.done && "opacity-50",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold",
                  step.done
                    ? "bg-success/15 text-success"
                    : "bg-accent text-primary",
                )}
              >
                {step.done ? (
                  <Check className="h-4 w-4" strokeWidth={2.4} />
                ) : (
                  i + 1
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-1.5">
                  <step.icon
                    className="h-3.5 w-3.5 text-muted-foreground/80"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      "text-[14px] font-extrabold tracking-tight",
                      step.done && "line-through",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {step.description}
                </p>
              </div>
              <ArrowRight
                className="h-[18px] w-[18px] flex-shrink-0 text-muted-foreground/70 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2}
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
