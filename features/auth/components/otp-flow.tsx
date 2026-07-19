"use client";

import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserRole } from "@/features/academic-identity/types";

import { sendEmailOtp } from "../actions/send-email-otp";
import { verifyEmailOtp } from "../actions/verify-email-otp";
import { OtpInput } from "./otp-input";

interface OtpFlowProps {
  role?: UserRole;
  displayName?: string;
  next?: string;
  onSent?: (email: string) => void;
  onVerified?: () => void;
  sendCtaLabel: string;
  verifyCtaLabel: string;
}

const RESEND_SECONDS = 60;

export function OtpFlow({
  role,
  displayName,
  next,
  onSent,
  onVerified,
  sendCtaLabel,
  verifyCtaLabel,
}: OtpFlowProps) {
  const t = useTranslations("auth");
  const tOtp = useTranslations("auth.otp");
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isSending, startSend] = useTransition();
  const [isVerifying, startVerify] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  function onSend(e?: React.FormEvent) {
    e?.preventDefault();
    setEmailError(null);
    if (email.trim().length === 0) {
      setEmailError(tOtp("emailEmpty"));
      return;
    }
    startSend(async () => {
      const result = await sendEmailOtp({ email, role, displayName });
      if (!result.ok) {
        if (result.error.code === "VALIDATION" && result.error.fieldErrors?.email) {
          setEmailError(result.error.fieldErrors.email[0] ?? tOtp("emailEmpty"));
          return;
        }
        toast.error(result.error.message);
        return;
      }
      setStep("code");
      setCooldown(RESEND_SECONDS);
      onSent?.(email);
      toast.success(tOtp("codeSent", { email }));
    });
  }

  function onResend() {
    if (cooldown > 0) return;
    startSend(async () => {
      const result = await sendEmailOtp({ email, role, displayName });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      setCooldown(RESEND_SECONDS);
      toast.success(tOtp("newSent"));
    });
  }

  function onVerify(codeValue?: string) {
    const token = codeValue ?? code;
    setCodeError(null);
    if (token.length !== 6) {
      setCodeError(tOtp("codeEmpty"));
      return;
    }
    startVerify(async () => {
      const result = await verifyEmailOtp({ email, token }, next);
      if (!result.ok) {
        if (result.error.code === "VALIDATION") {
          setCodeError(result.error.message);
          return;
        }
        toast.error(result.error.message);
        return;
      }
      onVerified?.();
    });
  }

  if (step === "email") {
    return (
      <form onSubmit={onSend} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="otp-email">{t("email")}</Label>
          <Input
            id="otp-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            enterKeyHint="send"
            placeholder={t("emailPlaceholder")}
            leadingIcon={<Mail />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            invalid={!!emailError}
            aria-describedby={emailError ? "otp-email-error" : "otp-email-helper"}
          />
          {emailError ? (
            <p id="otp-email-error" role="alert" className="text-xs font-medium text-danger">
              {emailError}
            </p>
          ) : (
            <p id="otp-email-helper" className="text-xs text-muted-foreground">
              {tOtp("emailHelper")}
            </p>
          )}
        </div>
        <Button type="submit" size="lg" fullWidth loading={isSending}>
          {sendCtaLabel}
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => {
          setStep("email");
          setCode("");
          setCodeError(null);
        }}
        className="-ml-1 flex w-fit items-center gap-1 rounded-md px-1 py-0.5 text-[12.5px] font-bold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
        {email}
      </button>

      <div className="flex flex-col gap-2">
        <Label htmlFor="otp-code" className="text-center">
          {tOtp("codeLabel")}
        </Label>
        <OtpInput
          value={code}
          onChange={setCode}
          onComplete={(v) => onVerify(v)}
          disabled={isVerifying}
          invalid={!!codeError}
          autoFocus
          aria-describedby={codeError ? "otp-code-error" : "otp-code-helper"}
        />
        {codeError ? (
          <p id="otp-code-error" role="alert" className="text-center text-xs font-medium text-danger">
            {codeError}
          </p>
        ) : (
          <p id="otp-code-helper" className="text-center text-xs text-muted-foreground">
            {tOtp("codeHelper")}
          </p>
        )}
      </div>

      <Button
        type="button"
        size="lg"
        fullWidth
        loading={isVerifying}
        onClick={() => onVerify()}
        disabled={code.length !== 6}
      >
        {verifyCtaLabel}
      </Button>

      <button
        type="button"
        onClick={onResend}
        disabled={cooldown > 0 || isSending}
        className="mx-auto flex items-center gap-1 text-[12.5px] font-bold text-primary transition-colors hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
      >
        {cooldown > 0 ? tOtp("resendWait", { seconds: cooldown }) : tOtp("resendNow")}
      </button>
    </div>
  );
}
