import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { contentHash } from "../src/hash.js";

describe("contentHash", () => {
  it("hashes body only with LF normalization", () => {
    const a = contentHash("hello\r\nworld  ");
    const b = contentHash("hello\nworld");
    assert.equal(a, b);
  });

  it("differs when body differs", () => {
    assert.notEqual(contentHash("a"), contentHash("b"));
  });
});
