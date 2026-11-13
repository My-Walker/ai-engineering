import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildFtsMatchQuery, cjkBigramPreprocess } from "../src/index/fts.js";

describe("CJK bigram FTS", () => {
  it("splits Chinese into bigrams", () => {
    const t = cjkBigramPreprocess("电力监控系统");
    assert.ok(t.includes("电力"));
    assert.ok(t.includes("系统"));
  });

  it("uses OR for short queries", () => {
    const q = buildFtsMatchQuery("电力");
    assert.equal(q.mode, "or");
    assert.ok(q.bigramCount <= 2);
  });

  it("uses ratio mode for longer queries", () => {
    const q = buildFtsMatchQuery("电力监控系统部署");
    assert.equal(q.mode, "ratio");
    assert.ok(q.bigramCount > 2);
  });
});
