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
    // Log the full Supabase error server-side so we can debug production
    // issues — the shape is `AuthError { status, code, message }`. Client
    // sees a friendly one-liner only.
    console.error("[sendEmailOtp] Supabase auth error", {
      status: (error as { status?: number }).status,
      code: (error as { code?: string }).code,
      message: error.message,
      email,
    });
    const lower = error.message.toLowerCase();
    if (lower.includes("rate limit") || lower.includes("too many")) {
      return err({
        code: "RATE_LIMITED",
        message: "You're going too fast. Wait a minute and try again.",
      });
    }
    if (lower.includes("smtp") || lower.includes("relay") || lower.includes("sending")) {
      return err({
        code: "UNKNOWN",
        message:
          "Email server rejected the message. If you set up custom SMTP recently, check the sender email matches your verified domain.",
      });
    }
    if (lower.includes("only send") || lower.includes("testing")) {
      return err({
        code: "UNKNOWN",
        message:
          "Your email provider only allows sending to your own account during testing. Sign in with the same email that owns your Resend/SMTP account, or verify a domain.",
      });
    }
    return err({
      code: "UNKNOWN",
      message: `Couldn't send the code — ${error.message}`,
    });
  }

  return ok({ email });
}
