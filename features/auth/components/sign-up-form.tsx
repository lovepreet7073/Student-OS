"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Mail, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserRole } from "@/features/academic-identity/types";

import { signUp } from "../actions/sign-up";
import { signUpSchema, type SignUpInput } from "../schemas/auth";
import { AudiencePicker } from "./audience-picker";
import { AuthDivider } from "./auth-divider";
import { OAuthButtons } from "./oauth-buttons";
import { OtpFlow } from "./otp-flow";
import { PasswordInput } from "./password-input";
import { VerifyEmailNotice } from "./verify-email-notice";

interface SignUpFormProps {
  next?: string;
  initialRole?: UserRole;
}

/**
 * Sign-up UI.
 * OTP is the primary path — the audience picker + optional display name feed
 * straight into `sendEmailOtp` and land on `auth.user_metadata`. Password
 * remains available under "Use password instead" for users who prefer it.
 */
export function SignUpForm({ next, initialRole = "student" }: SignUpFormProps) {
  const t = useTranslations("auth");
  const tSignup = useTranslations("auth.signup");
  const tOtp = useTranslations("auth.otp");
  const [role, setRole] = useState<UserRole>(initialRole);
  const [displayName, setDisplayName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [usePassword, setUsePassword] = useState(false);

  function validateName() {
    const trimmed = displayName.trim();
    if (trimmed.length === 0) {
      setNameError(tSignup("nameEmpty"));
      return false;
    }
    if (trimmed.length > 60) {
      setNameError(tSignup("nameTooLong"));
      return false;
    }
    setNameError(null);
    return true;
  }

  return (
    <div className="flex flex-col gap-5">
      <AudiencePicker value={role} onChange={setRole} />

      <OAuthButtons next={next} />
      <AuthDivider>{t("orUseEmail")}</AuthDivider>

      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName">{tSignup("yourName")}</Label>
        <Input
          id="displayName"
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
          placeholder={tSignup("yourNamePlaceholder")}
          leadingIcon={<User />}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onBlur={validateName}
          invalid={!!nameError}
          aria-describedby={nameError ? "displayName-error" : undefined}
        />
        {nameError ? (
          <p id="displayName-error" role="alert" className="text-xs font-medium text-danger">
            {nameError}
          </p>
        ) : null}
      </div>

      {usePassword ? (
        <PasswordSignUpForm
          role={role}
          displayName={displayName}
          next={next}
          onValidateName={validateName}
        />
      ) : (
        <BlockedIfNameEmpty
          valid={displayName.trim().length > 0}
          message={tOtp("enterNameFirst")}
        >
          <OtpFlow
            role={role}
            displayName={displayName}
            next={next}
            sendCtaLabel={tOtp("sendSignupCta")}
            verifyCtaLabel={tOtp("verifySignupCta")}
          />
        </BlockedIfNameEmpty>
      )}

      <button
        type="button"
        onClick={() => setUsePassword((v) => !v)}
        className="mx-auto flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {usePassword ? (
          <>
            <Mail className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            {t("useCodeInstead")}
          </>
        ) : (
          <>
            <KeyRound className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            {t("usePasswordInstead")}
          </>
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        {tSignup("termsPre")}{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
          {tSignup("terms")}
        </Link>{" "}
        {tSignup("and")}{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
          {tSignup("privacy")}
        </Link>
        .
      </p>
      <p className="text-center text-sm text-muted-foreground">
        {tSignup("hasAccount")}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("login.cta")}
        </Link>
      </p>
    </div>
  );
}

/**
 * Blocks the OTP send until we have a display name. We surface a hint under
 * the send button rather than disabling silently.
 */
function BlockedIfNameEmpty({
  valid,
  message,
  children,
}: {
  valid: boolean;
  message: string;
  children: React.ReactNode;
}) {
  if (valid) return <>{children}</>;
  return (
    <div className="rounded-md border border-dashed border-border bg-card/60 p-4 text-center text-[12.5px] text-muted-foreground">
      {message}
    </div>
  );
}

function PasswordSignUpForm({
  role,
  displayName,
  next,
  onValidateName,
}: {
  role: UserRole;
  displayName: string;
  next?: string;
  onValidateName: () => boolean;
}) {
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Pick<SignUpInput, "email" | "password">>({
    resolver: zodResolver(signUpSchema.pick({ email: true, password: true })),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: Pick<SignUpInput, "email" | "password">) {
    if (!onValidateName()) return;
    const result = await signUp({
      role,
      displayName,
      email: values.email,
      password: values.password,
    });
    if (!result || !result.ok) {
      if (result?.error.code === "VALIDATION" && result.error.fieldErrors) {
        for (const [field, messages] of Object.entries(result.error.fieldErrors)) {
          const msg = messages[0];
          if (msg && (field === "email" || field === "password")) {
            setError(field, { message: msg });
          }
        }
        return;
      }
      toast.error(result?.error.message ?? "Sign up failed.");
      return;
    }
    if (result.data.needsVerification) {
      setVerificationEmail(result.data.email);
    }
  }

  if (verificationEmail) {
    return <VerifyEmailNotice email={verificationEmail} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          enterKeyHint="next"
          placeholder="you@example.com"
          leadingIcon={<Mail />}
          invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email ? (
          <p role="alert" className="text-xs font-medium text-danger">{errors.email.message}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          enterKeyHint="done"
          placeholder="At least 8 characters"
          invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password ? (
          <p role="alert" className="text-xs font-medium text-danger">{errors.password.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Use at least 8 characters. Mix letters, numbers, and symbols for stronger security.
          </p>
        )}
      </div>
      <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
        Create account
      </Button>
    </form>
  );
}
