#!/usr/bin/env node
import { loadRuntime } from "./config.js";
import { startMcpServer } from "./index.js";
import { runInit } from "./init/run-init.js";
import { MemoryService } from "./service.js";
import { prefetchModel } from "./index/embed.js";

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0] || "mcp";

  if (cmd === "mcp" || cmd === "serve") {
    await startMcpServer();
    return;
  }

  if (cmd === "init") {
    const opts = {
      projectRoot: flag(argv, "--project"),
      memoryRoot: flag(argv, "--memory-root"),
      skipRules: argv.includes("--skip-rules"),
      skipCommands: argv.includes("--skip-commands"),
      skipClaudeRules: argv.includes("--skip-claude-rules"),
      skipMcp: argv.includes("--skip-mcp"),
      hooks: argv.includes("--hooks"),
      force: argv.includes("--force"),
      mcpTarget: (flag(argv, "--mcp-target") as
        | "cursor"
        | "mcp-json"
        | "both"
        | "print"
        | undefined) || "both",
    };
    const res = runInit(opts);
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  if (cmd === "doctor") {
    const rt = loadRuntime({
      projectRoot: flag(argv, "--project"),
      memoryRoot: flag(argv, "--memory-root"),
    });
    const svc = new MemoryService(rt);
    const prefetch = argv.includes("--prefetch-model");
    const res = await svc.doctor(prefetch);
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  if (cmd === "handoff-stub") {
    // Stop hook best-effort: no LLM; leave to agent handoff_update
    process.exit(0);
  }

  if (cmd === "prefetch-model") {
    const rt = loadRuntime();
    const res = await prefetchModel(rt.config, rt.embeddingCacheDir);
    console.log(JSON.stringify(res, null, 2));
    process.exit(res.ok ? 0 : 1);
  }

  console.error(`Usage: agent-memory-mcp <mcp|init|doctor|prefetch-model> [options]`);
  process.exit(1);
}

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("-")) return argv[i + 1];
  const eq = argv.find((a) => a.startsWith(name + "="));
  if (eq) return eq.slice(name.length + 1);
  return undefined;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
