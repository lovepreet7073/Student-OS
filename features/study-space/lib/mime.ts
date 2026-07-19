import type { StudyFileMime } from "../types";

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const STORAGE_BUCKET = "study-files";

export const ALLOWED_MIME_TYPES: readonly StudyFileMime[] = [
  "application/pdf",
  "image/png",
  "image/jpeg",
];

export function isAllowedMime(m: string): m is StudyFileMime {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(m);
}

export function extForMime(mime: StudyFileMime): string {
  switch (mime) {
    case "application/pdf": return "pdf";
    case "image/png":       return "png";
    case "image/jpeg":      return "jpg";
  }
}

export function isImage(mime: string): boolean {
  return mime === "image/png" || mime === "image/jpeg";
}

export function isPdf(mime: string): boolean {
  return mime === "application/pdf";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}
