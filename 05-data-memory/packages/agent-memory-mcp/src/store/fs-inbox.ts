import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { parseMdFile, stringifyMd, nowIso, newId } from "../md.js";
import type { InboxFrontmatter, InboxSourceType, Topic } from "../types.js";

export type InboxDoc = {
  path: string;
  frontmatter: InboxFrontmatter;
  body: string;
};

export function ensureInboxDir(memoryRoot: string): void {
  mkdirSync(join(memoryRoot, "inbox"), { recursive: true });
}

export function listInbox(memoryRoot: string): InboxDoc[] {
  const dir = join(memoryRoot, "inbox");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith(".md"))
    .map((n) => readInboxFile(join(dir, n)))
    .filter((d): d is InboxDoc => !!d)
    .sort((a, b) => b.frontmatter.created_at.localeCompare(a.frontmatter.created_at));
}

export function readInboxFile(fullPath: string): InboxDoc | null {
  if (!existsSync(fullPath)) return null;
  const { data, content } = parseMdFile(readFileSync(fullPath, "utf8"));
  const fm = data as Partial<InboxFrontmatter>;
  if (!fm.id) return null;
  return {
    path: fullPath,
    frontmatter: {
      status: "pending",
      source_type: "host",
      created_at: nowIso(),
      ...fm,
    } as InboxFrontmatter,
    body: content,
  };
}

export function findInboxById(memoryRoot: string, id: string): InboxDoc | null {
  return listInbox(memoryRoot).find((d) => d.frontmatter.id === id) || null;
}

export type WriteInboxInput = {
  id?: string;
  title?: string;
  body: string;
  source_type: InboxSourceType;
  source_ref?: string;
  source_summary?: string;
  suggested_topic?: Topic | string;
  extractor?: string;
};

export function writeInbox(memoryRoot: string, input: WriteInboxInput): InboxDoc {
  ensureInboxDir(memoryRoot);
  const id = input.id || newId();
  const created_at = nowIso();
  const stamp = created_at.replace(/[:.]/g, "-");
  const fm: InboxFrontmatter = {
    id,
    created_at,
    status: "pending",
    source_type: input.source_type,
    source_ref: input.source_ref,
    source_summary: input.source_summary,
    suggested_topic: input.suggested_topic,
    extractor: input.extractor || "host",
    title: input.title,
  };
  const path = join(memoryRoot, "inbox", `${stamp}-${id.slice(0, 8)}.md`);
  writeFileSync(path, stringifyMd(fm as unknown as Record<string, unknown>, input.body), "utf8");
  return readInboxFile(path)!;
}

export function markInboxRejected(
  doc: InboxDoc,
  reason?: string,
): InboxDoc {
  const fm: InboxFrontmatter = {
    ...doc.frontmatter,
    status: "rejected",
    source_type: "promote_reject",
    reject_reason: reason || "",
  };
  writeFileSync(doc.path, stringifyMd(fm as unknown as Record<string, unknown>, doc.body), "utf8");
  return readInboxFile(doc.path)!;
}

export function discardInbox(doc: InboxDoc): void {
  if (existsSync(doc.path)) unlinkSync(doc.path);
}

/** pending + source_type=seed，供冷启动幂等刷新 */
export function listPendingSeedInbox(memoryRoot: string): InboxDoc[] {
  return listInbox(memoryRoot).filter(
    (d) => d.frontmatter.status === "pending" && d.frontmatter.source_type === "seed",
  );
}

export function discardPendingSeedInbox(memoryRoot: string): number {
  const docs = listPendingSeedInbox(memoryRoot);
  for (const d of docs) discardInbox(d);
  return docs.length;
}
