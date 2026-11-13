import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";

export function resolveProjectRoot(cwd = process.cwd()): string {
  return resolve(cwd);
}

export function defaultMemoryRoot(projectRoot: string): string {
  return join(projectRoot, ".agent-memory");
}

export function resolveMemoryRoot(
  projectRoot: string,
  override?: string | null,
): string {
  if (override && override.trim()) {
    return isAbsolute(override) ? override : resolve(projectRoot, override);
  }
  return defaultMemoryRoot(projectRoot);
}

export function defaultEmbeddingCacheDir(): string {
  return join(homedir(), ".cache", "huggingface");
}

export function memoryPaths(memoryRoot: string) {
  return {
    root: memoryRoot,
    config: join(memoryRoot, "config.yaml"),
    handoff: join(memoryRoot, "workspace", "handoff.md"),
    seedDone: join(memoryRoot, "workspace", "seed_done"),
    canonical: join(memoryRoot, "canonical"),
    inbox: join(memoryRoot, "inbox"),
    archive: join(memoryRoot, "archive"),
    index: join(memoryRoot, "index"),
    db: join(memoryRoot, "index", "memory.sqlite"),
    writeLock: join(memoryRoot, "index", ".write.lock"),
    logs: join(memoryRoot, "logs"),
    logFile: join(memoryRoot, "logs", "agent-memory.log"),
  };
}
