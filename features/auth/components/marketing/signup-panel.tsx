import { Check, Sparkles, Star } from "lucide-react";

import { Logo } from "@/components/layout/logo";

const BENEFITS = [
  "Free forever plan — no card needed",
  "Set up in under two minutes",
  "Tailored to your board, class and subjects",
];

const STATS = [
  { key: "students", value: "12k+", label: "students" },
  { key: "teachers", value: "800+", label: "teachers" },
  { key: "rating", value: "4.8", label: "rated", star: true },
];

/**
 * Left-hand branded panel for /signup (deck slide 6). Same layout family as
 * the login panel but different copy + a stats strip in place of the quote.
 */
export function SignupMarketingPanel() {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary to-info p-10 text-primary-foreground lg:p-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(closest-side,rgba(255,255,255,0.18),transparent_70%)]"
      />

      <div className="relative flex items-center gap-2">
        <Logo variant="mark" size="md" href={null} />
        <span className="text-[15px] font-extrabold tracking-tight">StudyOS</span>
      </div>

      <div className="relative flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur">
            <Sparkles className="h-3 w-3" strokeWidth={2.4} aria-hidden />
            Free forever · No card
          </span>
          <h2 className="text-balance text-[30px] font-extrabold leading-[1.1] tracking-tight sm:text-[36px]">
            Join 12,000+ students and teachers.
          </h2>
          <ul className="flex flex-col gap-2.5">
            {BENEFITS.map((line) => (
              <li key={line} className="flex items-start gap-3 text-[14px] font-medium leading-snug">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/25">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                </span>
                <span className="text-primary-foreground/95">{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
          {STATS.map((s) => (
            <div key={s.key} className="flex flex-col items-center gap-0.5 text-center">
              <span className="inline-flex items-center gap-1 text-[20px] font-extrabold tracking-tight">
                {s.value}
                {s.star ? (
                  <Star className="h-3.5 w-3.5 fill-white text-white" strokeWidth={0} aria-hidden />
                ) : null}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative text-[11.5px] font-semibold opacity-80">
        Tailored to your board, class, and subjects — from day one.
      </div>
    </div>
  );
}
