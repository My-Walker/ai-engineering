---
kind: skill
id: discipline-author
name: 纪律资产作者
description: 作者态增删改 rule/skill/sop/command；确认后写真源；validate 失败则不装
---

# 纪律资产作者

作者态 / 维护态。禁止在业务 SOP 执行中顺手改纪律真源。

## 进入条件

- 用户显式触发本 command / 明确要求改 `.ai-discipline` 资产；或维护纪律包本身。
- 当前不是「正在修业务 bug/做功能」却夹带改门禁。

## 核心规则

1. **作者态与业务态分离**：业务任务中途发现纪律不足 → 先记下来，另开作者态或等人确认后再改。
2. **先摘要后写盘**：变更摘要（路径、要点、受影响 steps/inserts/command 数）→ **人明确确认** → 再写。
3. **只写真源**：`.ai-discipline/{rules|skills|workflows}/{id}.md`、`commands/index.yaml`，或 `.ai-discipline/docs/**`（项目知识库）；rule/skill/sop 遵守 schema（`kind`/`id`/文件名一致等）。目录名与引用前缀不改；对人说明用：skills=做法积木、rules=约束资产、docs=项目知识库（勿当成宿主「通用 rules/skills 百科」）。
4. **先走「放哪」再写盘**：
   - 一步怎么做、可复用 → **skill**（做法积木）
   - 未满足不得往下 / 不得宣称完成 → **rule + `role: gate`**（必要时 `always` + `summary`）
   - 短、非否决、但要挂 `steps` 或被点名 `rule:id` → **rule + `role: convention`**（默认 `always: false`；少用，种子可空，空 ≠ 并进 docs）
   - 长文/案例/勤增删规范与坑、不进 SOP steps → **docs**：入口 `standards.md`/`pitfalls.md`，专题进 `standards/` 或 `pitfalls/` 并登记「何时读」；硬条再晋升 gate/convention；docs 可链 `rule:id`。不要硬拆成大量 rule，勿把专题全文堆进入口。
5. **SOP 只引用**：步骤只 `skill:`/`rule:`，不把大段做法塞进 SOP；**禁止**把 docs 路径写成 `use: rule:…`。
6. **生成物归 CLI**：不得手改 `workflows/index.md` 或 AGENTS/`CLAUDE` 标记块冒充 sync；**勿**把 role 分类教程写进 AGENTS。
7. **校验失败停装**：`validate` 失败则修复真源前不要 `install` 刷新薄壳。

## 做法

1. 明确对象：`rule` | `skill` | `sop` | `command` 声明 | `docs` 知识库；操作：增 | 删 | 改（含 rename）。若是 rule：摘要里写明拟用 `gate` 还是 `convention` 及 always 与否，并对照上方「放哪」。若是长规范却想建 rule：先改判为 docs，除非确需否决或 `rule:id`。
2. 输出变更摘要与风险（引用断裂、command 超员、always 膨胀、误把知识库塞进 rules 等）；等人确认。
3. 确认后写盘；保持「一 id 一文件」（docs 专题无 `kind`/`id`，靠入口索引登记）。
4. 执行或请人执行：
   - `node …/discipline.js validate [--root …]`
   - `… sync`
   - 若改了 `commands/index.yaml`：`… install --hosts <已选>`
5. 若 validate 失败：根据错误修真源，重跑；**不要**强行 install。

## 完成标准

- 人已确认；真源已写；validate（及需要的 sync/install）已成功或已报告失败原因与下一步。
- 未改 sync 生成区冒充成功。

## 禁止

- 把宿主 skills 发现目录当纪律真源。
- 未确认写盘；业务 SOP 中途偷改门禁放行。
