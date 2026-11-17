"use strict";

const fs = require("fs");
const path = require("path");
const {
  disciplineRoot,
  templatesRoot,
  listMdFiles,
  writeIfChanged,
  replaceMarkedBlock,
  START,
  END,
} = require("./lib/fs-util");
const { readDoc } = require("./lib/parse");
const { validateDiscipline } = require("./validate");

function buildIndex(workflowsDir) {
  const entries = [];
  for (const file of listMdFiles(workflowsDir)) {
    const doc = readDoc(file);
    const d = doc.data;
    if (d.kind !== "sop") continue;
    const triggers = (d.triggers || []).map((t) => JSON.stringify(String(t))).join(", ");
    const priority = typeof d.priority === "number" ? d.priority : 0;
    entries.push({
      priority,
      block: [
        `- id: ${d.id}`,
        `  name: ${d.name}`,
        `  priority: ${priority}`,
        `  triggers: [${triggers}]`,
        `  path: "./${d.id}.md"`,
        "",
      ].join("\n"),
    });
  }
  entries.sort((a, b) => b.priority - a.priority);
  return [
    "---",
    "kind: workflow-index",
    "---",
    "",
    "# SOP 索引",
    "",
    ...entries.map((e) => e.block),
  ].join("\n");
}

function collectSummaries(rulesDir) {
  const lines = [];
  let n = 1;
  for (const file of listMdFiles(rulesDir)) {
    const doc = readDoc(file);
    if (doc.data.always === true && doc.data.summary) {
      lines.push(`${n}. **${doc.data.name}**：${doc.data.summary}`);
      n += 1;
    }
  }
  if (lines.length === 0) {
    lines.push("1. （无 always 规则 summary）");
  }
  return lines.join("\n");
}

function buildAgentsBody(rootDir) {
  const base = disciplineRoot(rootDir);
  const templatePath = path.join(templatesRoot(), "agents-generated.md");
  let template = fs.readFileSync(templatePath, "utf8");
  const summaries = collectSummaries(path.join(base, "rules"));
  template = template.replace("{{SUMMARIES}}", summaries);
  return template.trim() + "\n";
}

function syncDiscipline(rootDir, options = {}) {
  const result = validateDiscipline(rootDir);
  if (!result.ok) {
    console.error("sync 中止：validate 失败");
    for (const e of result.errors) console.error(`  - ${e}`);
    return { ok: false, result };
  }

  const base = disciplineRoot(rootDir);
  const workflowsDir = path.join(base, "workflows");
  const indexPath = path.join(workflowsDir, "index.md");
  const indexBody = buildIndex(workflowsDir);
  const indexWrite = writeIfChanged(indexPath, indexBody);

  const agentsPath = path.join(rootDir, "AGENTS.md");
  const agentsBody = buildAgentsBody(rootDir);
  const existingAgents = fs.existsSync(agentsPath)
    ? fs.readFileSync(agentsPath, "utf8")
    : "";
  const nextAgents = replaceMarkedBlock(existingAgents, agentsBody);
  const agentsWrite = writeIfChanged(agentsPath, nextAgents);

  const actions = [indexWrite, agentsWrite];

  if (options.claude || fs.existsSync(path.join(rootDir, "CLAUDE.md"))) {
    const claudePath = path.join(rootDir, "CLAUDE.md");
    const prev = fs.existsSync(claudePath) ? fs.readFileSync(claudePath, "utf8") : "";
    const claudeNext = replaceMarkedBlock(prev, agentsBody);
    actions.push(writeIfChanged(claudePath, claudeNext));
  }

  for (const a of actions) {
    const label = { skip: "跳过", update: "更新", write: "写入" }[a.action];
    console.log(`[${label}] ${a.filePath}`);
  }
  return { ok: true, actions };
}

function runSync(rootDir, options) {
  const out = syncDiscipline(rootDir, options);
  if (!out.ok) process.exitCode = 1;
  return out;
}

module.exports = { syncDiscipline, runSync, buildIndex, buildAgentsBody };
