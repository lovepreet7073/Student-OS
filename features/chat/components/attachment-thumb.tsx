"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FileText } from "lucide-react";

import { getAttachmentUrl } from "../actions/get-attachment-url";
import type { ChatAttachment } from "../types";

interface Props {
  attachment: ChatAttachment;
}

/**
 * Renders a persisted attachment. RLS on `storage.objects` gates access —
 * only the owner can mint a signed URL. Attachments live for the lifetime
 * of the chat.
 *
 * We fetch the signed URL client-side on mount so signed URLs don't
 * expire between server render and client hydration. PDFs render as a
 * clickable file card (there's no useful inline preview at chat scale);
 * images render as an <Image>.
 */
export function AttachmentThumb({ attachment }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isPdf = attachment.mimeType === "application/pdf";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getAttachmentUrl(attachment.path);
      if (cancelled) return;
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setUrl(res.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [attachment.path]);

  if (error) {
    return (
      <div className="rounded-md border border-danger/30 bg-danger/5 px-2 py-1 text-[11px] text-danger">
        {error}
      </div>
    );
  }

  if (!url) {
    return (
      <div className="h-32 w-32 animate-pulse rounded-md bg-muted" aria-hidden />
    );
  }

  if (isPdf) {
    const filename = attachment.path.split("/").at(-1) ?? "document.pdf";
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-[12.5px] font-bold text-foreground hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          aria-hidden
          className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-accent/15 text-brand-accent"
        >
          <FileText className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="max-w-[180px] truncate">{filename}</span>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="block max-w-[220px] overflow-hidden rounded-md border border-border"
    >
      <Image
        src={url}
        alt="Attached image"
        width={220}
        height={220}
        unoptimized
        className="h-auto max-h-[220px] w-auto object-contain"
      />
    </a>
  );
}
