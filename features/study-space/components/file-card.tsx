import Link from "next/link";
import { Bookmark, FileImage, FileText } from "lucide-react";

import { formatRelativeTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";

import { formatBytes, isImage } from "../lib/mime";
import type { StudyFile } from "../types";

interface FileCardProps {
  file: StudyFile;
}

export function FileCard({ file }: FileCardProps) {
  const Icon = isImage(file.mimeType) ? FileImage : FileText;

  return (
    <Link
      href={`/app/library/${file.id}`}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors",
        "hover:border-primary/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          aria-hidden
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-accent text-primary"
        >
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
        {file.isBookmarked ? (
          <Bookmark
            className="h-[18px] w-[18px] text-primary"
            fill="currentColor"
            strokeWidth={1.8}
            aria-label="Bookmarked"
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
          {file.subjectName}
          {file.chapterName ? ` · ${file.chapterName}` : ""}
        </div>
        <h3 className="line-clamp-2 text-[15px] font-bold leading-tight tracking-tight">
          {file.fileName}
        </h3>
        {file.description ? (
          <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {file.description}
          </p>
        ) : null}
      </div>
      <div className="mt-auto flex items-center justify-between text-xs font-semibold text-muted-foreground/80">
        <span>{formatBytes(file.sizeBytes)}</span>
        <span>{formatRelativeTime(file.updatedAt)}</span>
      </div>
    </Link>
  );
}
