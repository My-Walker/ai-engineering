---
kind: sop
id: bugfix
name: 缺陷修复
description: 缺陷/报错的主路径
triggers: [缺陷, bug, 报错, 故障, 修复bug, 崩溃]
priority: 100
steps:
  - use: skill:clarify-grill
    confirm: true
  - use: skill:diagnose-bug
  - use: rule:evidence-gate
  - use: skill:add-logs
    when: 证据不足需人工取证
  - use: skill:choose-fix-scope
  - use: skill:publish-spec
    when: 已开闸或非琐碎（终稿对齐）；琐碎且用户选择不写则跳过
  - use: rule:spec-gate
    when: 非琐碎或已存在 spec
  - use: skill:write-impl-plan
    when: 长期维护或改动面大
    confirm: true
  - use: skill:tdd
    confirm: true
  - use: skill:apply-fix
    when: 琐碎（路径唯一、触及面小、上下文仍干净）
  - use: dispatch:apply-fix
    when: 非琐碎（默认；与上条互斥）
  - use: skill:join-dispatch
    when: 本切片走过 dispatch:apply-fix
  - use: skill:verify
  - use: rule:bugfix-complete
inserts:
  - skill:add-logs
  - skill:clarify-grill
  - skill:publish-spec
  - skill:verify
  - skill:code-review
  - skill:handoff
---

# 缺陷修复

目标是纠正已有行为，不是新增能力。严格按 frontmatter `steps` 执行；遵守 step 修饰链语义（见 AGENTS）。

诊断 / 取证 / 选范围留在主会话。澄清同样：**未开闸不写；开闸后有新确认自动增量**。  
非琐碎：`publish-spec` 终稿对齐 → `dispatch:apply-fix` → `join-dispatch`。琐碎可同窗 `apply-fix` 并跳过 spec。

## 完成定义

- 原因已写明，并对应复现结果或人工回传日志。
- 修复范围来自用户选择；已落入 spec（琐碎且选择不写、跳过规格门除外）。
- 若走过实现计划：计划内容已确认，或用户在 confirm 中选择跳过并已注明。
- 若走过 dispatch：已 join 通过。
- 原问题路径已再验证，或写明无法执行的验证项。
