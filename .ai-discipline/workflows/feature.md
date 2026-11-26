---
kind: sop
id: feature
name: 功能开发
description: 新功能/新模块的主路径
triggers: [新功能, 新模块, 需求落地, 实现功能, 模块编写, 新增, 需求调整]
priority: 90
steps:
  - use: skill:clarify-grill
  - use: rule:clarify-gate
  - use: skill:publish-spec
    when: 已开闸或非琐碎（终稿对齐）；琐碎且用户选择不写则跳过
  - use: rule:spec-gate
    when: 非琐碎或已存在 spec
  - use: skill:write-impl-plan
    when: 改动面大或存在多种实现路径
    confirm: true
  - use: skill:tdd
    confirm: true
  - use: skill:implement-change
    when: 琐碎（路径唯一、触及面小、上下文仍干净）
  - use: dispatch:implement-change
    when: 非琐碎（默认；与上条互斥）
  - use: skill:join-dispatch
    when: 本切片走过 dispatch:implement-change
  - use: skill:verify
inserts:
  - skill:clarify-grill
  - skill:publish-spec
  - skill:verify
  - skill:code-review
  - skill:handoff
---

# 功能开发

任务类型须已明确是新增能力或新模块。严格按 `steps` 执行；遵守 step 修饰链语义（见 AGENTS）。

澄清中：未开闸不写 spec；条件到了提醒开闸；**开闸后有新确认则自动增量**（见 `clarify-grill`）。  
澄清后 `publish-spec` 步做**终稿对齐**（有则 upsert，无且非琐碎则创建）。  
非琐碎默认：`dispatch:implement-change` → `join-dispatch` → `verify`。琐碎：同窗实现，可跳过 spec/dispatch。

大改面计划可落 `.scratch/<feature>/implementation-notes.md`，仍服从 spec。

## 完成定义

- 影响行为的未决已关闭或已确认。
- 已存在可读 spec（琐碎且选择不写、跳过规格门的除外），实现落在 spec（及计划，若有）内。
- 若走过 dispatch：已 join 通过。
- 已做验证或写明无法验证项。
