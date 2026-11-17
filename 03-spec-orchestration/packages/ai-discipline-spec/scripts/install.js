"use strict";

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const {
  seedRoot,
  disciplineRoot,
  findHostRoot,
  writeIfChanged,
} = require("./lib/fs-util");
const { installHostCommands } = require("./lib/hosts");
const { syncDiscipline } = require("./sync");

const ALL_HOSTS = ["cursor", "claude", "codex"];

function copyMissing(srcDir, destDir, { overwrite = false } = {}) {
  const actions = [];
  if (!fs.existsSync(srcDir)) return actions;
  fs.mkdirSync(destDir, { recursive: true });
  for (const name of fs.readdirSync(srcDir)) {
    const from = path.join(srcDir, name);
    const to = path.join(destDir, name);
    const stat = fs.statSync(from);
    if (stat.isDirectory()) {
      actions.push(...copyMissing(from, to, { overwrite }));
      continue;
    }
    if (!overwrite && fs.existsSync(to)) {
      actions.push({ action: "skip", filePath: to });
      continue;
    }
    const body = fs.readFileSync(from, "utf8");
    actions.push(writeIfChanged(to, body));
  }
  return actions;
}

function copySeed(hostRoot) {
  const seed = seedRoot();
  const dest = disciplineRoot(hostRoot);
  const actions = [];
  // workflows / skills / rules: never overwrite
  for (const sub of ["workflows", "skills", "rules"]) {
    actions.push(
      ...copyMissing(path.join(seed, sub), path.join(dest, sub), { overwrite: false })
    );
  }
  // commands/index.yaml: do not overwrite if exists
  const cmdSrc = path.join(seed, "commands", "index.yaml");
  const cmdDest = path.join(dest, "commands", "index.yaml");
  if (fs.existsSync(cmdSrc)) {
    if (fs.existsSync(cmdDest)) {
      actions.push({ action: "skip", filePath: cmdDest });
    } else {
      actions.push(writeIfChanged(cmdDest, fs.readFileSync(cmdSrc, "utf8")));
    }
  }
  return actions;
}

function parseHostsArg(argv) {
  const idx = argv.indexOf("--hosts");
  if (idx === -1) return null;
  const raw = argv[idx + 1] || "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function askHosts() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log("选择宿主（逗号分隔）: cursor, claude, codex");
    rl.question("> ", (answer) => {
      rl.close();
      const hosts = answer
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter((h) => ALL_HOSTS.includes(h));
      resolve(hosts.length ? hosts : ["cursor"]);
    });
  });
}

async function installDiscipline(hostRoot, hosts) {
  const seedActions = copySeed(hostRoot);
  for (const a of seedActions) {
    const label = { skip: "跳过", update: "更新", write: "写入", delete: "删除" }[a.action];
    console.log(`[seed ${label}] ${a.filePath}`);
  }

  const hostActions = installHostCommands(hostRoot, disciplineRoot(hostRoot), hosts);
  for (const a of hostActions) {
    const label = { skip: "跳过", update: "更新", write: "写入", delete: "删除" }[a.action];
    console.log(`[host ${label}] ${a.filePath}`);
  }

  const syncOpts = { claude: hosts.includes("claude") };
  const syncResult = syncDiscipline(hostRoot, syncOpts);
  return { seedActions, hostActions, syncResult };
}

async function runInstall(argv = process.argv.slice(2)) {
  const hostRoot = (() => {
    const i = argv.indexOf("--root");
    if (i !== -1 && argv[i + 1]) return path.resolve(argv[i + 1]);
    return findHostRoot();
  })();

  let hosts = parseHostsArg(argv);
  if (!hosts || hosts.length === 0) {
    if (!process.stdin.isTTY) {
      hosts = ["cursor"];
      console.log("非交互环境，默认 hosts=cursor");
    } else {
      hosts = await askHosts();
    }
  }
  for (const h of hosts) {
    if (!ALL_HOSTS.includes(h)) {
      console.error(`未知宿主: ${h}`);
      process.exitCode = 1;
      return;
    }
  }

  console.log(`安装根目录: ${hostRoot}`);
  console.log(`宿主: ${hosts.join(", ")}`);
  const out = await installDiscipline(hostRoot, hosts);
  if (out.syncResult && !out.syncResult.ok) {
    process.exitCode = 1;
  }
  return out;
}

module.exports = { runInstall, installDiscipline, copySeed, ALL_HOSTS };
