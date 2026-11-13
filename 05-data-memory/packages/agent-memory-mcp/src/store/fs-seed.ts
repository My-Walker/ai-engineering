import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { memoryPaths } from "../paths.js";
import { nowIso } from "../md.js";
import type { SeedDoneMarker, SeedDoneReason, SeedFacts } from "../types.js";
import { listActiveCanonical } from "./fs-canonical.js";

const LOCKFILES = [
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  "bun.lockb",
] as const;

const SKIP_TOP_DIRS = new Set([
  ".git",
  ".hg",
  ".svn",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  ".nuxt",
  ".turbo",
  ".cache",
  ".agent-memory",
]);

const MAX_DEP_KEYS = 80;
const MAX_TOP_DIRS = 30;

export function isSeedDone(memoryRoot: string): boolean {
  return existsSync(memoryPaths(memoryRoot).seedDone);
}

export function readSeedDone(memoryRoot: string): SeedDoneMarker | null {
  const path = memoryPaths(memoryRoot).seedDone;
  if (!existsSync(path)) return null;
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as Partial<SeedDoneMarker>;
    if (!raw.at || (raw.reason !== "skip" && raw.reason !== "promote")) {
      return { at: raw.at || nowIso(), reason: "skip" };
    }
    return { at: raw.at, reason: raw.reason };
  } catch {
    return { at: nowIso(), reason: "skip" };
  }
}

export function writeSeedDone(
  memoryRoot: string,
  reason: SeedDoneReason,
): SeedDoneMarker {
  const path = memoryPaths(memoryRoot).seedDone;
  mkdirSync(dirname(path), { recursive: true });
  const marker: SeedDoneMarker = { at: nowIso(), reason };
  writeFileSync(path, `${JSON.stringify(marker, null, 2)}\n`, "utf8");
  return marker;
}

export function collectSeedFacts(projectRoot: string): SeedFacts {
  let packageName: string | null = null;
  const dependencyKeys: string[] = [];
  const pkgPath = join(projectRoot, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
        name?: string;
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      packageName = typeof pkg.name === "string" ? pkg.name : null;
      const keys = new Set<string>([
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.devDependencies || {}),
      ]);
      dependencyKeys.push(...[...keys].sort().slice(0, MAX_DEP_KEYS));
    } catch {
      /* ignore malformed package.json */
    }
  }

  let lockfile: string | null = null;
  for (const name of LOCKFILES) {
    if (existsSync(join(projectRoot, name))) {
      lockfile = name;
      break;
    }
  }

  const topLevelDirs: string[] = [];
  try {
    for (const name of readdirSync(projectRoot).sort()) {
      if (SKIP_TOP_DIRS.has(name) || name.startsWith(".")) continue;
      try {
        if (statSync(join(projectRoot, name)).isDirectory()) {
          topLevelDirs.push(name);
          if (topLevelDirs.length >= MAX_TOP_DIRS) break;
        }
      } catch {
        /* skip unreadable */
      }
    }
  } catch {
    /* empty projectRoot */
  }

  return { packageName, dependencyKeys, lockfile, topLevelDirs };
}

export function seedLifecycleMeta(memoryRoot: string): {
  canonical_empty: boolean;
  seed_done: boolean;
  seed_recommended: boolean;
} {
  const canonical_empty = listActiveCanonical(memoryRoot).length === 0;
  const seed_done = isSeedDone(memoryRoot);
  return {
    canonical_empty,
    seed_done,
    seed_recommended: canonical_empty && !seed_done,
  };
}
