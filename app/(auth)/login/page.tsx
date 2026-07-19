import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginMarketingPanel } from "@/features/auth/components/marketing/login-panel";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your StudyOS account.",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [{ next, error }, t] = await Promise.all([
    searchParams,
    getTranslations("auth.login"),
  ]);
  return (
    <AuthShell
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      marketingPanel={<LoginMarketingPanel />}
    >
      <SignInForm next={next} initialError={error} />
    </AuthShell>
  );
}
