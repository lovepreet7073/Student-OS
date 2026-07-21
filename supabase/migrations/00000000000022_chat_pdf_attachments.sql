-- Chat PDF attachments (Module 44)
--
-- Extends the chat-attachments bucket to accept PDFs. Same lifecycle,
-- same RLS — Gemini 1.5 handles PDF `inlineData` parts natively so no
-- code changes in the API route beyond mime allowlist updates (which
-- landed in `features/chat/schemas/chat.ts` alongside this migration).
--
-- We bump the size limit from 10 MB → 25 MB because scanned textbook
-- pages routinely exceed 10 MB. 25 MB is still comfortably under
-- Gemini's inline-data cap (~20 MB per request; PDFs come in near the
-- ceiling but stay under).

update storage.buckets
   set allowed_mime_types = array[
         'image/png',
         'image/jpeg',
         'image/webp',
         'application/pdf'
       ],
       file_size_limit    = 26214400
 where id = 'chat-attachments';
