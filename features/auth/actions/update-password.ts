"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { resetPasswordSchema, type ResetPasswordInput } from "../schemas/auth";

export async function updatePassword(
  input: ResetPasswordInput,
): Promise<Result<null, ActionError>> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Password is too short.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return err({
      code: "UNKNOWN",
      message: "Couldn't update your password. The reset link may have expired.",
    });
  }

  revalidatePath("/", "layout");
  redirect("/app/dashboard");

  return ok(null);
}
