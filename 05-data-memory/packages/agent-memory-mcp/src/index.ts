#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadRuntime } from "./config.js";
import { MemoryService } from "./service.js";
import { TOPICS } from "./types.js";

export async function startMcpServer(): Promise<void> {
  const rt = loadRuntime();
  const svc = new MemoryService(rt);
  const server = new McpServer({
    name: "agent-memory-mcp",
    version: "0.1.0",
  });

  const topicEnum = z.enum(TOPICS);

  const wrap = async (fn: () => Promise<unknown> | unknown) => {
    try {
      const result = await fn();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              ok: false,
              code: "INTERNAL",
              message,
            }),
          },
        ],
        isError: true,
      };
    }
  };

  server.tool(
    "memory_search",
    "FTS (+optional semantic) search; returns short probes",
    { query: z.string(), topic: topicEnum.optional() },
    async (args) => wrap(() => svc.search(args.query, args.topic)),
  );

  server.tool(
    "memory_get",
    "Get full memory by id or path",
    { id_or_path: z.string() },
    async (args) => wrap(() => svc.get(args.id_or_path)),
  );

  server.tool(
    "memory_fetch_context",
    "Session start pack: handoff or roster+probes",
    { query: z.string().optional() },
    async (args) => wrap(() => svc.fetchContextFull(args.query)),
  );

  server.tool(
    "handoff_update",
    "Overwrite workspace handoff card",
    {
      goal: z.string().optional(),
      progress: z.string().optional(),
      blockers: z.string().optional(),
      next_steps: z.string().optional(),
      acceptance: z.string().optional(),
      status: z.enum(["active", "done"]).optional(),
      body: z.string().optional(),
    },
    async (args) => wrap(() => svc.handoffUpdate(args)),
  );

  server.tool("handoff_clear", "Clear handoff card", {}, async () =>
    wrap(() => svc.handoffClear()),
  );

  server.tool("inbox_list", "List inbox candidates", {}, async () =>
    wrap(() => svc.inboxList()),
  );

  server.tool(
    "inbox_promote",
    "Promote inbox to canonical, or reject (promote_reject)",
    {
      confirmed_by_user: z.boolean(),
      id: z.string(),
      topic: topicEnum.optional(),
      title: z.string().optional(),
      summary: z.string().optional(),
      body: z.string().optional(),
      reject: z.boolean().optional(),
      reject_reason: z.string().optional(),
    },
    async (args) =>
      wrap(() =>
        svc.inboxPromote({
          ...args,
          topic: args.topic || "domain",
        }),
      ),
  );

  server.tool(
    "inbox_discard",
    "Discard inbox item",
    { confirmed_by_user: z.boolean(), id: z.string() },
    async (args) => wrap(() => svc.inboxDiscard(args)),
  );

  server.tool(
    "memory_write",
    "Write canonical memory (requires confirmed_by_user)",
    {
      confirmed_by_user: z.boolean(),
      title: z.string(),
      topic: topicEnum,
      summary: z.string(),
      body: z.string(),
      slug: z.string().optional(),
      id: z.string().optional(),
      tags: z.array(z.string()).optional(),
    },
    async (args) => wrap(() => svc.write(args)),
  );

  server.tool(
    "memory_inbox_write",
    "Write inbox candidate (requires confirmed_by_user)",
    {
      confirmed_by_user: z.boolean(),
      title: z.string().optional(),
      body: z.string(),
      source_type: z
        .enum(["host", "command", "import", "other"])
        .optional(),
      source_ref: z.string().optional(),
      source_summary: z.string().optional(),
      suggested_topic: z.string().optional(),
    },
    async (args) => wrap(() => svc.writeInbox(args)),
  );

  server.tool(
    "memory_seed_draft",
    "Cold-start: write Agent drafts to inbox only (canonical_empty && !seed_done); does not set seed_done",
    {
      confirmed_by_user: z.boolean(),
      items: z
        .array(
          z.object({
            title: z.string(),
            topic: topicEnum,
            summary: z.string(),
            body: z.string(),
          }),
        )
        .min(1),
    },
    async (args) => wrap(() => svc.seedDraft(args)),
  );

  server.tool(
    "memory_seed_skip",
    "Close cold-start (set seed_done) without writing memories; may remain empty",
    { confirmed_by_user: z.boolean() },
    async (args) => wrap(() => svc.seedSkip(args)),
  );

  server.tool(
    "memory_archive",
    "Archive canonical entry",
    { confirmed_by_user: z.boolean(), id: z.string() },
    async (args) => wrap(() => svc.archive(args)),
  );

  server.tool(
    "memory_dedupe_scan",
    "Scan near-duplicate clusters (read-only)",
    { topic: topicEnum.optional(), limit: z.number().optional() },
    async (args) => wrap(() => svc.dedupeScan(args)),
  );

  server.tool(
    "memory_dedupe_apply",
    "Apply dedupe merge after human review",
    {
      confirmed_by_user: z.boolean(),
      keep_id: z.string(),
      merge_ids: z.array(z.string()),
      body: z.string(),
      title: z.string().optional(),
      summary: z.string().optional(),
    },
    async (args) => wrap(() => svc.dedupeApply(args)),
  );

  server.tool("memory_reindex", "Rebuild index from markdown files", {}, async () =>
    wrap(() => svc.reindex()),
  );

  server.tool(
    "memory_doctor",
    "Self-check report",
    { prefetch_model: z.boolean().optional() },
    async (args) => wrap(() => svc.doctor(!!args.prefetch_model)),
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

export { loadRuntime } from "./config.js";
export { MemoryService } from "./service.js";
