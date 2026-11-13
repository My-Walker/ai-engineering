import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeDb } from "../src/index/db.js";
import { loadRuntime } from "../src/config.js";
import { MemoryService } from "../src/service.js";
import { ensureCanonicalScaffold } from "../src/store/fs-canonical.js";
import { isSeedDone } from "../src/store/fs-seed.js";
import { listPendingSeedInbox } from "../src/store/fs-inbox.js";
import { runInit } from "../src/init/run-init.js";

describe("memory seed cold-start", () => {
  let dir: string;
  let svc: MemoryService;
  let memoryRoot: string;

  before(() => {
    dir = mkdtempSync(join(tmpdir(), "am-seed-"));
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: "seed-demo", dependencies: { zod: "3.0.0" } }),
      "utf8",
    );
    runInit({
      projectRoot: dir,
      skipRules: true,
      skipCommands: true,
      skipClaudeRules: true,
      skipMcp: true,
    });
    memoryRoot = join(dir, ".agent-memory");
    const rt = loadRuntime({ projectRoot: dir, memoryRoot });
    rt.config.semantic.enabled = false;
    ensureCanonicalScaffold(rt.memoryRoot);
    svc = new MemoryService(rt);
  });

  after(() => {
    closeDb(memoryRoot);
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* windows sqlite lock */
    }
  });

  it("fetch meta recommends seed when empty and not done", () => {
    const res = svc.fetchContext();
    assert.equal(res.ok, true);
    assert.equal(res.meta.canonical_empty, true);
    assert.equal(res.meta.seed_done, false);
    assert.equal(res.meta.seed_recommended, true);
  });

  it("rejects seed_draft without confirmed_by_user", async () => {
    const res = await svc.seedDraft({
      items: [
        {
          title: "t",
          topic: "domain",
          summary: "s",
          body: "b",
        },
      ],
    });
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.code, "CONFIRMATION_REQUIRED");
  });

  it("seed_draft writes inbox, does not set seed_done, warns missing topics", async () => {
    const res = await svc.seedDraft({
      confirmed_by_user: true,
      items: [
        {
          title: "词义：种子",
          topic: "domain",
          summary: "冷启动词义",
          body: "正文",
        },
      ],
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(isSeedDone(memoryRoot), false);
    assert.equal(listPendingSeedInbox(memoryRoot).length, 1);
    const warnings = (res as { warnings?: string[] }).warnings;
    const facts = (res as { facts?: { packageName?: string; dependencyKeys?: string[] } })
      .facts;
    assert.ok(Array.isArray(warnings) && warnings.length > 0);
    assert.equal(facts?.packageName, "seed-demo");
    assert.ok(facts?.dependencyKeys?.includes("zod"));
  });

  it("idempotent seed_draft replaces pending seed items", async () => {
    const res = await svc.seedDraft({
      confirmed_by_user: true,
      items: [
        {
          title: "约定：格式",
          topic: "conventions",
          summary: "格式约定",
          body: "用 md",
        },
        {
          title: "词义：二",
          topic: "domain",
          summary: "二",
          body: "b",
        },
      ],
    });
    assert.equal(res.ok, true);
    assert.equal(listPendingSeedInbox(memoryRoot).length, 2);
  });

  it("promote seed inbox sets seed_done", async () => {
    const pending = listPendingSeedInbox(memoryRoot);
    assert.ok(pending.length >= 1);
    const id = pending[0]!.frontmatter.id;
    const topic = (pending[0]!.frontmatter.suggested_topic as string) || "domain";
    const res = await svc.inboxPromote({
      confirmed_by_user: true,
      id,
      topic,
      title: pending[0]!.frontmatter.title,
      summary: "s",
    });
    assert.equal(res.ok, true);
    assert.equal(isSeedDone(memoryRoot), true);
    const fetch = svc.fetchContext();
    assert.equal(fetch.meta.seed_done, true);
    assert.equal(fetch.meta.seed_recommended, false);
  });

  it("rejects seed_draft when not eligible", async () => {
    const res = await svc.seedDraft({
      confirmed_by_user: true,
      items: [
        {
          title: "x",
          topic: "pitfalls",
          summary: "s",
          body: "b",
        },
      ],
    });
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.code, "VALIDATION_ERROR");
  });
});

describe("memory seed skip keeps empty", () => {
  let dir: string;
  let svc: MemoryService;
  let memoryRoot: string;

  before(() => {
    dir = mkdtempSync(join(tmpdir(), "am-seed-skip-"));
    runInit({
      projectRoot: dir,
      skipRules: true,
      skipCommands: true,
      skipClaudeRules: true,
      skipMcp: true,
    });
    memoryRoot = join(dir, ".agent-memory");
    const rt = loadRuntime({ projectRoot: dir, memoryRoot });
    rt.config.semantic.enabled = false;
    ensureCanonicalScaffold(rt.memoryRoot);
    svc = new MemoryService(rt);
  });

  after(() => {
    closeDb(memoryRoot);
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it("skip sets seed_done while still empty", async () => {
    const skip = await svc.seedSkip({ confirmed_by_user: true });
    assert.equal(skip.ok, true);
    assert.equal(isSeedDone(memoryRoot), true);
    assert.ok(existsSync(join(memoryRoot, "workspace", "seed_done")));
    const fetch = svc.fetchContext();
    assert.equal(fetch.meta.canonical_empty, true);
    assert.equal(fetch.meta.seed_done, true);
    assert.equal(fetch.meta.seed_recommended, false);
  });

  it("draft rejected after skip", async () => {
    const res = await svc.seedDraft({
      confirmed_by_user: true,
      items: [
        {
          title: "t",
          topic: "modules",
          summary: "s",
          body: "b",
        },
      ],
    });
    assert.equal(res.ok, false);
  });
});
