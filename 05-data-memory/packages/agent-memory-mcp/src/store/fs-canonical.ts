import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { contentHash } from "../hash.js";
import { parseMdFile, stringifyMd, nowIso, slugify, newId } from "../md.js";
import { memoryPaths } from "../paths.js";
import type {
  CanonicalFrontmatter,
  CanonicalStatus,
  Topic,
} from "../types.js";
import { TOPICS } from "../types.js";

export type CanonicalDoc = {
  path: string;
  relativePath: string;
  frontmatter: CanonicalFrontmatter;
  body: string;
};

export function topicDir(memoryRoot: string, topic: Topic): string {
  return join(memoryRoot, "canonical", topic);
}

export function supersededDir(memoryRoot: string, topic: Topic): string {
  return join(topicDir(memoryRoot, topic), "_superseded");
}

export function ensureCanonicalScaffold(memoryRoot: string): void {
  for (const t of TOPICS) {
    mkdirSync(topicDir(memoryRoot, t), { recursive: true });
    mkdirSync(supersededDir(memoryRoot, t), { recursive: true });
    const keep = join(topicDir(memoryRoot, t), ".gitkeep");
    if (!existsSync(keep)) writeFileSync(keep, "", "utf8");
  }
  mkdirSync(join(memoryRoot, "archive"), { recursive: true });
}

function fileNameFor(topic: Topic, slug: string, createdAt: string): string {
  if (topic === "decisions") {
    const d = createdAt.slice(0, 10).replace(/-/g, "");
    return `${d}-${slug}.md`;
  }
  return `${slug}.md`;
}

export function listActiveCanonical(memoryRoot: string): CanonicalDoc[] {
  const docs: CanonicalDoc[] = [];
  for (const topic of TOPICS) {
    const dir = topicDir(memoryRoot, topic);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!name.endsWith(".md") || name === ".gitkeep") continue;
      const full = join(dir, name);
      const doc = readCanonicalFile(memoryRoot, full);
      if (doc && doc.frontmatter.status === "active") docs.push(doc);
    }
  }
  return docs;
}

export function listAllCanonicalIncludingSuperseded(memoryRoot: string): CanonicalDoc[] {
  const docs: CanonicalDoc[] = [];
  for (const topic of TOPICS) {
    const dir = topicDir(memoryRoot, topic);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!name.endsWith(".md")) continue;
      docs.push(readCanonicalFile(memoryRoot, join(dir, name))!);
    }
    const sd = supersededDir(memoryRoot, topic);
    if (existsSync(sd)) {
      for (const name of readdirSync(sd)) {
        if (!name.endsWith(".md")) continue;
        const doc = readCanonicalFile(memoryRoot, join(sd, name));
        if (doc) docs.push(doc);
      }
    }
  }
  return docs.filter(Boolean);
}

export function readCanonicalFile(memoryRoot: string, fullPath: string): CanonicalDoc | null {
  if (!existsSync(fullPath)) return null;
  const raw = readFileSync(fullPath, "utf8");
  const { data, content } = parseMdFile(raw);
  const fm = data as Partial<CanonicalFrontmatter>;
  if (!fm.id || !fm.topic) return null;
  return {
    path: fullPath,
    relativePath: relative(memoryRoot, fullPath).replace(/\\/g, "/"),
    frontmatter: fm as CanonicalFrontmatter,
    body: content,
  };
}

export function findById(memoryRoot: string, id: string): CanonicalDoc | null {
  for (const doc of listAllCanonicalIncludingSuperseded(memoryRoot)) {
    if (doc.frontmatter.id === id) return doc;
  }
  return null;
}

export function findByHash(memoryRoot: string, hash: string): CanonicalDoc | null {
  for (const doc of listActiveCanonical(memoryRoot)) {
    if (doc.frontmatter.content_hash === hash) return doc;
  }
  return null;
}

export function findBySlug(memoryRoot: string, topic: Topic, slug: string): CanonicalDoc | null {
  for (const doc of listActiveCanonical(memoryRoot)) {
    if (doc.frontmatter.topic !== topic) continue;
    const base = basename(doc.path, ".md");
    const s = doc.frontmatter.slug || base.replace(/^\d{8}-/, "");
    if (s === slug) return doc;
  }
  return null;
}

export type WriteCanonicalInput = {
  id?: string;
  title: string;
  topic: Topic;
  slug?: string;
  summary: string;
  body: string;
  tags?: string[];
  sources?: CanonicalFrontmatter["sources"];
  supersedes?: string | null;
};

export function writeCanonical(
  memoryRoot: string,
  input: WriteCanonicalInput,
): CanonicalDoc {
  const id = input.id || newId();
  const existing = findById(memoryRoot, id);
  const created_at = existing?.frontmatter.created_at || nowIso();
  const updated_at = nowIso();
  const slug = input.slug || slugify(input.title);
  const hash = contentHash(input.body);
  const fm: CanonicalFrontmatter = {
    id,
    title: input.title,
    topic: input.topic,
    created_at,
    updated_at,
    status: "active",
    summary: input.summary,
    tags: input.tags || [],
    sources: input.sources,
    supersedes: input.supersedes ?? null,
    superseded_by: null,
    content_hash: hash,
    slug,
  };
  const dir = topicDir(memoryRoot, input.topic);
  mkdirSync(dir, { recursive: true });
  const file = existing
    ? existing.path
    : join(dir, fileNameFor(input.topic, slug, created_at));
  writeFileSync(file, stringifyMd(fm as unknown as Record<string, unknown>, input.body), "utf8");
  return readCanonicalFile(memoryRoot, file)!;
}

export function moveToSuperseded(
  memoryRoot: string,
  doc: CanonicalDoc,
  keepId: string,
): CanonicalDoc {
  const topic = doc.frontmatter.topic;
  const destDir = supersededDir(memoryRoot, topic);
  mkdirSync(destDir, { recursive: true });
  const dest = join(destDir, basename(doc.path));
  const fm: CanonicalFrontmatter = {
    ...doc.frontmatter,
    status: "superseded",
    superseded_by: keepId,
    updated_at: nowIso(),
  };
  writeFileSync(dest, stringifyMd(fm as unknown as Record<string, unknown>, doc.body), "utf8");
  if (existsSync(doc.path) && doc.path !== dest) unlinkSync(doc.path);
  return readCanonicalFile(memoryRoot, dest)!;
}

export function archiveCanonical(memoryRoot: string, doc: CanonicalDoc): CanonicalDoc {
  const paths = memoryPaths(memoryRoot);
  const destDir = join(paths.archive, doc.frontmatter.topic);
  mkdirSync(destDir, { recursive: true });
  const dest = join(destDir, basename(doc.path));
  const fm: CanonicalFrontmatter = {
    ...doc.frontmatter,
    status: "archived" as CanonicalStatus,
    updated_at: nowIso(),
  };
  writeFileSync(dest, stringifyMd(fm as unknown as Record<string, unknown>, doc.body), "utf8");
  if (existsSync(doc.path)) unlinkSync(doc.path);
  return readCanonicalFile(memoryRoot, dest)!;
}

export function ensureParent(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
}
