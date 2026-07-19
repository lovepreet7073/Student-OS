import { Check, Sparkles } from "lucide-react";

import { Logo } from "@/components/layout/logo";

const TRUST_LINES = [
  "Your plan and progress, right where you left them",
  "Notes, papers and flashcards in one tap",
  "Works offline when your signal drops",
];

/**
 * Left-hand branded panel for /login (deck slide 5). Sits inside AuthShellV2.
 * Hidden on mobile; the form takes the whole viewport there.
 */
export function LoginMarketingPanel() {
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
            AI-powered study platform
          </span>
          <h2 className="text-balance text-[30px] font-extrabold leading-[1.1] tracking-tight sm:text-[36px]">
            Welcome back to calmer studying.
          </h2>
          <ul className="flex flex-col gap-2.5">
            {TRUST_LINES.map((line) => (
              <li key={line} className="flex items-start gap-3 text-[14px] font-medium leading-snug">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/25">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                </span>
                <span className="text-primary-foreground/95">{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <figure className="rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur">
          <blockquote className="text-[15px] font-medium leading-snug">
            &ldquo;StudyOS replaced five apps. My exam prep has never felt this calm.&rdquo;
          </blockquote>
          <figcaption className="mt-3 flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/25 text-[12px] font-extrabold"
            >
              AR
            </span>
            <span className="flex flex-col text-[12px]">
              <span className="font-bold">Aisha Rahman</span>
              <span className="opacity-80">Class 12 · CBSE</span>
            </span>
          </figcaption>
        </figure>
      </div>

      <div className="relative text-[11.5px] font-semibold opacity-80">
        Calm, cohesive, ready for the next chapter.
      </div>
    </div>
  );
}
