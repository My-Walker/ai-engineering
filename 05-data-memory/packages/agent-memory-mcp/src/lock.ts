import { mkdirSync, openSync, closeSync, unlinkSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import type { ToolErr } from "./types.js";

const DEFAULT_RETRIES = 3;
const RETRY_MS = 50;

export async function withWriteLock<T>(
  lockPath: string,
  fn: () => Promise<T> | T,
): Promise<T | ToolErr> {
  mkdirSync(dirname(lockPath), { recursive: true });
  let fd: number | null = null;
  for (let i = 0; i < DEFAULT_RETRIES; i++) {
    try {
      fd = openSync(lockPath, "wx");
      break;
    } catch {
      await sleep(RETRY_MS * (i + 1));
    }
  }
  if (fd === null) {
    return {
      ok: false,
      code: "LOCKED",
      message: "无法获取记忆根写锁，请稍后重试",
    };
  }
  try {
    return await fn();
  } finally {
    try {
      closeSync(fd);
    } catch {
      /* ignore */
    }
    try {
      if (existsSync(lockPath)) unlinkSync(lockPath);
    } catch {
      /* ignore */
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
