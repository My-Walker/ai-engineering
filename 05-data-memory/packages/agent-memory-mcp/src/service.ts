import { relative } from "node:path";
import type { RuntimeContext } from "./config.js";
import { contentHash } from "./hash.js";
import { withWriteLock } from "./lock.js";
import { memoryPaths } from "./paths.js";
import { scanSecrets } from "./secrets.js";
import {
  archiveCanonical,
  ensureCanonicalScaffold,
  findByHash,
  findById,
  findBySlug,
  listActiveCanonical,
  moveToSuperseded,
  readCanonicalFile,
  writeCanonical,
} from "./store/fs-canonical.js";
import {
  clearHandoff,
  readHandoff,
  writeHandoff,
} from "./store/fs-handoff.js";
import {
  discardInbox,
  discardPendingSeedInbox,
  findInboxById,
  listInbox,
  markInboxRejected,
  writeInbox,
} from "./store/fs-inbox.js";
import {
  collectSeedFacts,
  isSeedDone,
  seedLifecycleMeta,
  writeSeedDone,
} from "./store/fs-seed.js";
import {
  deleteEntry,
  ensureDb,
  reindexFromFiles,
  setEntryEmbedding,
  upsertEntry,
} from "./index/db.js";
import { embedPassage, getEmbedStatus, prefetchModel } from "./index/embed.js";
import { findNearMatches, searchMemory } from "./index/search.js";
import type {
  NearMatch,
  Topic,
  ToolResult,
} from "./types.js";
import { TOPICS } from "./types.js";
import { nowIso } from "./md.js";

function withSeedMeta(
  meta: Record<string, unknown>,
  memoryRoot: string,
): Record<string, unknown> {
  const life = seedLifecycleMeta(memoryRoot);
  const hintExtra = life.seed_recommended
    ? "；正式层空且未 seed_done，适当时机可提议 memory_seed_draft（勿当作 fetch 副作用）"
    : "";
  const hint = typeof meta.hint === "string" ? `${meta.hint}${hintExtra}` : meta.hint;
  return { ...meta, ...life, hint };
}

function requireConfirm(confirmed: unknown): ToolResult | null {
  if (confirmed !== true) {
    return {
      ok: false,
      code: "CONFIRMATION_REQUIRED",
      message: "缺少 confirmed_by_user: true，须人审四态通过后才能写入",
    };
  }
  return null;
}

function secretCheck(
  rt: RuntimeContext,
  text: string,
  relativePath?: string,
): ToolResult | null {
  if (!rt.config.secrets.scan_on_write) return null;
  const hit = scanSecrets(text, {
    allowlist: rt.config.secrets.allowlist,
    relativePath,
  });
  if (hit) {
    return {
      ok: false,
      code: "SECRET_REJECTED",
      message: `检测到疑似密钥（${hit.category}），已拒绝写入`,
      details: { ruleId: hit.ruleId },
    };
  }
  return null;
}

export class MemoryService {
  constructor(public rt: RuntimeContext) {}

  async search(query: string, topic?: Topic) {
    const { hits, embedding } = await searchMemory(this.rt, query, { topic });
    return { ok: true as const, hits, meta: { embedding } };
  }

  get(idOrPath: string) {
    const byId = findById(this.rt.memoryRoot, idOrPath);
    if (byId) {
      return {
        ok: true as const,
        id: byId.frontmatter.id,
        path: byId.relativePath,
        frontmatter: byId.frontmatter,
        body: byId.body,
      };
    }
    const full = idOrPath.includes(this.rt.memoryRoot)
      ? idOrPath
      : `${this.rt.memoryRoot}/${idOrPath}`.replace(/\\/g, "/");
    const doc = readCanonicalFile(this.rt.memoryRoot, full);
    if (!doc) {
      return { ok: false as const, code: "NOT_FOUND" as const, message: "未找到记忆条目" };
    }
    return {
      ok: true as const,
      id: doc.frontmatter.id,
      path: doc.relativePath,
      frontmatter: doc.frontmatter,
      body: doc.body,
    };
  }

  fetchContext(query?: string) {
    const handoff = readHandoff(this.rt.memoryRoot, this.rt.config.handoff.ttl_days);
    if (handoff.valid) {
      return {
        ok: true as const,
        handoff: {
          frontmatter: handoff.frontmatter,
          body: handoff.body,
        },
        roster: null,
        probes: [],
        meta: withSeedMeta(
          {
            handoff: "ok",
            semantic: this.rt.config.semantic.enabled ? "on" : "off",
            hint: "有有效交接卡，仅返回卡；全文请 memory_get",
          },
          this.rt.memoryRoot,
        ),
      };
    }

    const docs = listActiveCanonical(this.rt.memoryRoot).sort((a, b) =>
      b.frontmatter.updated_at.localeCompare(a.frontmatter.updated_at),
    );
    const perTopic = 10;
    const maxTotal = 40;
    const byTopic = new Map<string, typeof docs>();
    for (const d of docs) {
      const arr = byTopic.get(d.frontmatter.topic) || [];
      if (arr.length < perTopic) arr.push(d);
      byTopic.set(d.frontmatter.topic, arr);
    }
    let roster = [...byTopic.values()].flat().slice(0, maxTotal).map((d) => ({
      id: d.frontmatter.id,
      title: d.frontmatter.title,
      summary: d.frontmatter.summary,
      path: d.relativePath,
      topic: d.frontmatter.topic,
      updated_at: d.frontmatter.updated_at,
    }));

    let chars = JSON.stringify(roster).length;
    while (chars > this.rt.config.roster.max_chars && roster.length > 0) {
      roster = roster.slice(0, -1);
      chars = JSON.stringify(roster).length;
    }

    return {
      ok: true as const,
      handoff: null,
      roster,
      probes: [] as unknown[],
      _query: query,
      meta: withSeedMeta(
        {
          handoff: handoff.reason,
          semantic: this.rt.config.semantic.enabled ? "on" : "off",
          hint: "无有效交接卡；roster 为花名册。有任务请带 query 再取探针；全文用 memory_get",
        },
        this.rt.memoryRoot,
      ),
    };
  }

  async fetchContextFull(query?: string) {
    const base = this.fetchContext(query);
    if (query && query.trim() && !base.handoff) {
      const { hits, embedding } = await searchMemory(this.rt, query);
      return {
        ...base,
        probes: hits,
        meta: { ...base.meta, embedding },
      };
    }
    return { ...base, probes: [] };
  }

  async write(args: {
    confirmed_by_user?: boolean;
    title: string;
    topic: string;
    summary: string;
    body: string;
    slug?: string;
    id?: string;
    tags?: string[];
    force_new?: boolean;
  }): Promise<ToolResult<{ path?: string; id?: string; near_matches?: NearMatch[]; needs_review?: boolean }>> {
    const gate = requireConfirm(args.confirmed_by_user);
    if (gate) return gate;
    if (!TOPICS.includes(args.topic as Topic)) {
      return { ok: false, code: "VALIDATION_ERROR", message: `非法 topic: ${args.topic}` };
    }
    const topic = args.topic as Topic;
    const sec = secretCheck(this.rt, `${args.title}\n${args.summary}\n${args.body}`);
    if (sec) return sec;

    const paths = memoryPaths(this.rt.memoryRoot);
    return (await withWriteLock(paths.writeLock, async () => {
      ensureCanonicalScaffold(this.rt.memoryRoot);
      const hash = contentHash(args.body);
      if (!args.id) {
        const sameHash = findByHash(this.rt.memoryRoot, hash);
        if (sameHash) {
          return {
            ok: false,
            code: "CONFLICT",
            message: "同 content_hash 已存在，拒绝新建",
            details: { path: sameHash.relativePath, id: sameHash.frontmatter.id },
          };
        }
      }
      if (args.slug) {
        const slugHit = findBySlug(this.rt.memoryRoot, topic, args.slug);
        if (slugHit && slugHit.frontmatter.id !== args.id) {
          return {
            ok: false,
            code: "CONFLICT",
            message: "同 topic 下 slug 冲突",
            details: { path: slugHit.relativePath, id: slugHit.frontmatter.id },
          };
        }
      }

      const db = ensureDb(this.rt.memoryRoot);
      if (this.rt.config.semantic.enabled && !args.id) {
        const near = await findNearMatches(
          this.rt,
          db,
          topic,
          `${args.title}\n${args.summary}\n${args.body}`,
        );
        if (near.length > 0) {
          return {
            ok: true,
            needs_review: true,
            near_matches: near,
            message: "发现近义条目，未落盘；请人审四态后再写入",
          } as ToolResult;
        }
      }

      const doc = writeCanonical(this.rt.memoryRoot, {
        id: args.id,
        title: args.title,
        topic,
        slug: args.slug,
        summary: args.summary,
        body: args.body,
        tags: args.tags,
      });
      upsertEntry(db, doc, null);
      if (this.rt.config.semantic.enabled) {
        const vec = await embedPassage(
          `${doc.frontmatter.title}\n${doc.frontmatter.summary}\n${doc.body}`,
          this.rt.config,
          this.rt.embeddingCacheDir,
        );
        if (vec) setEntryEmbedding(db, doc.frontmatter.id, vec);
      }
      return {
        ok: true as const,
        id: doc.frontmatter.id,
        path: doc.relativePath,
      };
    })) as ToolResult;
  }

  async writeInbox(args: {
    confirmed_by_user?: boolean;
    title?: string;
    body: string;
    source_type?: string;
    source_ref?: string;
    source_summary?: string;
    suggested_topic?: string;
  }): Promise<ToolResult> {
    const gate = requireConfirm(args.confirmed_by_user);
    if (gate) return gate;
    const sec = secretCheck(this.rt, args.body);
    if (sec) return sec;
    const paths = memoryPaths(this.rt.memoryRoot);
    return withWriteLock(paths.writeLock, () => {
      const doc = writeInbox(this.rt.memoryRoot, {
        title: args.title,
        body: args.body,
        source_type: (args.source_type as "host") || "host",
        source_ref: args.source_ref,
        source_summary: args.source_summary,
        suggested_topic: args.suggested_topic,
      });
      return {
        ok: true as const,
        id: doc.frontmatter.id,
        path: relative(this.rt.memoryRoot, doc.path).replace(/\\/g, "/"),
      };
    });
  }

  async seedDraft(args: {
    confirmed_by_user?: boolean;
    items: Array<{
      title: string;
      topic: string;
      summary: string;
      body: string;
    }>;
  }): Promise<ToolResult> {
    const gate = requireConfirm(args.confirmed_by_user);
    if (gate) return gate;
    if (!args.items?.length) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: "items 至少 1 条",
      };
    }

    const life = seedLifecycleMeta(this.rt.memoryRoot);
    if (!life.canonical_empty || life.seed_done) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: life.seed_done
          ? "seed_done 已置位，冷启动已关闭；请走日常 memory_write / inbox"
          : "正式层非空，冷启动仅适用于空库；请走日常写入",
        details: life,
      };
    }

    for (const item of args.items) {
      if (!TOPICS.includes(item.topic as Topic)) {
        return {
          ok: false,
          code: "VALIDATION_ERROR",
          message: `非法 topic: ${item.topic}`,
        };
      }
      const sec = secretCheck(
        this.rt,
        `${item.title}\n${item.summary}\n${item.body}`,
      );
      if (sec) return sec;
    }

    const paths = memoryPaths(this.rt.memoryRoot);
    return withWriteLock(paths.writeLock, () => {
      const life2 = seedLifecycleMeta(this.rt.memoryRoot);
      if (!life2.canonical_empty || life2.seed_done) {
        return {
          ok: false as const,
          code: "VALIDATION_ERROR" as const,
          message: "资格已变化，拒绝 seed_draft",
          details: life2,
        };
      }

      discardPendingSeedInbox(this.rt.memoryRoot);
      const written = args.items.map((item) => {
        const doc = writeInbox(this.rt.memoryRoot, {
          title: item.title,
          body: `# Summary\n\n${item.summary}\n\n${item.body}`,
          source_type: "seed",
          source_ref: "memory_seed_draft",
          source_summary: item.summary,
          suggested_topic: item.topic as Topic,
          extractor: "seed",
        });
        return {
          id: doc.frontmatter.id,
          title: item.title,
          topic: item.topic,
          path: relative(this.rt.memoryRoot, doc.path).replace(/\\/g, "/"),
        };
      });

      const present = new Set(args.items.map((i) => i.topic));
      const missing = TOPICS.filter((t) => !present.has(t));
      const warnings =
        missing.length > 0
          ? [`建议覆盖全部五主题；本次缺失: ${missing.join(", ")}`]
          : [];

      const facts = collectSeedFacts(this.rt.projectRoot);
      return {
        ok: true as const,
        items: written,
        facts,
        warnings,
        meta: {
          ...life2,
          seed_done: false,
          seed_recommended: true,
          note: "已写入 inbox，未置 seed_done；转正请 inbox_promote，跳过请 memory_seed_skip",
        },
      };
    });
  }

  async seedSkip(args: { confirmed_by_user?: boolean }): Promise<ToolResult> {
    const gate = requireConfirm(args.confirmed_by_user);
    if (gate) return gate;
    const paths = memoryPaths(this.rt.memoryRoot);
    return withWriteLock(paths.writeLock, () => {
      const marker = writeSeedDone(this.rt.memoryRoot, "skip");
      const life = seedLifecycleMeta(this.rt.memoryRoot);
      return {
        ok: true as const,
        seed_done: marker,
        meta: life,
      };
    });
  }

  inboxList() {
    const items = listInbox(this.rt.memoryRoot).map((d) => ({
      id: d.frontmatter.id,
      status: d.frontmatter.status,
      source_type: d.frontmatter.source_type,
      title: d.frontmatter.title,
      suggested_topic: d.frontmatter.suggested_topic,
      created_at: d.frontmatter.created_at,
      stale:
        Date.now() - Date.parse(d.frontmatter.created_at) >
        this.rt.config.inbox.stale_days * 86400000,
    }));
    return { ok: true as const, items };
  }

  async inboxPromote(args: {
    confirmed_by_user?: boolean;
    id: string;
    topic: string;
    title?: string;
    summary?: string;
    body?: string;
    reject?: boolean;
    reject_reason?: string;
  }): Promise<ToolResult> {
    const gate = requireConfirm(args.confirmed_by_user);
    if (gate) return gate;

    const paths = memoryPaths(this.rt.memoryRoot);
    return withWriteLock(paths.writeLock, async () => {
      const doc = findInboxById(this.rt.memoryRoot, args.id);
      if (!doc) {
        return { ok: false, code: "NOT_FOUND" as const, message: "inbox 条目不存在" };
      }
      if (args.reject) {
        markInboxRejected(doc, args.reject_reason);
        return { ok: true as const, status: "rejected", id: args.id };
      }
      if (!TOPICS.includes(args.topic as Topic)) {
        return { ok: false, code: "VALIDATION_ERROR" as const, message: "非法 topic" };
      }
      const body = args.body ?? doc.body;
      const title = args.title || doc.frontmatter.title || "未命名";
      const summary = args.summary || title;
      const sec = secretCheck(this.rt, body);
      if (sec) return sec;

      const written = writeCanonical(this.rt.memoryRoot, {
        title,
        topic: args.topic as Topic,
        summary,
        body,
      });
      const db = ensureDb(this.rt.memoryRoot);
      upsertEntry(db, written, null);
      const fromSeed = doc.frontmatter.source_type === "seed";
      discardInbox(doc);
      if (fromSeed && !isSeedDone(this.rt.memoryRoot)) {
        writeSeedDone(this.rt.memoryRoot, "promote");
      }
      return {
        ok: true as const,
        id: written.frontmatter.id,
        path: written.relativePath,
        seed_done: fromSeed || isSeedDone(this.rt.memoryRoot),
      };
    });
  }

  inboxDiscard(args: { confirmed_by_user?: boolean; id: string }): ToolResult | Promise<ToolResult> {
    const gate = requireConfirm(args.confirmed_by_user);
    if (gate) return gate;
    const paths = memoryPaths(this.rt.memoryRoot);
    return withWriteLock(paths.writeLock, () => {
      const doc = findInboxById(this.rt.memoryRoot, args.id);
      if (!doc) return { ok: false, code: "NOT_FOUND" as const, message: "inbox 条目不存在" };
      discardInbox(doc);
      return { ok: true as const, discarded: args.id };
    });
  }

  handoffUpdate(args: {
    goal?: string;
    progress?: string;
    blockers?: string;
    next_steps?: string;
    acceptance?: string;
    status?: "active" | "done";
    body?: string;
  }) {
    const paths = memoryPaths(this.rt.memoryRoot);
    return withWriteLock(paths.writeLock, () => {
      const doc = writeHandoff(this.rt.memoryRoot, args);
      return { ok: true as const, updated_at: doc.frontmatter.updated_at };
    });
  }

  handoffClear() {
    const paths = memoryPaths(this.rt.memoryRoot);
    return withWriteLock(paths.writeLock, () => {
      clearHandoff(this.rt.memoryRoot);
      return { ok: true as const };
    });
  }

  archive(args: { confirmed_by_user?: boolean; id: string }) {
    const gate = requireConfirm(args.confirmed_by_user);
    if (gate) return gate;
    const paths = memoryPaths(this.rt.memoryRoot);
    return withWriteLock(paths.writeLock, () => {
      const doc = findById(this.rt.memoryRoot, args.id);
      if (!doc) return { ok: false, code: "NOT_FOUND" as const, message: "未找到" };
      const archived = archiveCanonical(this.rt.memoryRoot, doc);
      const db = ensureDb(this.rt.memoryRoot);
      upsertEntry(db, archived, null);
      return { ok: true as const, path: archived.relativePath };
    });
  }

  async dedupeScan(args?: { topic?: Topic; limit?: number }) {
    if (!this.rt.config.semantic.enabled) {
      return {
        ok: false as const,
        code: "SEMANTIC_DISABLED" as const,
        message: "语义关闭，无法做向量近义扫描（精确重复已在 write 拦截）",
      };
    }
    const db = ensureDb(this.rt.memoryRoot);
    const docs = listActiveCanonical(this.rt.memoryRoot).filter(
      (d) => !args?.topic || d.frontmatter.topic === args.topic,
    );
    const clusters: Array<{
      cluster_id: string;
      keep_id: string;
      reason: string;
      members: NearMatch[];
    }> = [];
    const used = new Set<string>();
    const limit = args?.limit ?? 20;
    for (const doc of docs) {
      if (used.has(doc.frontmatter.id)) continue;
      if (clusters.length >= limit) break;
      const near = await findNearMatches(
        this.rt,
        db,
        doc.frontmatter.topic,
        `${doc.frontmatter.title}\n${doc.frontmatter.summary}\n${doc.body}`,
      );
      const members = [
        {
          id: doc.frontmatter.id,
          path: doc.relativePath,
          title: doc.frontmatter.title,
          summary: doc.frontmatter.summary,
          score: 1,
        },
        ...near.filter((n) => n.id !== doc.frontmatter.id),
      ];
      if (members.length < 2) continue;
      for (const m of members) used.add(m.id);
      clusters.push({
        cluster_id: `c-${doc.frontmatter.id.slice(0, 8)}`,
        keep_id: doc.frontmatter.id,
        reason: `相似度 ≥ ${this.rt.config.semantic.similarity_threshold}`,
        members,
      });
    }
    return { ok: true as const, clusters, meta: { embedding: getEmbedStatus() } };
  }

  async dedupeApply(args: {
    confirmed_by_user?: boolean;
    keep_id: string;
    merge_ids: string[];
    body: string;
    title?: string;
    summary?: string;
  }): Promise<ToolResult> {
    const gate = requireConfirm(args.confirmed_by_user);
    if (gate) return gate;
    const sec = secretCheck(this.rt, args.body);
    if (sec) return sec;
    const paths = memoryPaths(this.rt.memoryRoot);
    return withWriteLock(paths.writeLock, async () => {
      const keep = findById(this.rt.memoryRoot, args.keep_id);
      if (!keep) return { ok: false, code: "NOT_FOUND" as const, message: "keep_id 不存在" };
      const db = ensureDb(this.rt.memoryRoot);
      const updated = writeCanonical(this.rt.memoryRoot, {
        id: keep.frontmatter.id,
        title: args.title || keep.frontmatter.title,
        topic: keep.frontmatter.topic,
        slug: keep.frontmatter.slug,
        summary: args.summary || keep.frontmatter.summary,
        body: args.body,
        tags: keep.frontmatter.tags,
      });
      upsertEntry(db, updated, null);
      for (const mid of args.merge_ids) {
        if (mid === args.keep_id) continue;
        const m = findById(this.rt.memoryRoot, mid);
        if (!m) continue;
        const moved = moveToSuperseded(this.rt.memoryRoot, m, args.keep_id);
        upsertEntry(db, moved, null);
      }
      const vec = await embedPassage(
        `${updated.frontmatter.title}\n${updated.frontmatter.summary}\n${updated.body}`,
        this.rt.config,
        this.rt.embeddingCacheDir,
      );
      if (vec) setEntryEmbedding(db, updated.frontmatter.id, vec);
      return { ok: true as const, keep_id: updated.frontmatter.id, path: updated.relativePath };
    });
  }

  reindex() {
    const paths = memoryPaths(this.rt.memoryRoot);
    return withWriteLock(paths.writeLock, () => {
      const db = ensureDb(this.rt.memoryRoot);
      const n = reindexFromFiles(this.rt.memoryRoot, db);
      return { ok: true as const, indexed: n, at: nowIso() };
    });
  }

  async doctor(prefetch = false) {
    const paths = memoryPaths(this.rt.memoryRoot);
    const life = seedLifecycleMeta(this.rt.memoryRoot);
    const report: Record<string, unknown> = {
      projectRoot: this.rt.projectRoot,
      memoryRoot: this.rt.memoryRoot,
      semantic: this.rt.config.semantic.enabled,
      embeddingCacheDir: this.rt.embeddingCacheDir,
      embeddingStatus: getEmbedStatus(),
      handoff: readHandoff(this.rt.memoryRoot, this.rt.config.handoff.ttl_days).reason,
      canonicalActive: listActiveCanonical(this.rt.memoryRoot).length,
      inbox: listInbox(this.rt.memoryRoot).length,
      ...life,
    };
    if (prefetch) {
      report.prefetch = await prefetchModel(this.rt.config, this.rt.embeddingCacheDir);
    }
    const hints = [
      "若手改 md 或索引不一致，请询问用户是否 memory_reindex，同意后再重建",
      "Cursor Stop / MCP / 规则缺项时重新运行 init",
    ];
    if (life.seed_recommended) {
      hints.push(
        "正式层空且未 seed_done：适当时机提议 memory_seed_draft；跳过用 memory_seed_skip（fetch 只召回，不建档）",
      );
    }
    report.hints = hints;
    report.paths = paths;
    return { ok: true as const, report };
  }
}
