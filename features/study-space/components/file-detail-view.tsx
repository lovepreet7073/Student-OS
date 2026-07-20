"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  ArrowLeft,
  Bookmark,
  Download,
  ExternalLink,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";

import { deleteFile } from "../actions/delete-file";
import { getFileUrl } from "../actions/get-file-url";
import { toggleFileBookmark } from "../actions/toggle-bookmark";
import { formatBytes } from "../lib/mime";
import type { StudyFile } from "../types";
import { FileAiActions } from "./file-ai-actions";
import { FileViewer } from "./file-viewer";

const AI_MAX_BYTES = 15 * 1024 * 1024;

interface FileDetailViewProps {
  file: StudyFile;
}

export function FileDetailView({ file }: FileDetailViewProps) {
  const [bookmarked, setBookmarked] = useState(file.isBookmarked);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [bookmarking, startBookmarkTransition] = useTransition();
  const [deleting, startDeleteTransition] = useTransition();

  // One URL fetch, shared between the action buttons AND <FileViewer>.
  useEffect(() => {
    let cancelled = false;
    setSignedUrl(null);
    setUrlError(null);
    getFileUrl(file.id).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setUrlError(result.error.message);
        return;
      }
      setSignedUrl(result.data.url);
    });
    return () => {
      cancelled = true;
    };
  }, [file.id]);

  const handleBookmark = () => {
    const next = !bookmarked;
    setBookmarked(next);
    startBookmarkTransition(async () => {
      const result = await toggleFileBookmark({ id: file.id, isBookmarked: next });
      if (!result.ok) {
        toast.error(result.error.message);
        setBookmarked(!next);
      }
    });
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await deleteFile({ id: file.id }, { redirectTo: "/app/library" });
      if (result && !result.ok) toast.error(result.error.message);
    });
  };

  return (
    <div className="mx-auto max-w-[900px] px-5 pb-10 pt-4 sm:px-7 sm:pt-6 lg:px-11 lg:pt-8">
      <nav aria-label="Back to library" className="mb-4 flex items-center gap-3">
        <Button asChild variant="outline" size="icon" aria-label="Back">
          <Link href="/app/library">
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {file.subjectName}
            {file.chapterName ? ` · ${file.chapterName}` : ""}
          </div>
          <h1 className="truncate text-[20px] font-extrabold tracking-tight sm:text-[24px]">
            {file.fileName}
          </h1>
          <div className="mt-0.5 text-xs font-semibold text-muted-foreground/80">
            {formatBytes(file.sizeBytes)} · {formatRelativeTime(file.updatedAt)}
          </div>
        </div>
      </nav>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleBookmark}
          disabled={bookmarking}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark file"}
        >
          <Bookmark
            className={cn(
              "h-[18px] w-[18px]",
              bookmarked ? "text-primary" : "text-muted-foreground",
            )}
            fill={bookmarked ? "currentColor" : "none"}
            strokeWidth={1.8}
          />
        </Button>
        {signedUrl ? (
          <>
            <Button asChild variant="outline">
              <a href={signedUrl} download={file.fileName}>
                <Download className="h-4 w-4" aria-hidden />
                Download
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={signedUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" aria-hidden />
                Open in new tab
              </a>
            </Button>
          </>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Delete file"
          className="ml-auto"
        >
          <Trash2 className="h-[18px] w-[18px] text-danger" aria-hidden />
        </Button>
      </div>

      {file.description ? (
        <p className="mb-5 rounded-md bg-secondary p-3.5 text-[13.5px] leading-relaxed text-foreground">
          {file.description}
        </p>
      ) : null}

      <section
        aria-labelledby="file-ai-title"
        className="mb-5 rounded-xl border border-primary/25 bg-accent/60 p-4"
      >
        <div className="mb-1 flex items-center gap-2">
          <span
            aria-hidden
            className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/12 text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
          </span>
          <h2
            id="file-ai-title"
            className="text-[12.5px] font-bold uppercase tracking-wider text-accent-foreground"
          >
            AI on this document
          </h2>
        </div>
        <p className="mb-3 text-[12px] text-muted-foreground">
          Summarise the whole PDF, pull out key points, or explain it in simpler words.
        </p>
        {file.sizeBytes > AI_MAX_BYTES ? (
          <p className="text-[12px] font-semibold text-danger">
            AI can't read files over 15 MB yet. Upload a smaller PDF or image.
          </p>
        ) : (
          <FileAiActions fileId={file.id} />
        )}
      </section>

      <FileViewer
        url={signedUrl}
        fileName={file.fileName}
        mimeType={file.mimeType}
        error={urlError}
      />
    </div>
  );
}
