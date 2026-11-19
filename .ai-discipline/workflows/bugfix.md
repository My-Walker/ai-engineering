---
kind: sop
id: bugfix
name: 缺陷修复
description: 缺陷/报错的主路径
triggers: [缺陷, bug, 报错, 故障, 异常排查, 修复bug]
priority: 100
steps:
  - use: skill:clarify-grill
    optional: true
  - use: skill:diagnose-bug
  - use: rule:evidence-gate
  - use: skill:add-logs
    when: 证据不足需人工取证
  - use: skill:choose-fix-scope
  - use: skill:write-impl-plan
    optional: true
    when: 长期维护或改动面大
  - use: skill:tdd
    optional: true
  - use: skill:apply-fix
  - use: skill:verify
  - use: rule:bugfix-complete
inserts:
  - skill:add-logs
  - skill:clarify-grill
  - skill:verify
  - skill:code-review
  - skill:handoff
---

# 缺陷修复

目标是纠正已有行为，不是新增能力。严格按 frontmatter `steps` 执行；遵守 `optional`/`when` 语义。

## 完成定义

- 原因已写明，并对应复现结果或人工回传日志。
- 修复范围来自用户选择。
- 若走过实现计划：已确认或已注明合法跳过。
- 原问题路径已再验证，或写明无法执行的验证项。
