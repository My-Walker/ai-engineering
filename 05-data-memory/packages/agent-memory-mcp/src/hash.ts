import { createHash } from "node:crypto";

/** content_hash: SHA-256 of body only (LF newlines, trim trailing spaces per line). */
export function contentHash(body: string): string {
  const normalized = body
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n");
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}
