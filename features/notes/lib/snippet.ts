/**
 * Strips light markdown and collapses whitespace to produce a preview snippet
 * for note cards. Intentionally simple — a real Markdown parser is overkill
 * for a 120-char preview.
 */
export function buildSnippet(content: string, maxLen = 140): string {
  const cleaned = content
    // headings, list markers, bold/italic markers
    .replace(/^#+\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    // links: [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // collapse whitespace
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= maxLen) return cleaned;
  return `${cleaned.slice(0, maxLen - 1).trimEnd()}…`;
}
