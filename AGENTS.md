<!-- ai-discipline:start -->
# AI Discipline 行动准则

包标识：`ai-discipline`。真源目录：`.ai-discipline/`。
本文件**不含** SOP/rules/skills 索引大表。禁止仅凭本文件猜测做法。

## 总禁令

1. **澄清门**：未决仍影响行为或验收（含测试缝）时须先拷问澄清，不得写业务代码/测试或实现计划正文
2. **建议正确门**：给建议/方案时主推客观更正确的做法，不以更小、更局部、更好交差为默认；缩小/延后/局部化须显式写明牺牲且不得冒充正解；范围锁定后的实现只改所需、不无关扩 scope
3. **取证门**：无 red-capable 反馈环/复现/回传日志不得定因改缺陷代码；不足则加诊断日志并等人回传
4. **路由门**：无匹配 SOP 须走 skill:ask-route；禁止无路径直接改业务代码

## 强制加载

1. 完整 Read `.ai-discipline/workflows/index.md`，按 `triggers` 匹配；多命中先比 `priority`，并列则转步骤 3。
2. **命中**后完整 Read 该 SOP；再按 `steps` 数组顺序处理。每步：`use` 以外字段为**修饰链**，按固定算子顺序 `when`（若有）→ `confirm`（若有）→ 是否执行 `use`（与 YAML 键序无关）；链的最终结果决定是否 `use`；链未决不得写码。算子：`when` 只写入判断/推荐，**不因假而短路后续 confirm**；`confirm: true` 到站 HITL（选项+推荐，有 when 则推荐跟判断），人选为最终是否 `use`；仅 `when` 无 confirm 时判断结果直接硬闸 `use`；二者皆无则必须 `use`。`skill:`/`rule:` 按 `.ai-discipline/skills/{id}.md` 或 `rules/{id}.md` **直读**（禁止 Glob）；主路径不自行调用 skill command。
3. **零命中 / 多命中难决 / 混合意图**：完整 Read `.ai-discipline/skills/ask-route.md`，按其执行（选项+推荐，等人选定）；选定前不改业务代码。
4. **项目知识库（分层）**：分别处理——若存在 `.ai-discipline/docs/standards.md` 则完整 Read **该文件**；若存在 `.ai-discipline/docs/pitfalls.md` 则完整 Read **该文件**。缺哪个就跳过哪个，互不影响。入口内索引表「何时读」命中时，再完整 Read 对应专题/分册路径；未命中不读；点名路径不存在则跳过该路径。**禁止** Glob `.ai-discipline/docs/`。
5. skill command 默认由**人**触发；未经人要求不得自行调用 command 抢路径。
6. 长任务将中断时，可请人使用 `handoff`（默认写系统临时目录，对话只回路径）；本层无 SOP 步骤状态机。

## 索引入口（仅指针）

- SOP 路由索引：`.ai-discipline/workflows/index.md`
- 项目规范/坑入口（可选文件）：`.ai-discipline/docs/standards.md`、`.ai-discipline/docs/pitfalls.md`

## 诚实上限

本层**不提供硬拦**（不拦截工具/提交/CI）。以上为软约束；未走 SOP 的改码仍可能发生。人工审查兜底。
<!-- ai-discipline:end -->
