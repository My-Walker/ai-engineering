---
kind: skill
id: discipline-author
name: 纪律资产作者
description: 作者态增删改 rule/skill/sop/command 声明，确认后写真源并跑 CLI
---

# 纪律资产作者

## 定位

作者态 / 维护态。禁止在业务 SOP 执行中顺手改纪律。

## 做法

1. 明确对象：`rule` | `skill` | `sop` | `command` 声明；操作：增 | 删 | 改（含 rename）。
2. 输出**变更摘要**（路径、要点、受影响的 steps/inserts/command 数）；**等人明确确认**前不写盘。
3. 确认后只写真源：`.ai-discipline/{rules|skills|workflows}/{id}.md` 或 `commands/index.yaml`；遵守 schema 与「SOP 只引用 skill/rule」。
4. 然后执行（或请人执行）：
   - `npx discipline validate` 或 `node …/discipline.js validate`
   - `… sync`
   - 若改了 commands：`… install --hosts <已选>`
5. 不得手改 `workflows/index.md` 或 AGENTS 标记块冒充 sync。
