"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

import { isImage, isPdf } from "../lib/mime";
import type { StudyFileMime } from "../types";

interface FileViewerProps {
  url: string | null;
  fileName: string;
  mimeType: StudyFileMime;
  error?: string | null;
}

/**
 * Renders a PDF or image using a pre-fetched signed URL. The parent owns the
 * URL fetch so we don't double-round-trip.
 *
 *   - PDF   → <object type="application/pdf"> with "open in new tab" fallback
 *   - image → responsive <img>
 */
export function FileViewer({ url, fileName, mimeType, error }: FileViewerProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-danger/30 bg-danger/5 p-8 text-center text-sm text-danger">
        <AlertTriangle className="h-5 w-5" aria-hidden />
        {error}
      </div>
    );
  }

  if (!url) {
    return (
      <div
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading preview…
      </div>
    );
  }

  if (isImage(mimeType)) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={fileName}
          className="h-auto w-full object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  if (isPdf(mimeType)) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <object
          data={url}
          type="application/pdf"
          className="h-[70vh] w-full min-h-[400px]"
          aria-label={fileName}
        >
          <div className="flex flex-col items-center gap-3 p-8 text-center text-sm text-muted-foreground">
            Your browser can&rsquo;t preview PDFs inline.{" "}
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-primary hover:underline"
            >
              Open in a new tab
            </a>
          </div>
        </object>
      </div>
    );
  }

  return null;
}
