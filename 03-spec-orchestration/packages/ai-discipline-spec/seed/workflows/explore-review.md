---
kind: sop
id: explore-review
name: 只读分析
description: 只读分析/评审/答疑；默认不改业务代码
triggers: [分析, 评审, 答疑, review, 只读分析, 设计评审, 代码评审]
priority: 70
steps:
  - use: skill:explore-scope
  - use: rule:explore-readonly
  - use: skill:explore-gather
  - use: skill:explore-report
inserts:
  - skill:code-review
  - skill:handoff
  - skill:clarify-grill
---

# 只读分析

默认不修改业务代码。严格按 `steps` 执行；遵守 step 修饰链语义（见 AGENTS）。用户要求落地实现时结束本 SOP，重路由 `sop:feature` / `sop:bugfix`（必要时先 `skill:ask-route`）。

## 完成定义

- 范围与输出形态已确认（或用户确认跳过追问）。
- 结论区分已证实与推断。
- 未在本 SOP 内擅自改业务代码。
