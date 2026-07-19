export type SearchEntityType = "note" | "file" | "task" | "community_note";

export interface SearchHit {
  id: string;
  entityType: SearchEntityType;
  href: string;
  title: string;
  snippet: string;
  subjectName: string | null;
  createdAt: string;
}

export interface SearchResults {
  query: string;
  notes: SearchHit[];
  files: SearchHit[];
  tasks: SearchHit[];
  community: SearchHit[];
  total: number;
}
