---
kind: skill
id: discipline-author
name: 纪律资产作者
description: 作者态增删改 rule/skill/sop/command；确认后写真源；validate 失败则不装
---

# 纪律资产作者

作者态 / 维护态。禁止在业务 SOP 执行中顺手改纪律真源。

## 进入条件

- 用户显式触发本 command / 明确要求改 `.ai-discipline` 资产；或维护纪律包本身。
- 当前不是「正在修业务 bug/做功能」却夹带改门禁。

## 核心规则

1. **作者态与业务态分离**：业务任务中途发现纪律不足 → 先记下来，另开作者态或等人确认后再改。
2. **先摘要后写盘**：变更摘要（路径、要点、受影响 steps/inserts/command 数）→ **人明确确认** → 再写。
3. **只写真源**：`.ai-discipline/{rules|skills|workflows}/{id}.md` 或 `commands/index.yaml`；遵守 schema（`kind`/`id`/文件名一致等）。
4. **写 rule 须选型**：`role: gate` = 否决型（未满足不得往下/不算完成）；`role: convention` = 合规提醒型短约束（可挂 steps，默认 `always: false`，always 极少）。差别是语义角色，不是强制力。长规范/坑 → docs 知识库，不要硬拆成大量 rule。
5. **SOP 只引用**：步骤只 `skill:`/`rule:`，不把大段做法塞进 SOP。
6. **生成物归 CLI**：不得手改 `workflows/index.md` 或 AGENTS/`CLAUDE` 标记块冒充 sync；**勿**把 role 分类教程写进 AGENTS。
7. **校验失败停装**：`validate` 失败则修复真源前不要 `install` 刷新薄壳。

## 做法

1. 明确对象：`rule` | `skill` | `sop` | `command` 声明；操作：增 | 删 | 改（含 rename）。若是 rule：摘要里写明拟用 `gate` 还是 `convention` 及 always 与否。
2. 输出变更摘要与风险（引用断裂、command 超员、always 膨胀等）；等人确认。
3. 确认后写盘；保持「一 id 一文件」。
4. 执行或请人执行：
   - `node …/discipline.js validate [--root …]`
   - `… sync`
   - 若改了 `commands/index.yaml`：`… install --hosts <已选>`
5. 若 validate 失败：根据错误修真源，重跑；**不要**强行 install。

## 完成标准

- 人已确认；真源已写；validate（及需要的 sync/install）已成功或已报告失败原因与下一步。
- 未改 sync 生成区冒充成功。

## 禁止

- 把宿主 skills 发现目录当纪律真源。
- 未确认写盘；业务 SOP 中途偷改门禁放行。
