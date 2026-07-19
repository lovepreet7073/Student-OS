"use client";

import { forwardRef, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  "aria-describedby"?: string;
}

/**
 * Six-cell OTP input. Auto-advances, backspace jumps back, and paste of a
 * full code fills every cell. Mobile-first: `inputMode="numeric"` and
 * `autoComplete="one-time-code"` let iOS/Android surface the SMS/email code
 * directly from the notification.
 */
export const OtpInput = forwardRef<HTMLInputElement, OtpInputProps>(function OtpInput(
  {
    value,
    onChange,
    onComplete,
    length = 6,
    disabled,
    invalid,
    autoFocus,
    "aria-describedby": describedBy,
  },
  ref,
) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const t = useTranslations("auth.otp");

  useEffect(() => {
    if (autoFocus) inputs.current[0]?.focus();
  }, [autoFocus]);

  function setDigit(idx: number, digit: string) {
    const arr = value.padEnd(length, " ").split("");
    arr[idx] = digit;
    const next = arr.join("").replace(/\s+$/g, "").slice(0, length);
    onChange(next);
    if (next.length === length && onComplete) onComplete(next);
  }

  function handleChange(idx: number, raw: string) {
    // Paste of full code — fill everything from `idx`.
    if (raw.length > 1) {
      const digits = raw.replace(/\D/g, "").slice(0, length - idx);
      const arr = value.padEnd(length, " ").split("");
      for (let i = 0; i < digits.length; i++) arr[idx + i] = digits[i]!;
      const next = arr.join("").replace(/\s+$/g, "").slice(0, length);
      onChange(next);
      if (next.length === length && onComplete) onComplete(next);
      const focusTo = Math.min(idx + digits.length, length - 1);
      inputs.current[focusTo]?.focus();
      return;
    }

    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    setDigit(idx, digit);
    if (idx < length - 1) inputs.current[idx + 1]?.focus();
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (value[idx]) {
        setDigit(idx, "");
      } else if (idx > 0) {
        inputs.current[idx - 1]?.focus();
        setDigit(idx - 1, "");
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputs.current[idx - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && idx < length - 1) {
      inputs.current[idx + 1]?.focus();
      e.preventDefault();
    }
  }

  return (
    <div
      role="group"
      aria-describedby={describedBy}
      className="flex items-center justify-between gap-2"
    >
      {Array.from({ length }, (_, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputs.current[idx] = el;
            if (idx === 0 && ref) {
              if (typeof ref === "function") ref(el);
              else ref.current = el;
            }
          }}
          type="text"
          inputMode="numeric"
          autoComplete={idx === 0 ? "one-time-code" : "off"}
          enterKeyHint={idx === length - 1 ? "done" : "next"}
          maxLength={idx === 0 ? length : 1}
          value={value[idx] ?? ""}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          aria-label={t("cellLabel", { n: idx + 1 })}
          className={cn(
            "h-14 w-full min-w-0 max-w-[52px] rounded-md border-2 bg-card text-center text-[22px] font-extrabold tracking-tight tabular-nums",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:opacity-50 transition-colors",
            invalid ? "border-danger" : "border-border focus:border-primary",
          )}
        />
      ))}
    </div>
  );
});
