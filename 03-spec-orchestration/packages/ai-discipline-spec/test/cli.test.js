"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const assert = require("assert");
const { installDiscipline } = require("../scripts/install");
const { validateDiscipline } = require("../scripts/validate");
const { syncDiscipline } = require("../scripts/sync");

function mktemp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ai-discipline-"));
}

async function testInstallAndValidate() {
  const root = mktemp();
  await installDiscipline(root, ["cursor"]);
  const v = validateDiscipline(root);
  assert.ok(v.ok, v.errors.join("\n"));
  assert.ok(fs.existsSync(path.join(root, ".ai-discipline", "skills", "ask-route.md")));
  assert.ok(fs.existsSync(path.join(root, ".ai-discipline", "workflows", "index.md")));
  assert.ok(fs.existsSync(path.join(root, "AGENTS.md")));
  assert.ok(fs.existsSync(path.join(root, ".cursor", "rules", "ai-discipline.mdc")));
  assert.ok(fs.existsSync(path.join(root, ".cursor", "commands", "add-logs.md")));
  assert.ok(fs.existsSync(path.join(root, ".ai-discipline", "docs", "standards.md")));
  assert.ok(fs.existsSync(path.join(root, ".ai-discipline", "docs", "pitfalls.md")));
  assert.ok(
    fs.existsSync(path.join(root, ".ai-discipline", "docs", "standards", "_template.md"))
  );
  const agents = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
  assert.ok(agents.includes("ai-discipline:start"));
  assert.ok(agents.includes("ask-route.md"));
  assert.ok(agents.includes("docs/standards.md"));
  assert.ok(agents.includes("缺哪个就跳过哪个"));
  assert.ok(agents.includes("禁止") && agents.includes("docs/"));
  assert.ok(agents.includes("建议正确门") || agents.includes("客观更正确"));
  assert.ok(agents.includes("澄清结束") || agents.includes("不得执行"));
  assert.ok(agents.includes("实现上限门") || agents.includes("已确认范围是上限"));
  assert.ok(
    fs.existsSync(path.join(root, ".ai-discipline", "rules", "design-depth-gate.md"))
  );
  assert.ok(
    fs.existsSync(path.join(root, ".ai-discipline", "rules", "scope-ceiling-gate.md"))
  );
  console.log("ok install+validate");
}

async function testNoOverwriteSkill() {
  const root = mktemp();
  await installDiscipline(root, ["cursor"]);
  const skill = path.join(root, ".ai-discipline", "skills", "verify.md");
  fs.writeFileSync(skill, "USER_EDIT\n", "utf8");
  const second = await installDiscipline(root, ["cursor"]);
  assert.strictEqual(fs.readFileSync(skill, "utf8"), "USER_EDIT\n");
  // 用户改坏 skill 后 sync 应失败，但不覆盖用户文件
  assert.ok(second.syncResult && second.syncResult.ok === false);
  console.log("ok no-overwrite skill");
}

async function testBrokenRefFails() {
  const root = mktemp();
  await installDiscipline(root, ["cursor"]);
  const sop = path.join(root, ".ai-discipline", "workflows", "bugfix.md");
  let text = fs.readFileSync(sop, "utf8");
  text = text.replace("skill:diagnose-bug", "skill:not-exist");
  fs.writeFileSync(sop, text, "utf8");
  const v = validateDiscipline(root);
  assert.ok(!v.ok);
  assert.ok(v.errors.some((e) => e.includes("not-exist")));
  console.log("ok broken-ref");
}

async function testWhenConfirmAllowed() {
  const root = mktemp();
  await installDiscipline(root, ["cursor"]);
  const sop = path.join(root, ".ai-discipline", "workflows", "feature.md");
  const doc = require("../scripts/lib/parse").readDoc(sop);
  const plan = (doc.data.steps || []).find((s) => s.use === "skill:write-impl-plan");
  assert.ok(plan && plan.when && plan.confirm === true);
  const v = validateDiscipline(root);
  assert.ok(v.ok, v.errors.join("\n"));
  console.log("ok when+confirm allowed");
}

async function testSyncRewritesIndex() {
  const root = mktemp();
  await installDiscipline(root, ["cursor"]);
  const index = path.join(root, ".ai-discipline", "workflows", "index.md");
  fs.writeFileSync(index, "broken\n", "utf8");
  const r = syncDiscipline(root);
  assert.ok(r.ok);
  const body = fs.readFileSync(index, "utf8");
  assert.ok(body.includes("id: bugfix"));
  assert.ok(body.includes("priority: 100"));
  const agents = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
  assert.ok(agents.includes("澄清门") || agents.includes("取证"));
  assert.ok(agents.includes("总禁令"));
  console.log("ok sync index");
}

async function testCommandShellOverwrite() {
  const root = mktemp();
  await installDiscipline(root, ["cursor"]);
  const cmd = path.join(root, ".cursor", "commands", "add-logs.md");
  fs.writeFileSync(cmd, "USER_SHELL\n", "utf8");
  await installDiscipline(root, ["cursor"]);
  const body = fs.readFileSync(cmd, "utf8");
  assert.ok(!body.includes("USER_SHELL"));
  assert.ok(body.includes(".ai-discipline/skills/add-logs.md"));
  assert.ok(body.includes("诊断日志"));
  // Cursor / 菜单预览：用途说明须出现在执行套话之前
  const blurbAt = body.indexOf("诊断日志");
  const boilerplateAt = body.indexOf("你正在执行纪律积木");
  assert.ok(blurbAt !== -1 && boilerplateAt !== -1 && blurbAt < boilerplateAt);
  console.log("ok command-shell overwrite");
}

async function testForceOverwriteKeepsExtras() {
  const root = mktemp();
  await installDiscipline(root, ["cursor"]);
  const skill = path.join(root, ".ai-discipline", "skills", "verify.md");
  const cmdYaml = path.join(root, ".ai-discipline", "commands", "index.yaml");
  const extraSkill = path.join(root, ".ai-discipline", "skills", "local-only.md");
  const extraRule = path.join(
    root,
    ".ai-discipline",
    "rules",
    "local-always.md"
  );
  fs.writeFileSync(skill, "USER_EDIT\n", "utf8");
  fs.writeFileSync(cmdYaml, "commands: []\n", "utf8");
  fs.writeFileSync(
    extraSkill,
    "---\nkind: skill\nid: local-only\nname: 本地\ndescription: 仅本地\n---\n\n# 本地\n",
    "utf8"
  );
  fs.writeFileSync(
    extraRule,
    [
      "---",
      "kind: rule",
      "id: local-always",
      "name: 本地常驻",
      "description: 本地多出来的 always",
      "role: gate",
      "always: true",
      "summary: 本地多出来的门禁摘要",
      "---",
      "",
      "# 本地常驻",
      "",
    ].join("\n"),
    "utf8"
  );

  const forced = await installDiscipline(root, ["cursor"], { force: true });
  assert.ok(forced.syncResult && forced.syncResult.ok, "force 后 sync 应成功");
  const restored = fs.readFileSync(skill, "utf8");
  assert.ok(!restored.includes("USER_EDIT"));
  assert.ok(restored.includes("kind: skill"));
  assert.ok(fs.readFileSync(cmdYaml, "utf8").includes("discipline-author"));
  assert.ok(fs.existsSync(extraSkill), "本地多出来的 skill 不应被删");
  assert.ok(fs.existsSync(extraRule), "本地多出来的 rule 不应被删");
  const agents = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
  assert.ok(agents.includes("本地多出来的门禁摘要"), "多余 always 仍应进入 AGENTS");
  console.log("ok force overwrite keeps extras");
}

async function main() {
  await testInstallAndValidate();
  await testNoOverwriteSkill();
  await testBrokenRefFails();
  await testWhenConfirmAllowed();
  await testSyncRewritesIndex();
  await testCommandShellOverwrite();
  await testForceOverwriteKeepsExtras();
  console.log("all tests passed");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
