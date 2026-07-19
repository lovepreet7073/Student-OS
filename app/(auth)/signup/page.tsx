import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignupMarketingPanel } from "@/features/auth/components/marketing/signup-panel";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import type { UserRole } from "@/features/academic-identity/types";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your free StudyOS account.",
};

interface SignupPageProps {
  searchParams: Promise<{ next?: string; as?: string }>;
}

function resolveInitialRole(raw: string | undefined): UserRole {
  return raw === "teacher" ? "teacher" : "student";
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const [{ next, as }, t] = await Promise.all([
    searchParams,
    getTranslations("auth.signup"),
  ]);
  const initialRole = resolveInitialRole(as);

  return (
    <AuthShell
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      marketingPanel={<SignupMarketingPanel />}
    >
      <SignUpForm next={next} initialRole={initialRole} />
    </AuthShell>
  );
}
