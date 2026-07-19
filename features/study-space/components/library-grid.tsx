import type { StudyFile } from "../types";
import { FileCard } from "./file-card";

interface LibraryGridProps {
  files: StudyFile[];
}

export function LibraryGrid({ files }: LibraryGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {files.map((file) => (
        <FileCard key={file.id} file={file} />
      ))}
    </div>
  );
}
