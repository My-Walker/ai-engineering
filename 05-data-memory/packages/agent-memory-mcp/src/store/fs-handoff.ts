import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { dirname } from "node:path";
import { parseMdFile, stringifyMd, nowIso } from "../md.js";
import { memoryPaths } from "../paths.js";
import type { HandoffFrontmatter } from "../types.js";

export type HandoffDoc = {
  path: string;
  frontmatter: HandoffFrontmatter;
  body: string;
  valid: boolean;
  reason: "ok" | "missing" | "expired" | "done";
};

export function readHandoff(
  memoryRoot: string,
  ttlDays: number,
): HandoffDoc {
  const path = memoryPaths(memoryRoot).handoff;
  if (!existsSync(path)) {
    return {
      path,
      frontmatter: { updated_at: "", status: "active" },
      body: "",
      valid: false,
      reason: "missing",
    };
  }
  const { data, content } = parseMdFile(readFileSync(path, "utf8"));
  const fm = {
    status: "active" as const,
    updated_at: nowIso(),
    ...data,
  } as HandoffFrontmatter;

  if (fm.status === "done") {
    return { path, frontmatter: fm, body: content, valid: false, reason: "done" };
  }
  const updated = Date.parse(fm.updated_at);
  const ageMs = Date.now() - updated;
  const ttlMs = ttlDays * 24 * 60 * 60 * 1000;
  if (!Number.isFinite(updated) || ageMs > ttlMs) {
    return { path, frontmatter: fm, body: content, valid: false, reason: "expired" };
  }
  return { path, frontmatter: fm, body: content, valid: true, reason: "ok" };
}

export function writeHandoff(
  memoryRoot: string,
  fm: Partial<HandoffFrontmatter> & { body?: string },
): HandoffDoc {
  const path = memoryPaths(memoryRoot).handoff;
  mkdirSync(dirname(path), { recursive: true });
  const frontmatter: HandoffFrontmatter = {
    updated_at: nowIso(),
    status: fm.status || "active",
    goal: fm.goal,
    progress: fm.progress,
    blockers: fm.blockers,
    next_steps: fm.next_steps,
    acceptance: fm.acceptance,
  };
  const body = fm.body ?? "";
  writeFileSync(
    path,
    stringifyMd(frontmatter as unknown as Record<string, unknown>, body),
    "utf8",
  );
  return readHandoff(memoryRoot, 9999);
}

export function clearHandoff(memoryRoot: string): void {
  const path = memoryPaths(memoryRoot).handoff;
  if (existsSync(path)) unlinkSync(path);
}
