import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Bookmark, Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getContributor } from "@/features/community/actions/get-contributor";
import { CommunityFeed } from "@/features/community/components/community-feed";

export const metadata: Metadata = { title: "Contributor" };

interface Props {
  params: Promise<{ id: string }>;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function ContributorPage({ params }: Props) {
  const { id } = await params;
  const result = await getContributor(id);
  if (!result.ok) {
    if (result.error.code === "NOT_FOUND") notFound();
    throw new Error(result.error.message);
  }

  const contributor = result.data;

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 sm:px-7 lg:max-w-[1140px] lg:px-11">
      <header className="pt-4 sm:pt-6">
        <Button asChild variant="outline" size="icon" aria-label="Back to community" className="mb-4">
          <Link href="/app/community">
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
          </Link>
        </Button>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
          <span
            aria-hidden
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-primary/12 text-[18px] font-extrabold text-primary"
          >
            {initials(contributor.displayName) || "?"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[19px] font-extrabold tracking-tight">
              {contributor.displayName}
            </div>
            <div className="mt-0.5 text-[12.5px] font-semibold text-muted-foreground">
              Contributor to your community
            </div>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-3">
          <Stat icon={BookOpen} label="Shares" value={contributor.approvedCount} tone="primary" />
          <Stat icon={Heart} label="Likes" value={contributor.totalLikes} tone="danger" />
          <Stat icon={Bookmark} label="Saves" value={contributor.totalBookmarks} tone="brand" />
        </dl>
      </header>

      <section aria-label="Approved shares" className="mt-8">
        <h2 className="mb-3 text-[15px] font-extrabold tracking-tight">
          All shared notes
        </h2>
        <CommunityFeed notes={contributor.notes} />
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number;
  tone: "primary" | "danger" | "brand";
}) {
  const TONES: Record<typeof tone, string> = {
    primary: "bg-primary/10 text-primary",
    danger: "bg-danger/12 text-danger",
    brand: "bg-brand-accent/12 text-brand-accent",
  };
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3.5 text-center">
      <span aria-hidden className={`flex h-9 w-9 items-center justify-center rounded-md ${TONES[tone]}`}>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <dt className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-[18px] font-extrabold tracking-tight">{value}</dd>
    </div>
  );
}
