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

/** install 写入 .gitignore 的标记；已有 `.scratch/` 行或本标记则跳过 */
const SCRATCH_GITIGNORE_MARKER = "# ai-discipline scratch";

/**
 * 幂等追加 `.scratch/` 到仓根 `.gitignore`（不整文件重写）。
 * 团队要入库可删本段，或 install --no-gitignore-scratch。
 */
function ensureScratchGitignore(hostRoot) {
  const filePath = path.join(hostRoot, ".gitignore");
  const block = [
    SCRATCH_GITIGNORE_MARKER,
    "# 本机 spec/runtime；要入库可删本段，或 install --no-gitignore-scratch",
    ".scratch/",
    "",
  ].join("\n");

  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
  if (existing !== null) {
    if (
      existing.includes(SCRATCH_GITIGNORE_MARKER) ||
      /(^|[\r\n])\.scratch\/?[ \t]*(#.*)?(\r?\n|$)/.test(existing)
    ) {
      return { action: "skip", filePath };
    }
    const sep = existing.endsWith("\n") || existing === "" ? "" : "\n";
    const next = `${existing}${sep}\n${block}`;
    fs.writeFileSync(filePath, next, "utf8");
    return { action: "update", filePath };
  }

  fs.writeFileSync(filePath, block, "utf8");
  return { action: "write", filePath };
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
  SCRATCH_GITIGNORE_MARKER,
  ensureScratchGitignore,
};
