import Link from "next/link";
import { Mail } from "lucide-react";

interface VerifyEmailNoticeProps {
  email: string;
}

export function VerifyEmailNotice({ email }: VerifyEmailNoticeProps) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-lg border border-border bg-card p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Mail className="h-5 w-5" aria-hidden />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to{" "}
          <span className="font-medium text-foreground">{email}</span>. Open it on this device to
          finish signing in.
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Wrong email?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Start over
        </Link>
      </p>
    </div>
  );
}
