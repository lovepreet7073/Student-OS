import type { NoteListItem } from "../types";
import { NoteCard } from "./note-card";

interface NotesGridProps {
  notes: NoteListItem[];
}

const TONES: { color: string; tint: string }[] = [
  { color: "#E5533C", tint: "rgba(229, 83, 60, 0.12)" },
  { color: "#5B5FDB", tint: "rgba(91, 95, 219, 0.12)" },
  { color: "#E8A13A", tint: "rgba(232, 161, 58, 0.12)" },
  { color: "#2FB57C", tint: "rgba(47, 181, 124, 0.12)" },
  { color: "#8B5CF6", tint: "rgba(139, 92, 246, 0.12)" },
];

function stableToneFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length]!;
}

export function NotesGrid({ notes }: NotesGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} tone={stableToneFor(note.subjectSlug)} />
      ))}
    </div>
  );
}
