import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { getSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Set new password",
  description: "Choose a new password for your StudyOS account.",
};

export default async function ResetPasswordPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=reset-expired");
  }

  return (
    <AuthShell
      title="Set a new password"
      description="Choose a strong password you&rsquo;ll remember."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
