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

import { generateDeck } from "../actions/generate-deck";
import { generateDeckSchema, type GenerateDeckInput } from "../schemas/deck";

interface DeckGeneratorFormProps {
  subjects: Subject[];
  defaultSubjectId?: string;
  defaultTopic?: string;
  defaultSourceNoteId?: string;
}

const CARD_COUNT_OPTIONS = [10, 15, 20, 30];

export function DeckGeneratorForm({
  subjects,
  defaultSubjectId,
  defaultTopic,
  defaultSourceNoteId,
}: DeckGeneratorFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<GenerateDeckInput>({
    resolver: zodResolver(generateDeckSchema),
    defaultValues: {
      subjectId: defaultSubjectId ?? subjects[0]?.id ?? "",
      topic: defaultTopic ?? "",
      cardCount: 15,
      sourceNoteId: defaultSourceNoteId,
    },
  });

  const selectedCount = useWatch({ control, name: "cardCount" });

  async function onSubmit(values: GenerateDeckInput) {
    const result = await generateDeck(values);
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
    router.push(`/app/flashcards/${result.data.id}`);
  }

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 pt-4 sm:px-7 sm:pt-6 lg:px-11 lg:pt-8">
      <nav aria-label="Back to Flashcards" className="mb-6 flex items-center gap-3">
        <Button asChild variant="outline" size="icon" aria-label="Back">
          <Link href="/app/flashcards">
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
          </Link>
        </Button>
        <h1 className="text-[22px] font-extrabold tracking-tight sm:text-[26px]">
          New deck
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
              Narrow topics give sharper cards.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Number of cards</Label>
          <div className="grid grid-cols-4 gap-2.5">
            {CARD_COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setValue("cardCount", n)}
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

        <input type="hidden" {...register("sourceNoteId")} />

        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          {isSubmitting ? (
            "Building your deck…"
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden />
              Generate deck
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
