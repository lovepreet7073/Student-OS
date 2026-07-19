import Link from "next/link";
import { BookText, ClipboardList, FileText, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { formatRelativeTime } from "@/lib/format-date";

import type { SearchHit, SearchResults as ResultsShape } from "../types";

interface Props {
  results: ResultsShape;
}

const META = {
  note:            { icon: BookText,      tone: "bg-primary/10 text-primary" },
  file:            { icon: FileText,      tone: "bg-brand-accent/12 text-brand-accent" },
  task:            { icon: ClipboardList, tone: "bg-warning/15 text-warning" },
  community_note:  { icon: Users,         tone: "bg-info/12 text-info" },
} as const;

export async function SearchResults({ results }: Props) {
  const t = await getTranslations("search");

  if (results.query.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/60 p-6 text-center">
        <div className="text-[14px] font-bold">{t("empty.title")}</div>
        <p className="mt-1 text-[12.5px] text-muted-foreground">{t("empty.hint")}</p>
      </div>
    );
  }

  if (results.total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/60 p-6 text-center">
        <div className="text-[14px] font-bold">{t("noResults.title", { q: results.query })}</div>
        <p className="mt-1 text-[12.5px] text-muted-foreground">{t("noResults.hint")}</p>
      </div>
    );
  }

  const groups: { key: keyof typeof META; label: string; hits: SearchHit[] }[] = [
    { key: "note",           label: t("groups.notes"),     hits: results.notes },
    { key: "file",           label: t("groups.files"),     hits: results.files },
    { key: "task",           label: t("groups.tasks"),     hits: results.tasks },
    { key: "community_note", label: t("groups.community"), hits: results.community },
  ];

  return (
    <div className="flex flex-col gap-6">
      {groups
        .filter((g) => g.hits.length > 0)
        .map((group) => (
          <section key={group.key} aria-label={group.label}>
            <h2 className="mb-2 text-[13px] font-extrabold uppercase tracking-wide text-muted-foreground">
              {group.label} · {group.hits.length}
            </h2>
            <ul className="flex flex-col gap-2">
              {group.hits.map((hit) => {
                const meta = META[hit.entityType];
                return (
                  <li key={hit.id}>
                    <Link
                      href={hit.href}
                      className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <span
                        aria-hidden
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md ${meta.tone}`}
                      >
                        <meta.icon className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="truncate text-[14.5px] font-extrabold tracking-tight">
                            {hit.title || t("untitled")}
                          </div>
                          <div className="flex-shrink-0 text-[11px] font-semibold text-muted-foreground">
                            {formatRelativeTime(hit.createdAt)}
                          </div>
                        </div>
                        {hit.subjectName ? (
                          <div className="mt-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {hit.subjectName}
                          </div>
                        ) : null}
                        <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-muted-foreground">
                          {hit.snippet}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
    </div>
  );
}
