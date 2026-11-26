---
kind: skill
id: join-dispatch
name: 回收派发结果
description: 在走过 dispatch 后核对子代理结果与 spec/runtime；未达标不得宣称完成
---

# 回收派发结果

`dispatch` 之后把子上下文结果收束回主路径，对照 spec 验收，再交给 `verify` 等后续步。

## 进入条件

- 本 SOP 已执行过至少一次 `dispatch:*`（见 runtime）。  
- 存在 `.scratch/<feature>/spec.md` 与 `runtime.md`。

## 核心规则

1. **对照 spec 验收节**：子结果是否覆盖本切片验收；缺口须明示。  
2. **范围**：若子代理越权改动，标为缺陷：回滚建议或新开澄清，不得当成功 join。  
3. **未决**：子代理带回的行为未决 → 澄清重新未结束，不得进入「已完成实现」。  
4. **更新 runtime**：状态 `joined` 或 `join_failed` + 原因。  
5. **不替代 verify**：本 skill 做回收与门闩式核对；测试/命令级验证仍交 `skill:verify`。

## 做法

1. Read spec + runtime（含 `last_dispatch_result`）。  
2. 列出：已完成项 / 缺口 / 越权 / 未决。  
3. 通过：短回显，runtime → `joined`，交回 SOP。  
4. 不通过：说明原因与选项（补派 ≤ 上限、回澄清、缩范围）；**不得宣称本切片实现完成**。

## 完成标准

- 已给出通过/不通过结论与依据。  
- runtime 已更新。  
- 不通过时未把任务标成完成。

## 禁止

- 无读 runtime/spec 就口头「子代理做完了」。  
- 用再次无界派发代替对缺口的澄清。
