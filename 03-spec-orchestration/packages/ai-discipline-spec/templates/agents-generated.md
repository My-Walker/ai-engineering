# AI Discipline 行动准则

包标识：`ai-discipline`。真源目录：`.ai-discipline/`。
本文件**不含** SOP/rules/skills 索引大表。禁止仅凭本文件猜测做法。

## 总禁令

{{SUMMARIES}}

## 强制加载

1. 完整 Read `.ai-discipline/workflows/index.md`，按 `triggers` 匹配；多命中先比 `priority`，并列则转步骤 3。匹配时须同时判断是否**混合意图 / 意图不清**：任务**类型信号**（如新功能、需求落地、实现功能、新增、需求调整、缺陷、bug、报错）与**方式信号**（如分析、评审、review、只读）并存，或整体说不清该进哪条 SOP → 转步骤 3，**不得因单侧命中直接进入**（尤其不得仅因「分析/评审」锁死 `sop:explore-review`）。
2. **命中**后完整 Read 该 SOP；再按 `steps` 数组顺序处理。每步：`use` 以外字段为**修饰链**，按固定算子顺序 `when`（若有）→ `confirm`（若有）→ 是否执行 `use`（与 YAML 键序无关）；链的最终结果决定是否 `use`；链未决不得写码。算子：`when` 只写入判断/推荐，**不因假而短路后续 confirm**；`confirm: true` 到站 HITL（选项+推荐，有 when 则推荐跟判断），人选为最终是否 `use`；仅 `when` 无 confirm 时判断结果直接硬闸 `use`；二者皆无则必须 `use`。`skill:`/`rule:` 按 `.ai-discipline/skills/{id}.md` 或 `rules/{id}.md` **直读**（禁止 Glob）。`dispatch:<skillId>`：完整 Read `skill:dispatch-run` 并按其派 **Task 子代理**执行目标 skill（子代理须读 `.scratch/<feature>/spec.md`，主会话写/更新 runtime）；**join 完成前不得宣称实现完成**；琐碎任务可用 `when` 跳过 dispatch、同窗执行对应 `skill:`。主路径不自行调用 skill command。
3. **零命中 / 多命中难决 / 混合意图 / 意图不清**：完整 Read `.ai-discipline/skills/ask-route.md`，按其执行（选项+推荐，等人选定）；选定前不改业务代码。
4. **项目知识库（分层）**：分别处理——若存在 `.ai-discipline/docs/standards.md` 则完整 Read **该文件**；若存在 `.ai-discipline/docs/pitfalls.md` 则完整 Read **该文件**。缺哪个就跳过哪个，互不影响。入口内索引表「何时读」命中时，再完整 Read 对应专题/分册路径；未命中不读；点名路径不存在则跳过该路径。**禁止** Glob `.ai-discipline/docs/`。
5. skill command 默认由**人**触发；未经人要求不得自行调用 command 抢路径。
6. 跨切片状态写在 `.scratch/<feature>/`（`spec.md` / `runtime.md`）；长任务中断可另用 `handoff`（须链到 spec；默认临时目录，对话只回路径）。禁止无界加派子任务；串行 dispatch，单 feature 未完成子任务上限见 `dispatch-run`。

## 索引入口（仅指针）

- SOP 路由索引：`.ai-discipline/workflows/index.md`
- 项目规范/坑入口（可选文件）：`.ai-discipline/docs/standards.md`、`.ai-discipline/docs/pitfalls.md`

## 诚实上限

本层**不提供硬拦**（不拦截工具/提交/CI）。以上为软约束；未走 SOP 的改码仍可能发生。人工审查兜底。
