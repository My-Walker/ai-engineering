import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { cjkBigramPreprocess } from "./fts.js";
import {
  listActiveCanonical,
  listAllCanonicalIncludingSuperseded,
  type CanonicalDoc,
} from "../store/fs-canonical.js";
import { memoryPaths } from "../paths.js";

export type MemoryDb = Database.Database;

const OPEN = new Map<string, MemoryDb>();

export type EntryRow = {
  id: string;
  topic: string;
  path: string;
  title: string;
  summary: string;
  status: string;
  updated_at: string;
  content_hash: string;
  fts_text: string;
  embedding: Buffer | null;
};

export function openDb(memoryRoot: string): MemoryDb {
  const cached = OPEN.get(memoryRoot);
  if (cached) return cached;
  const { db: dbPath, index } = memoryPaths(memoryRoot);
  mkdirSync(index, { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      path TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      status TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      fts_text TEXT NOT NULL,
      embedding BLOB
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
      id UNINDEXED,
      title,
      summary,
      fts_text,
      tokenize = 'unicode61'
    );
  `);
  OPEN.set(memoryRoot, db);
  return db;
}

export function closeDb(memoryRoot: string): void {
  const db = OPEN.get(memoryRoot);
  if (!db) return;
  OPEN.delete(memoryRoot);
  try {
    db.close();
  } catch {
    /* ignore */
  }
}

export function upsertEntry(
  db: MemoryDb,
  doc: CanonicalDoc,
  embedding?: Buffer | null,
): void {
  const fts_text = cjkBigramPreprocess(
    `${doc.frontmatter.title}\n${doc.frontmatter.summary}\n${doc.body}`,
  );
  const emb =
    embedding === undefined
      ? (
          db.prepare(`SELECT embedding FROM entries WHERE id = ?`).get(doc.frontmatter.id) as
            | { embedding: Buffer | null }
            | undefined
        )?.embedding ?? null
      : embedding;

  db.prepare(
    `INSERT INTO entries (id, topic, path, title, summary, status, updated_at, content_hash, fts_text, embedding)
     VALUES (@id, @topic, @path, @title, @summary, @status, @updated_at, @content_hash, @fts_text, @embedding)
     ON CONFLICT(id) DO UPDATE SET
       topic=excluded.topic, path=excluded.path, title=excluded.title, summary=excluded.summary,
       status=excluded.status, updated_at=excluded.updated_at, content_hash=excluded.content_hash,
       fts_text=excluded.fts_text, embedding=excluded.embedding`,
  ).run({
    id: doc.frontmatter.id,
    topic: doc.frontmatter.topic,
    path: doc.relativePath,
    title: doc.frontmatter.title,
    summary: doc.frontmatter.summary,
    status: doc.frontmatter.status,
    updated_at: doc.frontmatter.updated_at,
    content_hash: doc.frontmatter.content_hash,
    fts_text,
    embedding: emb,
  });
  db.prepare(`DELETE FROM entries_fts WHERE id = ?`).run(doc.frontmatter.id);
  db.prepare(
    `INSERT INTO entries_fts (id, title, summary, fts_text) VALUES (?, ?, ?, ?)`,
  ).run(
    doc.frontmatter.id,
    cjkBigramPreprocess(doc.frontmatter.title),
    cjkBigramPreprocess(doc.frontmatter.summary),
    fts_text,
  );
}

export function deleteEntry(db: MemoryDb, id: string): void {
  db.prepare(`DELETE FROM entries_fts WHERE id = ?`).run(id);
  db.prepare(`DELETE FROM entries WHERE id = ?`).run(id);
}

export function reindexFromFiles(memoryRoot: string, db: MemoryDb): number {
  db.exec(`DELETE FROM entries_fts; DELETE FROM entries;`);
  const docs = listAllCanonicalIncludingSuperseded(memoryRoot);
  for (const doc of docs) {
    upsertEntry(db, doc, null);
  }
  return docs.length;
}

export function setEntryEmbedding(db: MemoryDb, id: string, vec: Float32Array): void {
  const buf = Buffer.from(vec.buffer, vec.byteOffset, vec.byteLength);
  db.prepare(`UPDATE entries SET embedding = ? WHERE id = ?`).run(buf, id);
}

export function listActiveRows(db: MemoryDb, topic?: string): EntryRow[] {
  if (topic) {
    return db
      .prepare(
        `SELECT * FROM entries WHERE status = 'active' AND topic = ? ORDER BY updated_at DESC`,
      )
      .all(topic) as EntryRow[];
  }
  return db
    .prepare(`SELECT * FROM entries WHERE status = 'active' ORDER BY updated_at DESC`)
    .all() as EntryRow[];
}

export function ftsSearch(db: MemoryDb, match: string, limit: number): EntryRow[] {
  try {
    return db
      .prepare(
        `SELECT e.* FROM entries_fts f
         JOIN entries e ON e.id = f.id
         WHERE entries_fts MATCH ? AND e.status = 'active'
         LIMIT ?`,
      )
      .all(match, limit) as EntryRow[];
  } catch {
    return [];
  }
}

export function ensureDb(memoryRoot: string): MemoryDb {
  const db = openDb(memoryRoot);
  const count = db.prepare(`SELECT COUNT(*) AS c FROM entries`).get() as { c: number };
  if (count.c === 0 && listActiveCanonical(memoryRoot).length > 0) {
    reindexFromFiles(memoryRoot, db);
  }
  return db;
}

export function bufferToFloat32(buf: Buffer | null): Float32Array | null {
  if (!buf) return null;
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}
