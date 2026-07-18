import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your free StudyOS account.",
};

interface SignupPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { next } = await searchParams;
  return (
    <AuthShell
      title="Create your account"
      description="Start studying smarter in less than a minute."
    >
      <SignUpForm next={next} />
    </AuthShell>
  );
}
