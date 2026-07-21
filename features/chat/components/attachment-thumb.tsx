"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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
 * expire between server render and client hydration.
 */
export function AttachmentThumb({ attachment }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
