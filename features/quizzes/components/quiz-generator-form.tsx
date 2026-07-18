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
import type { Subject } from "@/features/academic-identity/types";
import { cn } from "@/lib/utils";

import { generateQuiz } from "../actions/generate-quiz";
import {
  generateQuizSchema,
  type GenerateQuizInput,
} from "../schemas/quiz";
import type { QuizQuestionType } from "../types";

interface QuizGeneratorFormProps {
  subjects: Subject[];
}

const QUESTION_TYPE_META: {
  key: QuizQuestionType;
  label: string;
  hint: string;
}[] = [
  { key: "mcq",           label: "Multiple choice",  hint: "4 options" },
  { key: "true_false",    label: "True / False",     hint: "Two choices" },
  { key: "fill_blank",    label: "Fill in the blank",hint: "Short word" },
  { key: "short_answer",  label: "Short answer",     hint: "1–3 sentences" },
];

const COUNT_OPTIONS = [5, 10, 15];

export function QuizGeneratorForm({ subjects }: QuizGeneratorFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<GenerateQuizInput>({
    resolver: zodResolver(generateQuizSchema),
    defaultValues: {
      subjectId: subjects[0]?.id ?? "",
      topic: "",
      questionCount: 10,
      questionTypes: ["mcq"],
    },
  });

  const selectedTypes = useWatch({ control, name: "questionTypes" });
  const selectedCount = useWatch({ control, name: "questionCount" });

  const toggleType = (type: QuizQuestionType) => {
    const current = new Set(selectedTypes);
    if (current.has(type)) {
      if (current.size === 1) return; // keep at least one selected
      current.delete(type);
    } else {
      current.add(type);
    }
    setValue("questionTypes", Array.from(current), { shouldValidate: true });
  };

  async function onSubmit(values: GenerateQuizInput) {
    const result = await generateQuiz(values);
    if (!result.ok) {
      if (result.error.code === "AI") {
        toast.error(result.error.message, {
          description: "Try being more specific (e.g. 'Photosynthesis' → 'Light-dependent reactions').",
        });
      } else {
        toast.error(result.error.message);
      }
      return;
    }
    router.push(`/app/study/${result.data.id}`);
  }

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 pt-4 sm:px-7 sm:pt-6 lg:px-11 lg:pt-8">
      <nav aria-label="Back to Study" className="mb-6 flex items-center gap-3">
        <Button asChild variant="outline" size="icon" aria-label="Back">
          <Link href="/app/study">
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
          </Link>
        </Button>
        <h1 className="text-[22px] font-extrabold tracking-tight sm:text-[26px]">
          New quiz
        </h1>
      </nav>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="subjectId">Subject</Label>
          <select
            id="subjectId"
            className="flex h-11 rounded-md border border-input bg-transparent px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-10 sm:text-sm"
            aria-invalid={!!errors.subjectId || undefined}
            {...register("subjectId")}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="topic">Topic or chapter</Label>
          <Input
            id="topic"
            type="text"
            autoCapitalize="sentences"
            enterKeyHint="done"
            placeholder="e.g. Photosynthesis, Newton's Laws, Cell Structure"
            invalid={!!errors.topic}
            aria-describedby={errors.topic ? "topic-error" : "topic-helper"}
            {...register("topic")}
          />
          {errors.topic ? (
            <p id="topic-error" role="alert" className="text-xs font-bold text-danger">
              {errors.topic.message}
            </p>
          ) : (
            <p id="topic-helper" className="text-xs text-muted-foreground">
              Be specific for better questions.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Number of questions</Label>
          <div className="grid grid-cols-3 gap-2.5">
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setValue("questionCount", n)}
                className={cn(
                  "flex h-14 items-center justify-center rounded-md border text-xl font-extrabold tracking-tight transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  selectedCount === n
                    ? "border-2 border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/40",
                )}
                aria-pressed={selectedCount === n}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Question types</Label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {QUESTION_TYPE_META.map((meta) => {
              const on = selectedTypes.includes(meta.key);
              return (
                <button
                  key={meta.key}
                  type="button"
                  onClick={() => toggleType(meta.key)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-md border p-3.5 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    on
                      ? "border-2 border-primary bg-accent text-accent-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/40",
                  )}
                  aria-pressed={on}
                >
                  <span className="text-[15px] font-bold">{meta.label}</span>
                  <span className="text-xs text-muted-foreground">{meta.hint}</span>
                </button>
              );
            })}
          </div>
          {errors.questionTypes ? (
            <p role="alert" className="text-xs font-bold text-danger">
              {errors.questionTypes.message as string}
            </p>
          ) : null}
        </div>

        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          {isSubmitting ? (
            "Generating your quiz…"
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden />
              Generate quiz
            </>
          )}
        </Button>

        {isSubmitting ? (
          <p className="text-center text-xs text-muted-foreground">
            AI is thinking. This usually takes 10–30 seconds.
          </p>
        ) : null}
      </form>
    </div>
  );
}
