---
kind: rule
id: spec-gate
name: 规格门
description: 非琐碎实现或 dispatch 前必须存在可读 spec 且无阻塞性未决
role: gate
always: false
---

# 规格门

## 何时适用

SOP 在 `publish-spec` 之后、进入同窗实现或 `dispatch:*` 之前；或步骤显式 `use: rule:spec-gate`。

## 放行条件

1. 存在可读的 `.scratch/<feature>/spec.md`（路径以 runtime 指针为准）。  
2. Spec 含目标、约束、非目标、验收。  
3. **无阻塞性未决**（未决为空，或仅含已标「范围外且不影响本切片验收」的项）。

## 否决

- 无 spec、spec 不可读、或仍有阻塞未决 → **不得**进入实现代码或 `dispatch`。  
- 应回到 `skill:publish-spec` / `skill:clarify-grill`，不得把聊天摘要冒充 spec。

## 琐碎例外

若本切片经 `when` 判定为琐碎且 SOP 规定同窗短路径、**显式跳过**本门，则不适用。默认非琐碎必须过门。
