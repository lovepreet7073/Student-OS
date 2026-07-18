import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Progress" };

export default function ProgressPage() {
  return (
    <div className="mx-auto max-w-[780px] px-5 py-6 sm:px-7 sm:py-8 lg:max-w-[1140px] lg:px-11 lg:py-10">
      <header className="mb-6">
        <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[30px]">Progress</h1>
      </header>
      <EmptyState
        icon={BarChart3}
        title="Progress tracking is coming soon"
        description="Streaks, weekly goals, subject mastery, and achievements — all in one glance."
      />
    </div>
  );
}
