import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { configToYaml, defaultConfig } from "../config.js";
import { ensureCanonicalScaffold } from "../store/fs-canonical.js";
import { memoryPaths, resolveProjectRoot } from "../paths.js";
import { TOPICS } from "../types.js";
import { FOUR_STATE_TEMPLATE, RULES_BODY, CLAUDE_ANCHOR } from "../templates/texts.js";

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export type InitOptions = {
  projectRoot?: string;
  memoryRoot?: string;
  skipRules?: boolean;
  skipCommands?: boolean;
  skipClaudeRules?: boolean;
  skipMcp?: boolean;
  mcpTarget?: "cursor" | "mcp-json" | "both" | "print";
  hooks?: boolean;
  force?: boolean;
};

function ensureDir(p: string) {
  mkdirSync(p, { recursive: true });
}

function writeIfAbsent(path: string, content: string, force?: boolean) {
  if (existsSync(path) && !force) return "skip";
  ensureDir(dirname(path));
  writeFileSync(path, content, "utf8");
  return "write";
}

function mergeGitignore(projectRoot: string, memoryRel = ".agent-memory") {
  const gi = join(projectRoot, ".gitignore");
  const block = [
    "",
    "# agent-memory",
    `${memoryRel}/inbox/`,
    `${memoryRel}/index/`,
    `${memoryRel}/logs/`,
    "",
  ].join("\n");
  if (!existsSync(gi)) {
    writeFileSync(gi, block.trimStart(), "utf8");
    return;
  }
  const cur = readFileSync(gi, "utf8");
  if (cur.includes(`${memoryRel}/inbox/`)) return;
  appendFileSync(gi, block, "utf8");
}

function mcpSnippet(command: string, args: string[]): object {
  return {
    mcpServers: {
      "agent-memory": {
        command,
        args,
      },
    },
  };
}

function mergeMcpJson(path: string, snippet: object, force?: boolean) {
  ensureDir(dirname(path));
  let existing: Record<string, unknown> = {};
  if (existsSync(path)) {
    try {
      existing = JSON.parse(readFileSync(path, "utf8"));
    } catch {
      existing = {};
    }
  }
  const servers = {
    ...((existing.mcpServers as object) || {}),
    ...((snippet as { mcpServers: object }).mcpServers || {}),
  };
  if (!force && existing.mcpServers && (existing.mcpServers as Record<string, unknown>)["agent-memory"]) {
    // still merge/overwrite agent-memory entry for idempotent init
  }
  const out = { ...existing, mcpServers: servers };
  writeFileSync(path, JSON.stringify(out, null, 2) + "\n", "utf8");
}

function packageBin(): { command: string; args: string[] } {
  // Prefer npx published name; local path fallback for monorepo
  return {
    command: "npx",
    args: ["-y", "@mdd-ai-eng/agent-memory-mcp", "mcp"],
  };
}

export function runInit(opts: InitOptions = {}): { ok: true; log: string[] } {
  const projectRoot = resolveProjectRoot(opts.projectRoot);
  const memoryRoot = opts.memoryRoot
    ? opts.memoryRoot
    : join(projectRoot, ".agent-memory");
  const log: string[] = [];
  const paths = memoryPaths(memoryRoot);

  ensureDir(memoryRoot);
  ensureDir(paths.inbox);
  ensureDir(paths.archive);
  ensureDir(paths.index);
  ensureDir(paths.logs);
  ensureDir(dirname(paths.handoff));
  ensureCanonicalScaffold(memoryRoot);
  log.push("memory dirs");

  const cfg = defaultConfig();
  writeIfAbsent(paths.config, configToYaml(cfg), opts.force);
  log.push("config.yaml");

  for (const t of TOPICS) {
    writeIfAbsent(
      join(memoryRoot, "templates", `${t}.md`),
      t === "decisions"
        ? "# Context\n\n# Decision\n\n# Consequences\n"
        : `# ${t}\n\n`,
      opts.force,
    );
  }
  log.push("templates");

  mergeGitignore(projectRoot);
  log.push("gitignore");

  const bin = packageBin();
  const snippet = mcpSnippet(bin.command, bin.args);
  const target = opts.mcpTarget || "both";
  if (opts.skipMcp || target === "print") {
    log.push("mcp: " + JSON.stringify(snippet));
  } else {
    if (target === "cursor" || target === "both") {
      mergeMcpJson(join(projectRoot, ".cursor", "mcp.json"), snippet, opts.force);
      log.push(".cursor/mcp.json");
    }
    if (target === "mcp-json" || target === "both") {
      mergeMcpJson(join(projectRoot, ".mcp.json"), snippet, opts.force);
      log.push(".mcp.json");
    }
  }

  if (!opts.skipRules) {
    const rulePath = join(projectRoot, ".cursor", "rules", "agent-memory.mdc");
    writeIfAbsent(
      rulePath,
      `---\ndescription: Agent memory governance\nglobs:\nalwaysApply: true\n---\n\n${RULES_BODY}\n\n${FOUR_STATE_TEMPLATE}\n`,
      opts.force,
    );
    log.push("cursor rules");
  }

  if (!opts.skipClaudeRules) {
    const claudePath = join(projectRoot, "CLAUDE.md");
    const start = "<!-- agent-memory:start -->";
    const end = "<!-- agent-memory:end -->";
    const block = `${start}\n${CLAUDE_ANCHOR}\n${end}`;
    if (!existsSync(claudePath)) {
      writeFileSync(claudePath, block + "\n", "utf8");
    } else {
      const cur = readFileSync(claudePath, "utf8");
      if (cur.includes(start) && cur.includes(end)) {
        const next = cur.replace(
          new RegExp(`${start}[\\s\\S]*?${end}`),
          block,
        );
        writeFileSync(claudePath, next, "utf8");
      } else {
        writeFileSync(claudePath, cur.trimEnd() + "\n\n" + block + "\n", "utf8");
      }
    }
    log.push("CLAUDE.md anchor");
  }

  if (!opts.skipCommands) {
    const cmdDir = join(projectRoot, ".cursor", "commands");
    ensureDir(cmdDir);
    const commands: Record<string, string> = {
      "memory-fetch-context.md":
        "调用 memory_fetch_context；有任务带 query。有卡只卡；无卡 roster+探针。只读召回；meta.seed_recommended 仅信号，勿在此建档。",
      "memory-draft-save.md":
        "拟稿 → 人审四态 → memory_write 或 inbox；处理 near_matches。禁止静默写正式。",
      "memory-inbox-list.md": "inbox_list 后可 promote/discard。不自动转正。",
      "memory-dedupe-review.md":
        "memory_dedupe_scan → 拟合并文 → 四态 → memory_dedupe_apply。",
      "memory-handoff-update.md": "整卡覆盖 handoff_update。不写正式。",
      "memory-handoff-clear.md": "handoff_clear。",
      "memory-doctor.md":
        "memory_doctor（含 seed 生命周期）；索引不一致时询问是否 memory_reindex，同意再重建。",
    };
    for (const [name, body] of Object.entries(commands)) {
      writeIfAbsent(join(cmdDir, name), `# ${name.replace(".md", "")}\n\n${body}\n`, opts.force);
    }
    log.push("cursor commands");
  }

  // Stop hook
  const hooksJson = join(projectRoot, ".cursor", "hooks.json");
  const hookScript = join(projectRoot, ".cursor", "hooks", "memory-stop.mjs");
  ensureDir(dirname(hookScript));
  writeFileSync(
    hookScript,
    `#!/usr/bin/env node
// Agent Stop → remind / best-effort handoff update via CLI if available
import { spawnSync } from "node:child_process";
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (input += c));
process.stdin.on("end", () => {
  try {
    const payload = input ? JSON.parse(input) : {};
    // Non-LLM: optional CLI handoff stub — agents should still call handoff_update
    if (payload.status === "completed" || payload.status === "aborted" || payload.status === "error") {
      spawnSync("npx", ["-y", "@mdd-ai-eng/agent-memory-mcp", "handoff-stub"], {
        stdio: "ignore",
        shell: true,
      });
    }
  } catch { /* ignore */ }
  process.stdout.write("{}");
});
`,
    "utf8",
  );
  const hooksDoc = {
    version: 1,
    hooks: {
      stop: [{ command: "node .cursor/hooks/memory-stop.mjs" }],
    },
  };
  if (!existsSync(hooksJson) || opts.force) {
    writeFileSync(hooksJson, JSON.stringify(hooksDoc, null, 2) + "\n", "utf8");
  } else {
    try {
      const cur = JSON.parse(readFileSync(hooksJson, "utf8"));
      cur.hooks = cur.hooks || {};
      cur.hooks.stop = cur.hooks.stop || [];
      const has = JSON.stringify(cur.hooks.stop).includes("memory-stop");
      if (!has) cur.hooks.stop.push({ command: "node .cursor/hooks/memory-stop.mjs" });
      writeFileSync(hooksJson, JSON.stringify(cur, null, 2) + "\n", "utf8");
    } catch {
      writeFileSync(hooksJson, JSON.stringify(hooksDoc, null, 2) + "\n", "utf8");
    }
  }
  log.push("cursor stop hooks");

  if (opts.hooks) {
    const gitHooks = join(projectRoot, ".git", "hooks");
    if (existsSync(join(projectRoot, ".git"))) {
      ensureDir(gitHooks);
      const pc = join(gitHooks, "post-commit");
      writeFileSync(
        pc,
        `#!/bin/sh\n# agent-memory: non-LLM stub only — does NOT write inbox/canonical\necho "[agent-memory] post-commit noop" >&2\n`,
        "utf8",
      );
      log.push("git post-commit (noop)");
    } else {
      log.push("skip git hooks (not a git repo)");
    }
  }

  log.push(
    "下一步：正式记忆仍空时，会话中见 seed_recommended 可提议 memory_seed_draft（人审后）；跳过用 memory_seed_skip。fetch_context 只召回不建档。",
  );
  void PKG_ROOT;
  return { ok: true, log };
}
