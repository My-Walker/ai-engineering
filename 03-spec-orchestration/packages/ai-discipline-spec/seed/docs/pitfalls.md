# 项目坑册（入口）

给 Agent 的**薄入口**：全局高频坑 +（可选）分册索引。  
条目宜具体：症状 → 错误做法 → 正确做法 → 相关路径。  
反复踩且能收成一句硬禁令的 → 晋升为 `role: gate`（必要时 always），本处可留链接。

## 全局坑

### 建议默认偏小，而非偏对

- **症状**：一给建议就偏最小改动、只保主路径、好交差；追问后才补到更正确的一档。
- **错误做法**：以「小」为美德，把缩小、延后、局部化当成默认答案；默裁已提约束。
- **正确做法**：主推客观更正确的做法并写明理由；缩小仅作显式取舍，并等用户确认。推荐不使澄清结束。服从 `rule:design-depth-gate`。
- **相关路径**：`.ai-discipline/rules/design-depth-gate.md`

### 用「更正确」把未确认行为写成已定

- **症状**：用户没说的分支、校验、配套逻辑被直接写进产物或执行。
- **错误做法**：把「不要做小」当成追加需求的理由；推荐完即视为澄清结束。
- **正确做法**：未结束只可继续澄清。结束后不得越过已确认范围；新的行为未决使澄清重新未结束。服从 `rule:clarify-gate` 与 `rule:scope-ceiling-gate`。
- **相关路径**：`.ai-discipline/rules/clarify-gate.md`、`.ai-discipline/rules/scope-ceiling-gate.md`

### 描述需求后再说「分析」却锁进只读 SOP

- **症状**：用户先讲需求/要落地，再跟「分析/评审」；Agent 只看见方式词，直接进 `sop:explore-review`。
- **错误做法**：单侧 trigger 命中就开跑；或为迁就口语把过漂的词塞进 feature/bugfix 词表。
- **正确做法**：类型信号与方式信号并存、或意图不清 → `skill:ask-route`；trigger 只收语义贴合的词。服从 `rule:route-gate`。
- **相关路径**：`.ai-discipline/rules/route-gate.md`、`.ai-discipline/skills/ask-route.md`

（业务仓可在下方继续追加本项目坑。案例多了拆到 `pitfalls/`。）

## 分册索引（可选）

案例多了再拆文件。Agent **仅在「何时读」命中时**再完整 Read「路径」；缺文件则跳过该路径。禁止 Glob `docs/`。

| 分册 id | 路径 | 何时读 | 一句话 |
| :--- | :--- | :--- | :--- |
| | | | |

新建分册：复制 `pitfalls/_template.md` → `pitfalls/{id}.md`，并在本表登记一行。
