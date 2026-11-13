import type { RuntimeContext } from "../config.js";
import type { NearMatch, Topic } from "../types.js";
import {
  ensureDb,
  ftsSearch,
  listActiveRows,
  setEntryEmbedding,
  bufferToFloat32,
  type EntryRow,
  type MemoryDb,
} from "./db.js";
import { buildFtsMatchQuery, cjkBigramPreprocess, hitRatio } from "./fts.js";
import { cosine, embedPassage, embedQuery, getEmbedStatus } from "./embed.js";
import { findById } from "../store/fs-canonical.js";

export type SearchHit = {
  id: string;
  path: string;
  title: string;
  summary: string;
  topic: string;
  score: number;
};

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

export async function searchMemory(
  rt: RuntimeContext,
  query: string,
  opts?: { topK?: number; topic?: Topic },
): Promise<{ hits: SearchHit[]; embedding: string }> {
  const db = ensureDb(rt.memoryRoot);
  const topK = opts?.topK ?? rt.config.search.top_k;
  const { match, bigramCount, mode } = buildFtsMatchQuery(query);
  let rows = ftsSearch(db, match, Math.max(topK * 5, 20));
  if (opts?.topic) rows = rows.filter((r) => r.topic === opts.topic);

  const qTokens = cjkBigramPreprocess(query).split(/\s+/).filter(Boolean);
  let scored = rows.map((r) => ({
    row: r,
    score: mode === "ratio" ? hitRatio(r.fts_text, qTokens) : 1 / (1 + (rows.indexOf(r) || 0)),
  }));
  if (mode === "ratio") {
    scored = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  }

  let embeddingMeta = getEmbedStatus();
  if (rt.config.semantic.enabled) {
    const qVec = await embedQuery(query, rt.config, rt.embeddingCacheDir);
    embeddingMeta = getEmbedStatus();
    if (qVec) {
      const pool = scored.length > 0 ? scored.map((s) => s.row) : listActiveRows(db, opts?.topic);
      const reranked: { row: EntryRow; score: number }[] = [];
      for (const row of pool.slice(0, 50)) {
        let vec = bufferToFloat32(row.embedding);
        if (!vec) {
          const doc = findById(rt.memoryRoot, row.id);
          if (doc) {
            vec = await embedPassage(
              `${doc.frontmatter.title}\n${doc.frontmatter.summary}\n${doc.body}`,
              rt.config,
              rt.embeddingCacheDir,
            );
            if (vec) setEntryEmbedding(db, row.id, vec);
          }
        }
        if (vec) {
          reranked.push({ row, score: cosine(qVec, vec) });
        } else {
          const existing = scored.find((s) => s.row.id === row.id);
          reranked.push({ row, score: existing?.score ?? 0 });
        }
      }
      scored = reranked.sort((a, b) => b.score - a.score);
    }
  }

  const maxSum = rt.config.search.probe_summary_max_chars;
  const hits = scored.slice(0, topK).map((s) => ({
    id: s.row.id,
    path: s.row.path,
    title: s.row.title,
    summary: truncate(s.row.summary, maxSum),
    topic: s.row.topic,
    score: s.score,
  }));
  return { hits, embedding: embeddingMeta };
}

export async function findNearMatches(
  rt: RuntimeContext,
  db: MemoryDb,
  topic: Topic,
  text: string,
): Promise<NearMatch[]> {
  if (!rt.config.semantic.enabled) return [];
  const qVec = await embedPassage(text, rt.config, rt.embeddingCacheDir);
  if (!qVec) return [];
  const rows = listActiveRows(db, topic);
  const thr = rt.config.semantic.similarity_threshold;
  const k = rt.config.semantic.near_top_k;
  const scored: NearMatch[] = [];
  for (const row of rows) {
    let vec = bufferToFloat32(row.embedding);
    if (!vec) {
      const doc = findById(rt.memoryRoot, row.id);
      if (!doc) continue;
      vec = await embedPassage(
        `${doc.frontmatter.title}\n${doc.frontmatter.summary}\n${doc.body}`,
        rt.config,
        rt.embeddingCacheDir,
      );
      if (vec) setEntryEmbedding(db, row.id, vec);
    }
    if (!vec) continue;
    const score = cosine(qVec, vec);
    if (score >= thr) {
      scored.push({
        id: row.id,
        path: row.path,
        title: row.title,
        summary: row.summary,
        score,
      });
    }
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, k);
}
