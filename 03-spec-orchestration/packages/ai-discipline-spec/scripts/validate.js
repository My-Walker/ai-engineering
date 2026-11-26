"use strict";

const fs = require("fs");
const path = require("path");
const { disciplineRoot, listMdFiles } = require("./lib/fs-util");
const { readDoc, parseCommandsYaml } = require("./lib/parse");

function refKindId(ref) {
  const m = String(ref).match(/^(skill|rule|sop|dispatch):(.+)$/);
  if (!m) return null;
  return { kind: m[1], id: m[2] };
}

function validateDiscipline(rootDir) {
  const errors = [];
  const base = disciplineRoot(rootDir);
  if (!fs.existsSync(base)) {
    return { ok: false, errors: [`缺少目录: ${base}`] };
  }

  const rulesDir = path.join(base, "rules");
  const skillsDir = path.join(base, "skills");
  const workflowsDir = path.join(base, "workflows");
  const commandsFile = path.join(base, "commands", "index.yaml");

  const byKind = { rule: new Map(), skill: new Map(), sop: new Map() };

  function ingest(kind, dir) {
    for (const file of listMdFiles(dir)) {
      const baseName = path.basename(file, ".md");
      let doc;
      try {
        doc = readDoc(file);
      } catch (e) {
        errors.push(`${file}: 无法解析 (${e.message})`);
        continue;
      }
      const d = doc.data;
      if (d.kind !== kind) {
        errors.push(`${file}: kind 应为 ${kind}，实际 ${d.kind}`);
      }
      if (!d.id || !d.name || !d.description) {
        errors.push(`${file}: 缺少 id/name/description`);
      }
      if (d.id && d.id !== baseName) {
        errors.push(`${file}: 文件名须等于 id（${d.id}）`);
      }
      if (kind === "rule") {
        if (d.role !== "gate" && d.role !== "convention") {
          errors.push(`${file}: role 须为 gate|convention`);
        }
        if (typeof d.always !== "boolean") {
          errors.push(`${file}: always 须为布尔`);
        }
        if (d.always === true && !d.summary) {
          errors.push(`${file}: always:true 须有 summary`);
        }
      }
      if (kind === "sop") {
        if (!Array.isArray(d.triggers) || d.triggers.length === 0) {
          errors.push(`${file}: triggers 须为非空数组`);
        }
        if (!Array.isArray(d.steps) || d.steps.length === 0) {
          errors.push(`${file}: steps 须为非空数组`);
        }
        if (d.priority !== undefined && typeof d.priority !== "number") {
          errors.push(`${file}: priority 须为整数`);
        }
      }
      if (d.id) {
        if (byKind[kind].has(d.id)) {
          errors.push(`重复 id: ${kind}:${d.id}`);
        }
        byKind[kind].set(d.id, file);
      }
    }
  }

  ingest("rule", rulesDir);
  ingest("skill", skillsDir);
  ingest("sop", workflowsDir);

  if (!byKind.skill.has("ask-route")) {
    errors.push("建议/要求: 缺少 skill:ask-route");
  }

  for (const file of listMdFiles(workflowsDir)) {
    const doc = readDoc(file);
    const steps = doc.data.steps || [];
    for (const step of steps) {
      const use = step.use || step;
      const parsed = refKindId(typeof use === "string" ? use : "");
      if (!parsed) {
        errors.push(`${file}: 无效 steps.use: ${JSON.stringify(step)}`);
        continue;
      }
      if (
        parsed.kind !== "skill" &&
        parsed.kind !== "rule" &&
        parsed.kind !== "dispatch"
      ) {
        errors.push(`${file}: steps 只能引用 skill|rule|dispatch: ${use}`);
        continue;
      }
      // dispatch:<skillId> → 目标须为已存在的 skill；做法见 skill:dispatch-run
      const resolveKind = parsed.kind === "dispatch" ? "skill" : parsed.kind;
      if (!byKind[resolveKind].has(parsed.id)) {
        errors.push(`${file}: 引用不存在 ${use}`);
      }
      if (parsed.kind === "dispatch" && !byKind.skill.has("dispatch-run")) {
        errors.push(`${file}: 使用 dispatch: 须存在 skill:dispatch-run`);
      }
      if (
        typeof step === "object" &&
        step !== null &&
        step.confirm !== undefined &&
        step.confirm !== true &&
        step.confirm !== false
      ) {
        errors.push(`${file}: steps.confirm 须为布尔（${use}）`);
      }
    }
    for (const ins of doc.data.inserts || []) {
      const ref = typeof ins === "string" ? ins : ins.use;
      const parsed = refKindId(ref.startsWith("skill:") ? ref : `skill:${ref}`);
      if (!parsed || !byKind.skill.has(parsed.id)) {
        errors.push(`${file}: inserts 引用不存在 ${ref}`);
      }
    }
  }

  if (!fs.existsSync(commandsFile)) {
    errors.push(`缺少 ${commandsFile}`);
  } else {
    const yaml = fs.readFileSync(commandsFile, "utf8");
    const { commands } = parseCommandsYaml(yaml);
    if (commands.length === 0) {
      errors.push("commands/index.yaml 无条目");
    }
    if (commands.length > 10) {
      errors.push(`command 超过 10 条: ${commands.length}`);
    }
    const ids = new Set();
    let hasAuthor = false;
    for (const c of commands) {
      if (!c.skill || !c.title) {
        errors.push("commands 条目须含 skill 与 title");
        continue;
      }
      if (ids.has(c.skill)) errors.push(`command 重复: ${c.skill}`);
      ids.add(c.skill);
      if (c.skill === "discipline-author") hasAuthor = true;
      if (!byKind.skill.has(c.skill)) {
        errors.push(`command 指向不存在的 skill: ${c.skill}`);
      }
    }
    if (!hasAuthor) errors.push("commands 必须包含 discipline-author");
  }

  return { ok: errors.length === 0, errors, byKind };
}

function runValidate(rootDir) {
  const result = validateDiscipline(rootDir);
  if (!result.ok) {
    console.error("validate 失败:");
    for (const e of result.errors) console.error(`  - ${e}`);
    process.exitCode = 1;
  } else {
    console.log("validate 通过");
  }
  return result;
}

module.exports = { validateDiscipline, runValidate };
