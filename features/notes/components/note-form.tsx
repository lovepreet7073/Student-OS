"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Subject } from "@/features/academic-identity/types";

import { createNote } from "../actions/create-note";
import { updateNote } from "../actions/update-note";
import { createNoteSchema, type CreateNoteInput } from "../schemas/note";

interface NoteFormProps {
  subjects: Subject[];
  initial?: {
    id: string;
    title: string;
    content: string;
    subjectId: string;
  };
}

const REDIRECT_TO = "/app/notes";

export function NoteForm({ subjects, initial }: NoteFormProps) {
  const isEditing = Boolean(initial);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateNoteInput>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      title: initial?.title ?? "",
      content: initial?.content ?? "",
      subjectId: initial?.subjectId ?? subjects[0]?.id ?? "",
    },
  });

  async function onSubmit(values: CreateNoteInput) {
    const result = isEditing
      ? await updateNote({ ...values, id: initial!.id }, { redirectTo: `${REDIRECT_TO}/${initial!.id}` })
      : await createNote(values, { redirectTo: REDIRECT_TO });

    if (!result || result.ok) return;

    if (result.error.code === "VALIDATION" && result.error.fieldErrors) {
      for (const [field, messages] of Object.entries(result.error.fieldErrors)) {
        const msg = messages[0];
        if (msg) setError(field as keyof CreateNoteInput, { message: msg });
      }
      return;
    }
    toast.error(result.error.message);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          type="text"
          autoComplete="off"
          autoCapitalize="sentences"
          enterKeyHint="next"
          placeholder="What are you learning?"
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="subjectId">Subject</Label>
        <select
          id="subjectId"
          className="flex h-11 rounded-md border border-input bg-transparent px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-10 sm:text-sm"
          aria-invalid={!!errors.subjectId || undefined}
          aria-describedby={errors.subjectId ? "subject-error" : undefined}
          {...register("subjectId")}
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {errors.subjectId ? (
          <p id="subject-error" role="alert" className="text-xs font-bold text-danger">
            {errors.subjectId.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          rows={12}
          placeholder="Write your notes here. Markdown-friendly."
          className="min-h-[240px] font-mono text-[14.5px] leading-relaxed"
          invalid={!!errors.content}
          aria-describedby={errors.content ? "content-error" : "content-helper"}
          {...register("content")}
        />
        {errors.content ? (
          <p id="content-error" role="alert" className="text-xs font-bold text-danger">
            {errors.content.message}
          </p>
        ) : (
          <p id="content-helper" className="text-xs text-muted-foreground">
            Up to 50,000 characters. Autosave and rich formatting land in a later update.
          </p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button asChild variant="outline" fullWidth className="sm:w-auto">
          <Link href={isEditing ? `${REDIRECT_TO}/${initial!.id}` : REDIRECT_TO}>Cancel</Link>
        </Button>
        <Button type="submit" size="lg" fullWidth className="sm:w-auto" loading={isSubmitting}>
          {isEditing ? "Save changes" : "Create note"}
        </Button>
      </div>
    </form>
  );
}
