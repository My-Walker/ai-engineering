---
kind: skill
id: dispatch-run
name: 派发子代理
description: 执行 SOP 的 dispatch:<skillId>：串行 Task 子代理读 spec 跑目标 skill，主会话更新 runtime
---

# 派发子代理

当 SOP 步骤为 `use: dispatch:<skillId>` 且修饰链允许执行时，**完整 Read 本文件**并照此执行（同时目标 skill 由子代理按本文件加载）。  
主会话默认**不写业务实现代码**；脏活进子代理干净上下文。

## 进入条件

- 当前步骤 `use` 为 `dispatch:<skillId>`，且 `<skillId>` 对应 skill 文件存在。  
- 已存在可读 `.scratch/<feature>/spec.md`（见 `rule:spec-gate`）。  
- 本层为**软派发**：靠跟 SOP 调用宿主 Task/子代理；无 hook 硬拦。

## 核心规则

1. **先 Read** `.ai-discipline/skills/dispatch-run.md`（本文件）与目标 `.ai-discipline/skills/<skillId>.md` 要点（可摘要进 Task 提示，并要求子代理完整 Read 目标 skill）。  
2. **串行**：同一 feature 同时只跑一个未完成子任务；禁止并行 fan-out（本版本）。  
3. **上限**：同一 feature 累计派发（含重试）不超过 **5** 次；达上限须停并问人，禁止无界「再派一轮评审/再试」。  
4. **Spec 只读契约**：子代理必须 Read spec；不得扩大范围；新的行为未决 → 停回主会话澄清，不擅自定。  
5. **Runtime**：派发前/后更新 `.scratch/<feature>/runtime.md`（目标 skill、次数、状态、子结果摘要路径或要点）。  
6. **主会话**：派发期间不做业务实现；可做门禁判断与短进度汇报。

## 做法

1. 读 `spec.md` + `runtime.md`；确认未超派发上限。  
2. 将 `dispatch_count` +1 写入 runtime；状态 `dispatching:<skillId>`。  
3. 启动宿主 **Task 子代理**，提示词至少包含：  
   - 仓库根与 `.scratch/<feature>/spec.md` 路径  
   - 须完整 Read 的目标 skill 路径  
   - 若 runtime 含 TDD 约定，须先遵守  
   - 范围上限 = spec；禁止改 `.ai-discipline` 真源（除非任务本身是纪律作者）  
   - 返回结构：做了什么、改了哪些路径、验证了什么、未决/风险  
4. 等待子代理结束；把结果摘要写入 runtime（`last_dispatch_result`）。  
5. 交回 SOP，通常下一步为 `skill:join-dispatch`。

## 完成标准

- 已发起并收回一次子代理结果（或明确失败原因写入 runtime）。  
- runtime 已更新；未超过次数上限却静默放弃。

## 禁止

- 跳过 spec 直接派发。  
- 主会话一边派发一边大批量改业务代码。  
- 无完成定义地循环加派子代理。  
- 把「自动 New Chat」当成必须机制（本层用 Task 子代理隔离上下文）。
