export function chunkText(text, { chunkSize = 900, chunkOverlap = 120 } = {}) {
  const normalized = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const chunks = [];
  let start = 0;

  while (start < normalized.length) {
    const targetEnd = Math.min(normalized.length, start + chunkSize);
    const end = findNaturalBreak(normalized, start, targetEnd);
    const content = normalized.slice(start, end).trim();
    if (content) {
      chunks.push({
        id: `chunk_${chunks.length + 1}`,
        content,
        start,
        end
      });
    }
    if (end >= normalized.length) break;
    start = Math.max(end - chunkOverlap, start + 1);
  }

  return chunks;
}

function findNaturalBreak(text, start, targetEnd) {
  if (targetEnd >= text.length) return text.length;

  const window = text.slice(start, targetEnd);
  const paragraph = window.lastIndexOf("\n\n");
  if (paragraph > 200) return start + paragraph;

  const sentence = Math.max(window.lastIndexOf(". "), window.lastIndexOf("? "), window.lastIndexOf("! "));
  if (sentence > 200) return start + sentence + 1;

  const space = window.lastIndexOf(" ");
  return space > 200 ? start + space : targetEnd;
}
