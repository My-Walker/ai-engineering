import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeDb } from "../src/index/db.js";
import { loadRuntime } from "../src/config.js";
import { MemoryService } from "../src/service.js";
import { ensureCanonicalScaffold } from "../src/store/fs-canonical.js";
import { runInit } from "../src/init/run-init.js";

describe("write gates", () => {
  let dir: string;
  let svc: MemoryService;

  before(() => {
    dir = mkdtempSync(join(tmpdir(), "am-"));
    runInit({
      projectRoot: dir,
      skipRules: true,
      skipCommands: true,
      skipClaudeRules: true,
      skipMcp: true,
    });
    const rt = loadRuntime({ projectRoot: dir, memoryRoot: join(dir, ".agent-memory") });
    // disable semantic for fast unit tests
    rt.config.semantic.enabled = false;
    ensureCanonicalScaffold(rt.memoryRoot);
    svc = new MemoryService(rt);
  });

  after(() => {
    closeDb(join(dir, ".agent-memory"));
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* windows may keep the sqlite file briefly */
    }
  });

  it("rejects write without confirmed_by_user", async () => {
    const res = await svc.write({
      title: "t",
      topic: "decisions",
      summary: "s",
      body: "body",
    });
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.code, "CONFIRMATION_REQUIRED");
  });

  it("writes with confirmation", async () => {
    const res = await svc.write({
      confirmed_by_user: true,
      title: "采用 sqlite",
      topic: "decisions",
      summary: "用 better-sqlite3",
      body: "决策正文",
      slug: "use-sqlite",
    });
    assert.equal(res.ok, true);
  });

  it("rejects secret-like content", async () => {
    const res = await svc.write({
      confirmed_by_user: true,
      title: "密钥",
      topic: "pitfalls",
      summary: "bad",
      body: "key AKIAIOSFODNN7EXAMPLE should fail",
      slug: "secret-test",
    });
    // AKIA + 16 chars
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.code, "SECRET_REJECTED");
  });
});
