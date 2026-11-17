"use strict";

const fs = require("fs");
const path = require("path");
const { writeIfChanged, PACKAGE_ID } = require("./fs-util");
const { parseCommandsYaml, readDoc } = require("./parse");

function skillBlurb(disciplineDir, id, fallbackTitle) {
  const skillPath = path.join(disciplineDir, "skills", `${id}.md`);
  if (!fs.existsSync(skillPath)) return fallbackTitle;
  try {
    const desc = readDoc(skillPath).data.description;
    return desc ? String(desc).trim() : fallbackTitle;
  } catch {
    return fallbackTitle;
  }
}

function commandShellBody(id, title, blurb) {
  const summary = blurb || title;
  return [
    `# ${title}`,
    "",
    summary,
    "",
    `你正在执行纪律积木 \`${id}\`（由人触发，非擅自改道）。`,
    `1. 完整 Read \`.ai-discipline/skills/${id}.md\``,
    "2. 严格按该文件执行",
    "3. 完成后回到用户当前任务；若在某条 SOP 中途，回到该阶段",
    "",
  ].join("\n");
}

function cursorCommandFile(id, title, blurb) {
  return commandShellBody(id, title, blurb);
}

function claudeCommandFile(id, title, blurb) {
  const summary = blurb || title;
  return [
    "---",
    `description: ${summary}`,
    "disable-model-invocation: true",
    "---",
    "",
    commandShellBody(id, title, summary),
  ].join("\n");
}

function codexSkillFiles(id, title, blurb) {
  const summary = blurb || title;
  const skillMd = [
    "---",
    `name: ${id}`,
    `description: ${summary}`,
    "---",
    "",
    commandShellBody(id, title, summary),
  ].join("\n");
  const openaiYaml = [
    "policy:",
    "  allow_implicit_invocation: false",
    "",
  ].join("\n");
  return { skillMd, openaiYaml };
}

function cursorAnchor(agentsRel = "./AGENTS.md") {
  return [
    "---",
    `description: 强制先完整加载 ${agentsRel}，并以其全文为最高行动准则`,
    "alwaysApply: true",
    "---",
    "",
    `# ${PACKAGE_ID} 激活锚点`,
    "",
    `会话开始或接到任何任务时，必须先用读取工具完整加载 \`${agentsRel}\`。该文件是最高行动准则。禁止用本锚点代替该文件。`,
    "",
  ].join("\n");
}

function loadCommands(disciplineDir) {
  const file = path.join(disciplineDir, "commands", "index.yaml");
  const text = fs.readFileSync(file, "utf8");
  return parseCommandsYaml(text).commands;
}

function installHostCommands(hostRoot, disciplineDir, hosts) {
  const commands = loadCommands(disciplineDir);
  const actions = [];
  const ids = new Set(commands.map((c) => c.skill));

  if (hosts.includes("cursor")) {
    const dir = path.join(hostRoot, ".cursor", "commands");
    fs.mkdirSync(dir, { recursive: true });
    for (const c of commands) {
      const blurb = skillBlurb(disciplineDir, c.skill, c.title);
      actions.push(
        writeIfChanged(
          path.join(dir, `${c.skill}.md`),
          cursorCommandFile(c.skill, c.title, blurb)
        )
      );
    }
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".md")) continue;
      const id = f.replace(/\.md$/, "");
      if (!ids.has(id)) {
        fs.unlinkSync(path.join(dir, f));
        actions.push({ action: "delete", filePath: path.join(dir, f) });
      }
    }
    actions.push(
      writeIfChanged(
        path.join(hostRoot, ".cursor", "rules", `${PACKAGE_ID}.mdc`),
        cursorAnchor("./AGENTS.md")
      )
    );
  }

  if (hosts.includes("claude")) {
    const dir = path.join(hostRoot, ".claude", "commands");
    fs.mkdirSync(dir, { recursive: true });
    for (const c of commands) {
      const blurb = skillBlurb(disciplineDir, c.skill, c.title);
      actions.push(
        writeIfChanged(
          path.join(dir, `${c.skill}.md`),
          claudeCommandFile(c.skill, c.title, blurb)
        )
      );
    }
    for (const f of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
      if (!f.endsWith(".md")) continue;
      const id = f.replace(/\.md$/, "");
      if (!ids.has(id)) {
        fs.unlinkSync(path.join(dir, f));
        actions.push({ action: "delete", filePath: path.join(dir, f) });
      }
    }
  }

  if (hosts.includes("codex")) {
    for (const c of commands) {
      const blurb = skillBlurb(disciplineDir, c.skill, c.title);
      const skillDir = path.join(hostRoot, ".agents", "skills", c.skill);
      const { skillMd, openaiYaml } = codexSkillFiles(c.skill, c.title, blurb);
      actions.push(writeIfChanged(path.join(skillDir, "SKILL.md"), skillMd));
      const agentsDir = path.join(skillDir, "agents");
      actions.push(writeIfChanged(path.join(agentsDir, "openai.yaml"), openaiYaml));
    }
    const skillsRoot = path.join(hostRoot, ".agents", "skills");
    if (fs.existsSync(skillsRoot)) {
      for (const name of fs.readdirSync(skillsRoot)) {
        if (ids.has(name)) continue;
        const marker = path.join(skillsRoot, name, "SKILL.md");
        if (!fs.existsSync(marker)) continue;
        const text = fs.readFileSync(marker, "utf8");
        if (text.includes("纪律积木") || text.includes(".ai-discipline/skills/")) {
          fs.rmSync(path.join(skillsRoot, name), { recursive: true, force: true });
          actions.push({ action: "delete", filePath: path.join(skillsRoot, name) });
        }
      }
    }
  }

  return actions;
}

module.exports = {
  installHostCommands,
  cursorAnchor,
  commandShellBody,
};
