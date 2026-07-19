"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Subject } from "@/features/academic-identity/types";
import { getSupabaseBrowser } from "@/lib/supabase/client";

import { beginUpload } from "../actions/begin-upload";
import { completeUpload } from "../actions/complete-upload";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  formatBytes,
  isAllowedMime,
} from "../lib/mime";

interface FileUploadButtonProps {
  subjects: Subject[];
  defaultSubjectId?: string;
  defaultChapterId?: string | null;
}

const ACCEPT_ATTR = ALLOWED_MIME_TYPES.join(",");

/**
 * Uploads happen in three steps:
 *   1. `beginUpload` server action → returns { fileId, storagePath, bucket }
 *   2. Client `supabase.storage.upload(...)` direct-to-Storage (RLS enforced)
 *   3. `completeUpload` server action → inserts DB row
 *
 * If step 2 or 3 fails, we try to remove the orphan Storage object.
 */
export function FileUploadButton({
  subjects,
  defaultSubjectId,
  defaultChapterId,
}: FileUploadButtonProps) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [progressLabel, setProgressLabel] = useState("");

  const subjectId = defaultSubjectId ?? subjects[0]?.id;

  const handleClick = () => fileInput.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!subjectId) {
      toast.error("Pick a subject in your profile first.");
      return;
    }
    if (!isAllowedMime(file.type)) {
      toast.error("Only PDF and image files (PNG, JPG) are supported.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File is too large (max 25 MB). This one is ${formatBytes(file.size)}.`);
      return;
    }

    startTransition(async () => {
      setProgressLabel("Preparing…");
      const begin = await beginUpload({
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });
      if (!begin.ok) {
        toast.error(begin.error.message);
        setProgressLabel("");
        return;
      }

      setProgressLabel(`Uploading ${formatBytes(file.size)}…`);
      const supabase = getSupabaseBrowser();
      const { error: uploadErr } = await supabase.storage
        .from(begin.data.bucket)
        .upload(begin.data.storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadErr) {
        toast.error(`Upload failed: ${uploadErr.message}`);
        setProgressLabel("");
        return;
      }

      setProgressLabel("Saving…");
      const complete = await completeUpload({
        fileId: begin.data.fileId,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        storagePath: begin.data.storagePath,
        subjectId,
        chapterId: defaultChapterId ?? null,
      });

      if (!complete.ok) {
        // Best-effort orphan cleanup
        await supabase.storage.from(begin.data.bucket).remove([begin.data.storagePath]);
        toast.error(complete.error.message);
        setProgressLabel("");
        return;
      }

      setProgressLabel("");
      toast.success(`${file.name} uploaded`);
      router.refresh();
    });
  };

  return (
    <>
      <input
        ref={fileInput}
        type="file"
        accept={ACCEPT_ATTR}
        onChange={handleChange}
        className="hidden"
        aria-hidden
      />
      <Button
        type="button"
        onClick={handleClick}
        disabled={pending || !subjectId}
        loading={pending}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {progressLabel || "Uploading…"}
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" aria-hidden />
            Upload
          </>
        )}
      </Button>
    </>
  );
}
