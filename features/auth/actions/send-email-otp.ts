"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { sendOtpSchema, type SendOtpInput } from "../schemas/auth";

/**
 * Sends a 6-digit email OTP via Supabase auth.
 *
 * `shouldCreateUser: true` means the same call handles both sign-in and
 * first-time sign-up — the row lands in `auth.users` with `email_confirmed_at`
 * still null until they verify the code. On signup we attach display_name +
 * role to `user_metadata` so `saveMyProfile` can persist the role later.
 *
 * Same rate-limits as Supabase's built-in magic link — one per 60s per email.
 */
export async function sendEmailOtp(
  input: SendOtpInput,
): Promise<Result<{ email: string }, ActionError>> {
  const parsed = sendOtpSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Please check your email address.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }
  const { email, role, displayName } = parsed.data;

  const supabase = await getSupabaseServer();

  const metadata: Record<string, string> = {};
  if (displayName) metadata.display_name = displayName;
  if (role) metadata.role = role;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      ...(Object.keys(metadata).length > 0 ? { data: metadata } : {}),
    },
  });

  if (error) {
    const lower = error.message.toLowerCase();
    if (lower.includes("rate limit") || lower.includes("too many")) {
      return err({
        code: "RATE_LIMITED",
        message: "You're going too fast. Wait a minute and try again.",
      });
    }
    return err({
      code: "UNKNOWN",
      message: "Couldn't send the code. Check the email address and try again.",
    });
  }

  return ok({ email });
}
