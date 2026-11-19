---
kind: sop
id: feature
name: 功能开发
description: 新功能/新模块的主路径
triggers: [新功能, 新模块, 需求落地, 实现功能, 模块编写]
priority: 90
steps:
  - use: skill:clarify-grill
  - use: rule:clarify-gate
  - use: skill:write-impl-plan
    optional: true
    when: 改动面大或存在多种实现路径
  - use: skill:tdd
    optional: true
  - use: skill:implement-change
  - use: skill:verify
inserts:
  - skill:clarify-grill
  - skill:verify
  - skill:code-review
  - skill:handoff
---

# 功能开发

任务类型须已明确是新增能力或新模块。严格按 `steps` 执行。

## 完成定义

- 影响行为的未决已关闭或已确认。
- 实现落在已确认范围（及计划，若有）内。
- 已做验证或写明无法验证项。
