"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Subject } from "@/features/academic-identity/types";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import { beginEvaluation } from "../actions/begin-evaluation";
import { submitForEvaluation } from "../actions/submit-for-evaluation";
import {
  beginEvaluationSchema,
  type BeginEvaluationInput,
} from "../schemas/evaluation";
import type { ExamType } from "../types";

interface EvaluationCreatorFormProps {
  subjects: Subject[];
}

const ALLOWED = ["application/pdf", "image/png", "image/jpeg"] as const;
const MAX_BYTES = 25 * 1024 * 1024;
const MAX_PAGES = 15;

const EXAM_OPTIONS: { key: ExamType; label: string }[] = [
  { key: "unit_test",    label: "Unit test" },
  { key: "chapter_test", label: "Chapter test" },
  { key: "board_model",  label: "Board-style" },
  { key: "practice",     label: "Practice" },
  { key: "other",        label: "Other" },
];

type FormValues = Omit<BeginEvaluationInput, "pages">;

export function EvaluationCreatorForm({ subjects }: EvaluationCreatorFormProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [progressLabel, setProgressLabel] = useState("");
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(beginEvaluationSchema.omit({ pages: true })),
    defaultValues: {
      title: "",
      subjectId: subjects[0]?.id ?? "",
      examType: "unit_test",
      maxMarks: 20,
      topics: "",
    },
  });

  const examType = watch("examType");

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const next: File[] = [...files];
    for (const file of Array.from(list)) {
      if (next.length >= MAX_PAGES) break;
      if (!(ALLOWED as readonly string[]).includes(file.type)) {
        toast.error(`${file.name}: PDF/PNG/JPG only.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name}: exceeds 25 MB.`);
        continue;
      }
      next.push(file);
    }
    setFiles(next);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  async function onSubmit(values: FormValues) {
    if (files.length === 0) {
      toast.error("Upload at least one page.");
      return;
    }

    startTransition(async () => {
      setProgressLabel("Preparing…");
      const begin = await beginEvaluation({
        ...values,
        pages: files.map((f, i) => ({
          pageNumber: i + 1,
          fileName: f.name,
          mimeType: f.type,
          sizeBytes: f.size,
        })),
      });
      if (!begin.ok) {
        toast.error(begin.error.message);
        setProgressLabel("");
        return;
      }

      const supabase = getSupabaseBrowser();
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const path = begin.data.pages[i]!.storagePath;
        setProgressLabel(`Uploading page ${i + 1} of ${files.length}…`);
        const { error: upErr } = await supabase.storage
          .from(begin.data.bucket)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) {
          toast.error(`Upload of page ${i + 1} failed: ${upErr.message}`);
          setProgressLabel("");
          return;
        }
      }

      setProgressLabel("Evaluating with AI — this can take up to a minute…");
      const submit = await submitForEvaluation({ evaluationId: begin.data.evaluationId });
      if (!submit.ok) {
        toast.error(submit.error.message);
        setProgressLabel("");
        // still redirect so user sees the failed status
        router.push(`/app/tests/${begin.data.evaluationId}`);
        return;
      }

      setProgressLabel("");
      router.push(`/app/tests/${begin.data.evaluationId}`);
    });
  }

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 pt-4 sm:px-7 sm:pt-6 lg:px-11 lg:pt-8">
      <nav aria-label="Back to tests" className="mb-6 flex items-center gap-3">
        <Button asChild variant="outline" size="icon" aria-label="Back">
          <Link href="/app/tests">
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
          </Link>
        </Button>
        <h1 className="text-[22px] font-extrabold tracking-tight sm:text-[26px]">
          Grade a test
        </h1>
      </nav>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Test title</Label>
          <Input
            id="title"
            placeholder="e.g. Physics Chapter 3 Test"
            invalid={!!errors.title}
            {...register("title")}
          />
          {errors.title ? (
            <p role="alert" className="text-xs font-bold text-danger">
              {errors.title.message}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="subjectId">Subject</Label>
            <select
              id="subjectId"
              className="flex h-11 rounded-md border border-input bg-transparent px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-10 sm:text-sm"
              {...register("subjectId")}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="maxMarks">Max marks</Label>
            <Input
              id="maxMarks"
              type="number"
              min={1}
              max={500}
              invalid={!!errors.maxMarks}
              {...register("maxMarks", { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Exam type</Label>
          <div className="flex flex-wrap gap-2">
            {EXAM_OPTIONS.map((opt) => {
              const on = examType === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setValue("examType", opt.key, { shouldValidate: true })}
                  className={cn(
                    "inline-flex h-10 items-center rounded-full px-4 text-[13.5px] font-bold transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    on
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                  aria-pressed={on}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="topics">Topics covered (optional)</Label>
          <Textarea
            id="topics"
            rows={2}
            placeholder="e.g. Newton's Laws, Friction, Momentum"
            {...register("topics")}
          />
          <p className="text-xs text-muted-foreground">
            Helps the AI focus on what the test was about.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Answer sheets ({files.length} / {MAX_PAGES})</Label>
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-card p-6 transition-colors",
              "hover:border-primary/60 focus-within:border-primary",
            )}
          >
            <input
              type="file"
              accept={ALLOWED.join(",")}
              multiple
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
              className="hidden"
              aria-label="Upload answer sheets"
            />
            <Upload className="h-6 w-6 text-muted-foreground" aria-hidden />
            <span className="text-[14px] font-bold">Tap to add photos or a PDF</span>
            <span className="text-xs text-muted-foreground">
              PDF, PNG, JPG · up to 25 MB per file · max {MAX_PAGES} pages
            </span>
          </label>

          {files.length > 0 ? (
            <ul className="mt-2 flex flex-col gap-1.5">
              {files.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-[13px]"
                >
                  <span className="font-bold text-muted-foreground/80">#{i + 1}</span>
                  <span className="flex-1 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    aria-label={`Remove ${file.name}`}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <Button type="submit" size="lg" fullWidth loading={pending}>
          {pending ? (
            progressLabel || "Submitting…"
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden />
              Evaluate with AI
            </>
          )}
        </Button>

        {pending ? (
          <p className="text-center text-xs text-muted-foreground">
            Grading handwritten answers takes 30-60 seconds. Keep this tab open.
          </p>
        ) : null}
      </form>
    </div>
  );
}
