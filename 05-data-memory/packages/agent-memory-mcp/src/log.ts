import { appendFileSync, existsSync, mkdirSync, renameSync, statSync, unlinkSync } from "node:fs";
import { dirname } from "node:path";
import { memoryPaths } from "./paths.js";

const MAX_BYTES = 5 * 1024 * 1024;
const KEEP = 3;

export function appendLog(memoryRoot: string, line: string): void {
  const { logFile, logs } = memoryPaths(memoryRoot);
  mkdirSync(logs, { recursive: true });
  if (existsSync(logFile) && statSync(logFile).size > MAX_BYTES) {
    rotate(logFile);
  }
  appendFileSync(logFile, `${new Date().toISOString()} ${line}\n`, "utf8");
}

function rotate(logFile: string): void {
  for (let i = KEEP; i >= 1; i--) {
    const cur = i === 1 ? logFile : `${logFile}.${i - 1}`;
    const next = `${logFile}.${i}`;
    if (!existsSync(cur)) continue;
    if (i === KEEP) {
      try {
        unlinkSync(cur);
      } catch {
        /* ignore */
      }
      continue;
    }
    try {
      renameSync(cur, next);
    } catch {
      /* ignore */
    }
  }
  void dirname;
}
