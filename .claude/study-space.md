# My Study Space

Private per-user file library. PDFs, PNG, JPG uploaded to a private Supabase
Storage bucket. DB rows hold metadata + scope FKs; Storage holds bytes.

## Tables

```
public.chapters             (user-owned folders inside a subject)
├── id, user_id, subject_id (FK, cascade)
├── name, sort_order
└── created_at, updated_at

public.study_files
├── id, user_id
├── board_id, class_id, medium_id, subject_id  (scope FKs, restrict)
├── chapter_id  (nullable, ON DELETE SET NULL — "Unfiled")
├── file_name, mime_type, size_bytes
├── storage_path  UNIQUE                     (bucket key)
├── description  (nullable, ≤ 500)
├── is_bookmarked
└── created_at, updated_at
```

`storage_path` UNIQUE prevents two rows pointing at the same object.

## Storage — private bucket + path convention

- **Bucket:** `study-files` (private, 25 MB limit, allowed mimes locked at DB and bucket level)
- **Path:** `{user_id}/{file_id}.{ext}` — the user's own UUID is the FIRST path segment
- **RLS:** `(storage.foldername(name))[1] = auth.uid()::text` → **the DB itself refuses cross-user access**

The `foldername()` trick means we never have to trust the client. A user's
JWT allows writes only within their own folder. If someone tries to write to
`{other_user_id}/foo.pdf`, RLS refuses.

## Upload flow — three steps, direct-to-Storage

```
1.  beginUpload({ fileName, mimeType, sizeBytes })
     → server generates fileId (UUIDv4) + storagePath = `{user_id}/{fileId}.{ext}`
     → returns { fileId, storagePath, bucket }

2.  supabase.storage.from(bucket).upload(storagePath, file)    ← client, direct
     → uses user's JWT, RLS on storage.objects enforced

3.  completeUpload({ fileId, storagePath, subjectId, chapterId?, description? })
     → server inserts study_files row
     → if this fails, client removes the orphan Storage object (best effort)
```

Bandwidth never crosses our Next.js server. Files as large as 25 MB stream
straight from browser to Storage. Only metadata (small strings) hits our
Server Actions.

## Server Actions — [features/study-space/actions/](../features/study-space/actions/)

| Action                | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| `beginUpload`         | Reserve fileId + storagePath                         |
| `completeUpload`      | Insert DB row; server-side cleanup on failure        |
| `listLibraryItems`    | Scope + subject/chapter/bookmarked/search filters    |
| `getFileMetadata`     | Single file row + subject/chapter names              |
| `getFileUrl`          | 1-hour signed URL for view/download                  |
| `deleteFile`          | Storage remove → DB delete (Storage-first ordering)  |
| `toggleFileBookmark`  | Explicit boolean update                              |
| `listChapters`        | User's chapters across their active subjects         |
| `createChapter`       | Auto sort_order = max+1                              |
| `deleteChapter`       | Files inside get `chapter_id = NULL` via FK          |

**Storage-first delete ordering** — if Storage remove succeeds but DB delete
fails, the row is visible & retryable. If we went DB-first, an orphan blob
would be invisible.

## Signed URL viewer

`getFileUrl` returns a URL good for 1 hour. Client uses it in `<img>` for
images or `<object type="application/pdf">` for PDFs (with an "open in new
tab" fallback for browsers without inline PDF support).

On tab-open longer than 1 hour, refresh gets a new URL — no client-side
refresh loop yet (add if needed).

## URL-synced filters — [library-toolbar.tsx](../features/study-space/components/library-toolbar.tsx)

```
?subject=<uuid>&chapter=<uuid>&bookmarked=1&q=<search>
```

`router.replace()` — no history bloat.

Chapter chips only appear once a subject filter is active AND that subject
has chapters (otherwise the row would be empty clutter).

## Discovery

- `/app/library` accessed via:
  - **"Study Space" icon** in the Notes page header (folder icon)
  - Direct URL

- Not in the 5-item nav (nav is locked). If we hit 6+ features that deserve
  nav, we redesign nav (drawer / more-menu).

## Failure modes

| Failure                          | UX                                                            |
| -------------------------------- | ------------------------------------------------------------- |
| File exceeds 25 MB               | Client-side toast before hitting the network                  |
| File type not PDF/PNG/JPG        | Client + server both refuse; toast surfaces reason            |
| Upload succeeds but DB insert fails | Best-effort Storage cleanup; user retries                  |
| Signed URL expires (>1h)         | Reload; a fresh URL is fetched                                |
| User tries `?subject=<invalid>`  | Returns empty list (not error) — matches Notes filter behavior |

## What this module does NOT do (yet)

- **AI actions on files** ("Summarize this PDF", "Explain this diagram") →
  Uses `generateStructured` + Gemini Vision. Ships in a later AI module.
- **Sharing** → Module 10 (Community)
- **DOCX / PPT / audio** → PDF + images only for MVP
- **Multi-file bulk upload** → one at a time
- **In-app PDF annotation**  → view + download only
- **Thumbnail generation** → cards show a type icon, not a rendered preview
- **Nightly orphan cleanup** → documented, not built. Add when Storage grows

## Improvement ideas for later

1. **Nightly orphan sweep** — DB job compares Storage listing to study_files rows
2. **Thumbnails** for PDF (first-page render) + resized image previews
3. **Move / reorganize** — drag files between chapters
4. **Chapter reorder** via `sort_order` drag
5. **AI extract** — Gemini Vision → auto-populate description from file contents
6. **Search inside PDFs** — index text via a small worker; store in `pgvector`
