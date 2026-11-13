/** CJK bigram preprocess for FTS5 (write & query must match). */

const CJK_RE =
  /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3040-\u30FF\uAC00-\uD7AF]+/g;

export function cjkBigramPreprocess(text: string): string {
  const parts: string[] = [];
  let last = 0;
  for (const match of text.matchAll(CJK_RE)) {
    const idx = match.index ?? 0;
    if (idx > last) {
      parts.push(...tokenizeLatin(text.slice(last, idx)));
    }
    parts.push(...bigrams(match[0]));
    last = idx + match[0].length;
  }
  if (last < text.length) parts.push(...tokenizeLatin(text.slice(last)));
  return parts.filter(Boolean).join(" ");
}

function tokenizeLatin(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9_]+/i)
    .filter(Boolean);
}

function bigrams(run: string): string[] {
  const chars = [...run];
  if (chars.length === 0) return [];
  if (chars.length === 1) return chars;
  const out: string[] = [];
  for (let i = 0; i < chars.length - 1; i++) {
    out.push(chars[i] + chars[i + 1]);
  }
  return out;
}

export function buildFtsMatchQuery(userQuery: string): {
  match: string;
  bigramCount: number;
  mode: "or" | "ratio";
} {
  const tokens = cjkBigramPreprocess(userQuery)
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `"${t.replace(/"/g, "")}"`);
  const bigramCount = tokens.length;
  if (bigramCount === 0) {
    return { match: '""', bigramCount: 0, mode: "or" };
  }
  if (bigramCount <= 2) {
    return { match: tokens.join(" OR "), bigramCount, mode: "or" };
  }
  // longer: OR all, rank by hit ratio in search layer
  return { match: tokens.join(" OR "), bigramCount, mode: "ratio" };
}

export function hitRatio(ftsText: string, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 0;
  const set = new Set(ftsText.split(/\s+/));
  let hit = 0;
  for (const t of queryTokens) {
    if (set.has(t.replace(/"/g, ""))) hit++;
  }
  return hit / queryTokens.length;
}
