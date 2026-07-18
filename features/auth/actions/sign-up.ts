"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { publicEnv } from "@/lib/env";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { signUpSchema, type SignUpInput } from "../schemas/auth";

export type SignUpOutcome = { needsVerification: boolean; email: string };

export async function signUp(
  input: SignUpInput,
): Promise<Result<SignUpOutcome, ActionError>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Please check your details.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const callbackUrl = new URL("/auth/callback", publicEnv.NEXT_PUBLIC_SITE_URL);

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: callbackUrl.toString(),
    },
  });

  if (error) {
    const lower = error.message.toLowerCase();
    if (lower.includes("already registered") || lower.includes("exists")) {
      return err({
        code: "CONFLICT",
        message: "An account with this email already exists.",
      });
    }
    if (lower.includes("weak") || lower.includes("password")) {
      return err({
        code: "VALIDATION",
        message: "Please choose a stronger password.",
        fieldErrors: { password: [error.message] },
      });
    }
    return err({ code: "UNKNOWN", message: "Sign up failed. Please try again." });
  }

  // Confirmation required → session is null, user must click email link.
  if (!data.session) {
    return ok({ needsVerification: true, email: parsed.data.email });
  }

  revalidatePath("/", "layout");
  redirect("/app/dashboard");

  return ok({ needsVerification: false, email: parsed.data.email });
}
