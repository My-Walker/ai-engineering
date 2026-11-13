import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import {
  defaultEmbeddingCacheDir,
  resolveMemoryRoot,
  resolveProjectRoot,
} from "./paths.js";
import type { AppConfig, Topic } from "./types.js";
import { TOPICS } from "./types.js";

export function defaultConfig(): AppConfig {
  return {
    version: 1,
    memory_root: null,
    topics: [...TOPICS],
    semantic: {
      enabled: true,
      model: "Xenova/multilingual-e5-small",
      cache_dir: null,
      similarity_threshold: 0.85,
      near_top_k: 5,
    },
    search: {
      top_k: 8,
      probe_summary_max_chars: 160,
    },
    roster: {
      max_chars: 4000,
    },
    handoff: {
      ttl_days: 7,
    },
    inbox: {
      stale_days: 30,
    },
    secrets: {
      scan_on_write: true,
      allowlist: [],
    },
    logging: {
      level: "info",
    },
    concurrency: {
      write_lock: "file",
    },
  };
}

function deepMerge(base: AppConfig, patch: Record<string, unknown>): AppConfig {
  const out = structuredClone(base);
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    if (k === "version" && typeof v === "number") out.version = v;
    else if (k === "memory_root") out.memory_root = v as string | null;
    else if (k === "topics" && Array.isArray(v)) {
      out.topics = v.filter((t): t is Topic => TOPICS.includes(t as Topic));
    } else if (k === "semantic" && v && typeof v === "object") {
      Object.assign(out.semantic, v);
    } else if (k === "search" && v && typeof v === "object") {
      Object.assign(out.search, v);
    } else if (k === "roster" && v && typeof v === "object") {
      Object.assign(out.roster, v);
    } else if (k === "handoff" && v && typeof v === "object") {
      Object.assign(out.handoff, v);
    } else if (k === "inbox" && v && typeof v === "object") {
      Object.assign(out.inbox, v);
    } else if (k === "secrets" && v && typeof v === "object") {
      Object.assign(out.secrets, v);
    } else if (k === "logging" && v && typeof v === "object") {
      Object.assign(out.logging, v);
    } else if (k === "concurrency" && v && typeof v === "object") {
      Object.assign(out.concurrency, v);
    } else {
      console.warn(`[agent-memory] unknown config key ignored: ${k}`);
    }
  }
  return out;
}

function applyEnv(cfg: AppConfig): AppConfig {
  const c = structuredClone(cfg);
  const e = process.env;
  if (e.AGENT_MEMORY_SEMANTIC === "0" || e.AGENT_MEMORY_SEMANTIC === "false") {
    c.semantic.enabled = false;
  } else if (e.AGENT_MEMORY_SEMANTIC === "1" || e.AGENT_MEMORY_SEMANTIC === "true") {
    c.semantic.enabled = true;
  }
  if (e.AGENT_MEMORY_EMBEDDING_MODEL) c.semantic.model = e.AGENT_MEMORY_EMBEDDING_MODEL;
  if (e.AGENT_MEMORY_EMBEDDING_CACHE) c.semantic.cache_dir = e.AGENT_MEMORY_EMBEDDING_CACHE;
  if (e.AGENT_MEMORY_SIMILARITY_THRESHOLD) {
    c.semantic.similarity_threshold = Number(e.AGENT_MEMORY_SIMILARITY_THRESHOLD);
  }
  if (e.AGENT_MEMORY_NEAR_TOP_K) c.semantic.near_top_k = Number(e.AGENT_MEMORY_NEAR_TOP_K);
  if (e.AGENT_MEMORY_ROSTER_MAX_CHARS) {
    c.roster.max_chars = Number(e.AGENT_MEMORY_ROSTER_MAX_CHARS);
  }
  if (e.AGENT_MEMORY_SEARCH_TOP_K) c.search.top_k = Number(e.AGENT_MEMORY_SEARCH_TOP_K);
  if (e.AGENT_MEMORY_HANDOFF_TTL_DAYS) {
    c.handoff.ttl_days = Number(e.AGENT_MEMORY_HANDOFF_TTL_DAYS);
  }
  if (e.AGENT_MEMORY_LOG_LEVEL) c.logging.level = e.AGENT_MEMORY_LOG_LEVEL;
  return c;
}

export type RuntimeContext = {
  projectRoot: string;
  memoryRoot: string;
  config: AppConfig;
  embeddingCacheDir: string;
};

export function loadRuntime(opts?: {
  projectRoot?: string;
  memoryRoot?: string;
  configPath?: string;
}): RuntimeContext {
  const projectRoot = resolveProjectRoot(opts?.projectRoot);
  let cfg = defaultConfig();

  const tentativeRoot = resolveMemoryRoot(
    projectRoot,
    opts?.memoryRoot ?? process.env.AGENT_MEMORY_ROOT ?? null,
  );
  const filePath =
    opts?.configPath ||
    process.env.AGENT_MEMORY_CONFIG ||
    join(tentativeRoot, "config.yaml");

  if (existsSync(filePath)) {
    try {
      const raw = parseYaml(readFileSync(filePath, "utf8")) as Record<string, unknown>;
      if (raw && typeof raw === "object") cfg = deepMerge(cfg, raw);
    } catch (err) {
      console.warn("[agent-memory] failed to parse config.yaml:", err);
    }
  }

  cfg = applyEnv(cfg);
  const memoryRoot = resolveMemoryRoot(
    projectRoot,
    opts?.memoryRoot ?? process.env.AGENT_MEMORY_ROOT ?? cfg.memory_root,
  );
  return {
    projectRoot,
    memoryRoot,
    config: cfg,
    embeddingCacheDir: cfg.semantic.cache_dir?.trim() || defaultEmbeddingCacheDir(),
  };
}

export function configToYaml(cfg: AppConfig): string {
  return stringifyYaml(cfg);
}
