"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { signIn } from "../actions/sign-in";
import { signInSchema, type SignInInput } from "../schemas/auth";
import { AuthDivider } from "./auth-divider";
import { OAuthButtons } from "./oauth-buttons";
import { OtpFlow } from "./otp-flow";
import { PasswordInput } from "./password-input";

const CALLBACK_ERROR_MESSAGE: Record<string, string> = {
  auth: "That sign-in link is invalid or has expired. Try again.",
  oauth: "Google sign in failed. Please try again.",
  "reset-expired": "Your reset link has expired. Request a new one below.",
};

interface SignInFormProps {
  next?: string;
  initialError?: string;
}

/**
 * Sign-in UI.
 * OTP is the primary path (mobile-first: no email-link cross-app roundtrip).
 * Password is available under "Use password instead" for existing users.
 */
export function SignInForm({ next, initialError }: SignInFormProps) {
  const t = useTranslations("auth");
  const tOtp = useTranslations("auth.otp");
  const [usePassword, setUsePassword] = useState(false);

  useEffect(() => {
    if (initialError && CALLBACK_ERROR_MESSAGE[initialError]) {
      toast.error(CALLBACK_ERROR_MESSAGE[initialError]);
    }
  }, [initialError]);

  return (
    <div className="flex flex-col gap-5">
      <OAuthButtons next={next} />
      <AuthDivider>{t("orUseEmail")}</AuthDivider>

      {usePassword ? (
        <PasswordSignInForm next={next} />
      ) : (
        <OtpFlow
          next={next}
          sendCtaLabel={tOtp("sendLoginCta")}
          verifyCtaLabel={tOtp("verifyLoginCta")}
        />
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

      <p className="text-center text-sm text-muted-foreground">
        {t("login.noAccount")}{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          {t("login.createOne")}
        </Link>
      </p>
    </div>
  );
}

function PasswordSignInForm({ next }: { next?: string }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignInInput) {
    const result = await signIn(values, next);
    if (!result || result.ok) return;
    if (result.error.code === "VALIDATION" && result.error.fieldErrors) {
      for (const [field, messages] of Object.entries(result.error.fieldErrors)) {
        const msg = messages[0];
        if (msg) setError(field as keyof SignInInput, { message: msg });
      }
      return;
    }
    toast.error(result.error.message);
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
            Forgot?
          </Link>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          enterKeyHint="done"
          placeholder="Enter your password"
          invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password ? (
          <p role="alert" className="text-xs font-medium text-danger">{errors.password.message}</p>
        ) : null}
      </div>
      <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
        Log in
      </Button>
    </form>
  );
}
