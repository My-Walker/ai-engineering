# AI Discipline 行动准则

包标识：`ai-discipline`。真源目录：`.ai-discipline/`。
本文件**不含** SOP/rules/skills 索引大表。禁止仅凭本文件猜测做法。

## 总禁令

{{SUMMARIES}}

## 强制加载

1. 完整 Read `.ai-discipline/workflows/index.md`，按 `triggers` 匹配；多命中先比 `priority`，并列则转步骤 3。
2. **命中**后完整 Read 该 SOP；再按 `steps` 顺序处理：遵守 `optional`/`when` 语义；`skill:`/`rule:` 按 `.ai-discipline/skills/{id}.md` 或 `rules/{id}.md` **直读**（禁止 Glob）；主路径不自行调用 skill command。
3. **零命中 / 多命中难决 / 混合意图**：完整 Read `.ai-discipline/skills/ask-route.md`，按其执行（选项+推荐，等人选定）；选定前不改业务代码。
4. skill command 默认由**人**触发；未经人要求不得自行调用 command 抢路径。
5. 长任务将中断时，可请人使用 `handoff`（默认写系统临时目录，对话只回路径）；本层无 SOP 步骤状态机。

## 索引入口（仅指针）

- SOP 路由索引：`.ai-discipline/workflows/index.md`

## 诚实上限

本层**不提供硬拦**（不拦截工具/提交/CI）。以上为软约束；未走 SOP 的改码仍可能发生。人工审查兜底。
