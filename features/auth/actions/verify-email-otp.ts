"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { verifyOtpSchema, type VerifyOtpInput } from "../schemas/auth";

/**
 * Verifies a 6-digit email OTP. On success the user session is established;
 * we redirect to `next` (defaults to `/onboarding` for new users, which then
 * redirects to `/app/dashboard` if the profile is already complete).
 *
 * Because `redirect()` throws, this action either redirects or returns a
 * validation-flavoured error. Never returns `ok` on success.
 */
export async function verifyEmailOtp(
  input: VerifyOtpInput,
  next?: string,
): Promise<Result<never, ActionError>> {
  const parsed = verifyOtpSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Please enter the 6-digit code.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: "email",
  });

  if (error) {
    const lower = error.message.toLowerCase();
    if (lower.includes("expired")) {
      return err({
        code: "VALIDATION",
        message: "That code has expired. Ask for a new one.",
      });
    }
    if (lower.includes("invalid") || lower.includes("token")) {
      return err({
        code: "VALIDATION",
        message: "That code isn't right. Double-check and try again.",
        fieldErrors: { token: ["Wrong code"] },
      });
    }
    return err({ code: "UNKNOWN", message: "Couldn't verify the code. Try again." });
  }

  revalidatePath("/", "layout");
  const dest = next && next.startsWith("/") ? next : "/onboarding";
  redirect(dest);
}
