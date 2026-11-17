---
kind: skill
id: ask-route
name: 任务分诊
description: 无 SOP 命中或多命中难决时列出选项并等人选定
---

# 任务分诊

## 何时用

由 AGENTS 强制加载协议触发：零命中、priority 并列难决、或混合意图。不要当作任务主 SOP。

## 做法

1. 用一句话复述你对用户意图的理解。
2. 列出可选项（至少含 index 中的 SOP），每项给一行适用说明，并标明**推荐项**（无法判断时推荐 `explore-review`）。
3. 混合意图时：拆成有序子任务选项，标明推荐执行顺序。
4. **等待用户明确选定**；选定前不得改业务代码、不得开始实现类 Plan。
5. 选定后：完整 Read 对应 `.ai-discipline/workflows/{id}.md`，再按该 SOP 的 `steps` 继续。
