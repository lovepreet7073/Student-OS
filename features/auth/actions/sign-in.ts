"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { signInSchema, type SignInInput } from "../schemas/auth";

function safeNext(next: string | undefined): string {
  if (!next) return "/app/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) return "/app/dashboard";
  return next;
}

export async function signIn(
  input: SignInInput,
  next?: string,
): Promise<Result<null, ActionError>> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Please check your details.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    const lower = error.message.toLowerCase();
    if (lower.includes("invalid") || lower.includes("credentials")) {
      return err({ code: "UNAUTHORIZED", message: "Invalid email or password." });
    }
    if (lower.includes("email not confirmed")) {
      return err({
        code: "FORBIDDEN",
        message: "Please confirm your email before signing in.",
      });
    }
    return err({ code: "UNKNOWN", message: "Sign in failed. Please try again." });
  }

  revalidatePath("/", "layout");
  redirect(safeNext(next));

  // Unreachable, satisfies types.
  return ok(null);
}
