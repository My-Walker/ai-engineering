"use strict";

const fs = require("fs");
const path = require("path");

const PACKAGE_ID = "ai-discipline";
const START = `<!-- ${PACKAGE_ID}:start -->`;
const END = `<!-- ${PACKAGE_ID}:end -->`;

function packageRoot() {
  return path.resolve(__dirname, "..", "..");
}

function seedRoot() {
  return path.join(packageRoot(), "seed");
}

function templatesRoot() {
  return path.join(packageRoot(), "templates");
}

function findHostRoot(fromDir = packageRoot()) {
  const parts = fromDir.split(path.sep);
  const idx = parts.lastIndexOf("node_modules");
  if (idx !== -1) {
    if (process.env.INIT_CWD) return path.resolve(process.env.INIT_CWD);
    return parts.slice(0, idx).join(path.sep);
  }
  return process.cwd();
}

function disciplineRoot(hostRoot) {
  return path.join(hostRoot, ".ai-discipline");
}

function writeIfChanged(filePath, next) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
  if (existing === next) {
    return { action: "skip", filePath };
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, next, "utf8");
  return { action: existing === null ? "write" : "update", filePath };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceMarkedBlock(existing, body) {
  const block = `${START}\n${body.trim()}\n${END}\n`;
  const marked = new RegExp(
    `${escapeRegExp(START)}[\\s\\S]*?${escapeRegExp(END)}\\r?\\n?`
  );
  if (marked.test(existing)) {
    return existing.replace(marked, block);
  }
  if (!existing.trim()) {
    return block;
  }
  return `${block}\n${existing}`;
}

function listMdFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "index.md")
    .map((f) => path.join(dir, f));
}

module.exports = {
  PACKAGE_ID,
  START,
  END,
  packageRoot,
  seedRoot,
  templatesRoot,
  findHostRoot,
  disciplineRoot,
  writeIfChanged,
  escapeRegExp,
  replaceMarkedBlock,
  listMdFiles,
};
