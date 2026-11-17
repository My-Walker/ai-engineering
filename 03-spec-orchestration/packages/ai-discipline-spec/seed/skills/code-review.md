---
kind: skill
id: code-review
name: 双轴代码评审
description: 按标准轴与规格轴评审当前改动
---

# 双轴代码评审

## 做法

1. 固定评审基点（如相对 main 的 diff 或用户指定范围）。
2. **标准轴**：是否符合仓内约定与明显坏味道（复杂度、命名、重复、错误处理等）。
3. **规格轴**：是否忠实实现既定需求/SOP/计划；有无漏验收点。
4. 按 Must fix / Should fix / Nice to have 输出；引用文件位置。无问题则明确说无。
