"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Subject } from "@/features/academic-identity/types";
import { cn } from "@/lib/utils";

import { generatePlan } from "../actions/generate-plan";
import { todayIsoDate } from "../lib/dates";
import { generatePlanSchema, type GeneratePlanInput } from "../schemas/plan";

interface PlanCreatorFormProps {
  subjects: Subject[];
}

const HOUR_OPTIONS = [1, 2, 3, 4];

export function PlanCreatorForm({ subjects }: PlanCreatorFormProps) {
  const router = useRouter();

  const today = todayIsoDate();
  const oneWeek = addDaysStr(today, 7);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<GeneratePlanInput>({
    resolver: zodResolver(generatePlanSchema),
    defaultValues: {
      title: "Week ahead",
      goal: "",
      startDate: today,
      endDate: oneWeek,
      dailyHours: 2,
      focusSubjectIds: subjects.slice(0, 3).map((s) => s.id),
    },
  });

  const dailyHours = useWatch({ control, name: "dailyHours" });
  const focusSubjectIds = useWatch({ control, name: "focusSubjectIds" });

  const toggleSubject = (id: string) => {
    const current = new Set(focusSubjectIds);
    if (current.has(id)) {
      if (current.size === 1) return;
      current.delete(id);
    } else {
      current.add(id);
    }
    setValue("focusSubjectIds", Array.from(current), { shouldValidate: true });
  };

  async function onSubmit(values: GeneratePlanInput) {
    const result = await generatePlan(values);
    if (!result.ok) {
      if (result.error.code === "AI") {
        toast.error(result.error.message, {
          description: "Try a narrower date range or fewer focus subjects.",
        });
      } else {
        toast.error(result.error.message);
      }
      return;
    }
    router.push(`/app/planner/${result.data.id}`);
  }

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 pt-4 sm:px-7 sm:pt-6 lg:px-11 lg:pt-8">
      <nav aria-label="Back to planner" className="mb-6 flex items-center gap-3">
        <Button asChild variant="outline" size="icon" aria-label="Back">
          <Link href="/app/planner">
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
          </Link>
        </Button>
        <h1 className="text-[22px] font-extrabold tracking-tight sm:text-[26px]">
          New study plan
        </h1>
      </nav>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Plan title</Label>
          <Input
            id="title"
            placeholder="e.g. Board exam final week"
            invalid={!!errors.title}
            aria-describedby={errors.title ? "title-error" : undefined}
            {...register("title")}
          />
          {errors.title ? (
            <p id="title-error" role="alert" className="text-xs font-bold text-danger">
              {errors.title.message}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="startDate">Start</Label>
            <Input
              id="startDate"
              type="date"
              invalid={!!errors.startDate}
              {...register("startDate")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="endDate">End</Label>
            <Input
              id="endDate"
              type="date"
              invalid={!!errors.endDate}
              aria-describedby={errors.endDate ? "endDate-error" : undefined}
              {...register("endDate")}
            />
          </div>
          {errors.endDate ? (
            <p id="endDate-error" role="alert" className="col-span-2 text-xs font-bold text-danger">
              {errors.endDate.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Hours per day</Label>
          <div className="grid grid-cols-4 gap-2.5">
            {HOUR_OPTIONS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setValue("dailyHours", h, { shouldValidate: true })}
                className={cn(
                  "flex h-14 flex-col items-center justify-center rounded-md border font-extrabold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  dailyHours === h
                    ? "border-2 border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/40",
                )}
                aria-pressed={dailyHours === h}
              >
                <span className="text-xl leading-none">{h}</span>
                <span className="mt-1 text-[10px] uppercase tracking-wider opacity-70">hrs</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Focus subjects</Label>
          <p className="text-xs text-muted-foreground">
            The plan will concentrate on these. Pick 1–5.
          </p>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => {
              const on = focusSubjectIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSubject(s.id)}
                  className={cn(
                    "inline-flex h-10 items-center rounded-full px-4 text-[13.5px] font-bold transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    on
                      ? "border-2 border-primary bg-accent text-accent-foreground"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                  aria-pressed={on}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
          {errors.focusSubjectIds ? (
            <p role="alert" className="text-xs font-bold text-danger">
              {errors.focusSubjectIds.message as string}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="goal">Goal (optional)</Label>
          <Textarea
            id="goal"
            rows={3}
            placeholder="e.g. Cover all NCERT chapters and revise past papers before pre-boards."
            {...register("goal")}
          />
        </div>

        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          {isSubmitting ? "Generating your plan…" : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden />
              Generate plan
            </>
          )}
        </Button>

        {isSubmitting ? (
          <p className="text-center text-xs text-muted-foreground">
            AI is thinking. This usually takes 15–40 seconds.
          </p>
        ) : null}
      </form>
    </div>
  );
}

function addDaysStr(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}
