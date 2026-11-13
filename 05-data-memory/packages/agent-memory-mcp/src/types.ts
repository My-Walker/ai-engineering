export const TOPICS = [
  "decisions",
  "conventions",
  "modules",
  "pitfalls",
  "domain",
] as const;

export type Topic = (typeof TOPICS)[number];

export type ErrorCode =
  | "CONFIRMATION_REQUIRED"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "SECRET_REJECTED"
  | "SEMANTIC_DISABLED"
  | "LOCKED"
  | "IO_ERROR"
  | "INTERNAL";

export type ToolOk<T extends Record<string, unknown> = Record<string, unknown>> = {
  ok: true;
} & T;

export type ToolErr = {
  ok: false;
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export type ToolResult<T extends Record<string, unknown> = Record<string, unknown>> =
  | ToolOk<T>
  | ToolErr;

export type CanonicalStatus = "active" | "superseded" | "archived";

export type CanonicalFrontmatter = {
  id: string;
  title: string;
  topic: Topic;
  created_at: string;
  updated_at: string;
  status: CanonicalStatus;
  summary: string;
  tags?: string[];
  sources?: Array<{ type: string; ref: string }>;
  supersedes?: string | null;
  superseded_by?: string | null;
  content_hash: string;
  slug?: string;
};

export type InboxSourceType =
  | "host"
  | "command"
  | "promote_reject"
  | "import"
  | "seed"
  | "other";

export type SeedDoneReason = "skip" | "promote";

export type SeedDoneMarker = {
  at: string;
  reason: SeedDoneReason;
};

export type SeedFacts = {
  packageName: string | null;
  dependencyKeys: string[];
  lockfile: string | null;
  topLevelDirs: string[];
};

export type InboxStatus = "pending" | "rejected" | "promoted";

export type InboxFrontmatter = {
  id: string;
  created_at: string;
  status: InboxStatus;
  source_type: InboxSourceType;
  source_ref?: string;
  source_summary?: string;
  suggested_topic?: Topic | string;
  extractor?: string;
  title?: string;
  reject_reason?: string;
};

export type HandoffStatus = "active" | "done";

export type HandoffFrontmatter = {
  updated_at: string;
  status: HandoffStatus;
  goal?: string;
  progress?: string;
  blockers?: string;
  next_steps?: string;
  acceptance?: string;
};

export type AllowlistEntry =
  | { type: "rule"; id: string }
  | { type: "path"; pattern: string };

export type AppConfig = {
  version: number;
  memory_root: string | null;
  topics: Topic[];
  semantic: {
    enabled: boolean;
    model: string;
    cache_dir: string | null;
    similarity_threshold: number;
    near_top_k: number;
  };
  search: {
    top_k: number;
    probe_summary_max_chars: number;
  };
  roster: {
    max_chars: number;
  };
  handoff: {
    ttl_days: number;
  };
  inbox: {
    stale_days: number;
  };
  secrets: {
    scan_on_write: boolean;
    allowlist: AllowlistEntry[];
  };
  logging: {
    level: string;
  };
  concurrency: {
    write_lock: "file";
  };
};

export type NearMatch = {
  id: string;
  path: string;
  title: string;
  summary: string;
  score: number;
};
