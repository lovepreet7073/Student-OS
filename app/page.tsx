import { LandingExperience } from "@/features/marketing/components/landing-experience";

export default function LandingPage() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--primary)/0.14),transparent_75%)]"
      />
      <LandingExperience />
    </div>
  );
}
