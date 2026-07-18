"use server";

import { publicEnv } from "@/lib/env";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "../schemas/auth";

export async function sendPasswordReset(
  input: ForgotPasswordInput,
): Promise<Result<null, ActionError>> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Enter a valid email.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const redirectTo = new URL("/auth/callback", publicEnv.NEXT_PUBLIC_SITE_URL);
  redirectTo.searchParams.set("next", "/reset-password");

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: redirectTo.toString(),
  });

  // Security: never reveal whether an email is registered. Always return ok.
  if (error) {
    console.error("Password reset request failed:", error.message);
  }

  return ok(null);
}
