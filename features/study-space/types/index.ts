export type StudyFileMime = "application/pdf" | "image/png" | "image/jpeg";

export type Chapter = {
  id: string;
  userId: string;
  subjectId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type StudyFile = {
  id: string;
  userId: string;
  boardId: string;
  classId: string;
  mediumId: string;
  subjectId: string;
  subjectName: string;
  chapterId: string | null;
  chapterName: string | null;
  fileName: string;
  mimeType: StudyFileMime;
  sizeBytes: number;
  storagePath: string;
  description: string | null;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChapterWithCount = Chapter & {
  fileCount: number;
};

export type LibraryQuery = {
  subjectId?: string;
  chapterId?: string;
  bookmarkedOnly?: boolean;
  search?: string;
  limit?: number;
};
