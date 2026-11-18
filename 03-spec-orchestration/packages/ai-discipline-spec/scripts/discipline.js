#!/usr/bin/env node
"use strict";

const path = require("path");
const { findHostRoot } = require("./lib/fs-util");
const { runValidate } = require("./validate");
const { runSync } = require("./sync");
const { runInstall } = require("./install");

function printHelp() {
  console.log(`ai-discipline CLI

用法:
  discipline validate [--root <dir>]
  discipline sync [--root <dir>] [--claude]
  discipline install [--root <dir>] [--hosts cursor,claude,codex] [--force]

--force：用 seed 整文件覆盖已存在的同名 workflows/skills/rules/docs 与 commands/index.yaml；
        不删除本地多出来的资产；末尾仍 sync 重写 index 与 AGENTS 标记块。
        会丢掉同名文件的本地修改，先提交或备份。

未指定 --root 时，安装/校验目标为当前工作目录（或作为依赖安装时的业务项目根）。
`);
}

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  if (!cmd || cmd === "-h" || cmd === "--help") {
    printHelp();
    return;
  }

  const rootIdx = argv.indexOf("--root");
  const rootDir =
    rootIdx !== -1 && argv[rootIdx + 1]
      ? path.resolve(argv[rootIdx + 1])
      : findHostRoot();

  if (cmd === "validate") {
    runValidate(rootDir);
    return;
  }
  if (cmd === "sync") {
    runSync(rootDir, { claude: argv.includes("--claude") });
    return;
  }
  if (cmd === "install") {
    await runInstall(argv);
    return;
  }
  console.error(`未知命令: ${cmd}`);
  printHelp();
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
