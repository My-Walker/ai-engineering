import matter from "gray-matter";

export function parseMdFile(raw: string): { data: Record<string, unknown>; content: string } {
  const parsed = matter(raw);
  return { data: parsed.data as Record<string, unknown>, content: parsed.content.replace(/^\n/, "") };
}

export function stringifyMd(data: Record<string, unknown>, body: string): string {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    clean[k] = v;
  }
  return matter.stringify(body.replace(/^\n+/, ""), clean);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function isTopic(t: string, allowed: string[]): t is string {
  return allowed.includes(t);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "item";
}

export function newId(): string {
  return crypto.randomUUID();
}
