"use server";

import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

export interface SyllabusChapter {
  id: string;
  name: string;
  sortOrder: number;
  noteCount: number;
  fileCount: number;
}

export interface SyllabusSubject {
  id: string;
  name: string;
  chapters: SyllabusChapter[];
  looseNotes: number; // notes without a chapter
  looseFiles: number; // files without a chapter
  totalNotes: number;
  totalFiles: number;
}

export interface SyllabusTree {
  subjects: SyllabusSubject[];
  totalChapters: number;
  totalNotes: number;
  totalFiles: number;
}

/**
 * Aggregates the caller's syllabus: their active subjects, chapters under
 * each subject (from Module 8 chapters table), and note/file counts per
 * chapter (from Module 20 chapter_id on notes + Module 8 chapter_id on
 * study_files).
 *
 * Done in Node after 3 flat queries — Postgres GROUP BY joins would be
 * cheaper at scale but the dataset is tiny (subjects * chapters ≈ 100 max
 * per user).
 */
export async function getSyllabusTree(): Promise<Result<SyllabusTree, ActionError>> {
  const profile = await getMyProfile();
  if (!profile) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });

  const supabase = await getSupabaseServer();
  const subjectIds = profile.subjects.map((s) => s.id);
  if (subjectIds.length === 0) {
    return ok({ subjects: [], totalChapters: 0, totalNotes: 0, totalFiles: 0 });
  }

  const [chaptersRes, notesRes, filesRes] = await Promise.all([
    supabase
      .from("chapters")
      .select("id, subject_id, name, sort_order")
      .eq("user_id", profile.userId)
      .in("subject_id", subjectIds)
      .order("sort_order", { ascending: true }),
    supabase
      .from("notes")
      .select("subject_id, chapter_id")
      .eq("user_id", profile.userId)
      .in("subject_id", subjectIds),
    supabase
      .from("study_files")
      .select("subject_id, chapter_id")
      .eq("user_id", profile.userId)
      .in("subject_id", subjectIds),
  ]);

  if (chaptersRes.error || notesRes.error || filesRes.error) {
    return err({ code: "DB", message: "Couldn't load your syllabus." });
  }

  // Bucket notes/files by (subject_id, chapter_id). null chapter = "loose".
  const noteCounts = new Map<string, number>(); // key: `${subjectId}:${chapterId ?? "loose"}`
  for (const row of notesRes.data ?? []) {
    const key = `${row.subject_id}:${row.chapter_id ?? "loose"}`;
    noteCounts.set(key, (noteCounts.get(key) ?? 0) + 1);
  }
  const fileCounts = new Map<string, number>();
  for (const row of filesRes.data ?? []) {
    const key = `${row.subject_id}:${row.chapter_id ?? "loose"}`;
    fileCounts.set(key, (fileCounts.get(key) ?? 0) + 1);
  }

  const chaptersBySubject = new Map<string, SyllabusChapter[]>();
  for (const row of chaptersRes.data ?? []) {
    const arr = chaptersBySubject.get(row.subject_id) ?? [];
    arr.push({
      id: row.id,
      name: row.name,
      sortOrder: row.sort_order,
      noteCount: noteCounts.get(`${row.subject_id}:${row.id}`) ?? 0,
      fileCount: fileCounts.get(`${row.subject_id}:${row.id}`) ?? 0,
    });
    chaptersBySubject.set(row.subject_id, arr);
  }

  const subjects: SyllabusSubject[] = profile.subjects.map((s) => {
    const chapters = chaptersBySubject.get(s.id) ?? [];
    const looseNotes = noteCounts.get(`${s.id}:loose`) ?? 0;
    const looseFiles = fileCounts.get(`${s.id}:loose`) ?? 0;
    const totalNotes =
      looseNotes + chapters.reduce((sum, c) => sum + c.noteCount, 0);
    const totalFiles =
      looseFiles + chapters.reduce((sum, c) => sum + c.fileCount, 0);
    return {
      id: s.id,
      name: s.name,
      chapters,
      looseNotes,
      looseFiles,
      totalNotes,
      totalFiles,
    };
  });

  const totalChapters = subjects.reduce((sum, s) => sum + s.chapters.length, 0);
  const totalNotes = subjects.reduce((sum, s) => sum + s.totalNotes, 0);
  const totalFiles = subjects.reduce((sum, s) => sum + s.totalFiles, 0);

  return ok({ subjects, totalChapters, totalNotes, totalFiles });
}
