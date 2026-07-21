"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { deleteDeckSchema, type DeleteDeckInput } from "../schemas/deck";

export async function deleteDeck(
  input: DeleteDeckInput,
): Promise<Result<null, ActionError>> {
  const parsed = deleteDeckSchema.safeParse(input);
  if (!parsed.success) {
    return err({ code: "VALIDATION", message: "Couldn't delete the deck." });
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("flashcard_decks")
    .delete()
    .eq("id", parsed.data.deckId);

  if (error) return err({ code: "DB", message: "Couldn't delete the deck." });

  revalidatePath("/app/flashcards");
  return ok(null);
}
