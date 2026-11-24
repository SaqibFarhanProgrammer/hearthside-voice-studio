/**
 * Sentence-aware chunking for long scripts. Handles Latin (. ! ? …),
 * Urdu (۔ ؟) and Devanagari (। ॥) sentence endings, and treats blank lines
 * and line breaks as hard boundaries so paragraphs are never merged mid-sentence.
 */
const SENTENCE_RE = /[^.!?…۔؟।॥\n]+(?:[.!?…۔؟।॥]+["'”’)\]]*)?|\n+/g;
const CLAUSE_RE = /[^,،;:]+[,،;:]?/g;

function splitLong(sentence: string, maxChars: number): string[] {
  const out: string[] = [];
  let current = "";
  const push = () => {
    const c = current.trim();
    if (c) out.push(c);
    current = "";
  };
  const clauses = sentence.match(CLAUSE_RE) ?? [sentence];
  for (const clause of clauses) {
    if (clause.length > maxChars) {
      push();
      for (const word of clause.split(/\s+/)) {
        if (!word) continue;
        if ((current + " " + word).trim().length > maxChars) push();
        current = current ? `${current} ${word}` : word;
      }
      continue;
    }
    if ((current + clause).trim().length > maxChars) push();
    current += clause;
  }
  push();
  return out;
}

export function splitIntoChunks(text: string, maxChars: number): string[] {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];

  const sentences = normalized.match(SENTENCE_RE) ?? [normalized];
  const chunks: string[] = [];
  let current = "";
  const push = () => {
    const c = current.trim();
    if (c) chunks.push(c);
    current = "";
  };

  for (const raw of sentences) {
    if (raw.startsWith("\n")) {
      push();
      continue;
    }
    const sentence = raw.trim();
    if (!sentence) continue;
    if (sentence.length > maxChars) {
      push();
      chunks.push(...splitLong(sentence, maxChars));
      continue;
    }
    if (current && current.length + 1 + sentence.length > maxChars) push();
    current = current ? `${current} ${sentence}` : sentence;
  }
  push();
  return chunks;
}
