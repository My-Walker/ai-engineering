---
kind: skill
id: ask-route
name: 任务分诊
description: 无 SOP 命中/多命中难决/混合意图时列选项+推荐并等人选定；选定前不改码
---

# 任务分诊

路由基础设施，**不是**任务主 SOP。服从 `rule:route-gate` 与 AGENTS 强制加载协议。

## 进入条件

以下任一（通常由 AGENTS 协议要求 Read 本文件）：

- `workflows/index.md` **零命中**
- 多个入口 SOP **priority 并列**且难决
- **混合意图**（如同时要新功能+修缺陷）不能塞进单一 SOP

## 核心规则

1. **只推荐不执行**：本 skill 不开始实现、不改业务代码、不出实现类 Plan 正文。
2. **先理解再选项**：用一句话复述意图；理解不清先短澄清，再分诊。
3. **选项来自真源**：至少覆盖 index 中可入口 SOP；每项一行适用说明 + **推荐项**（无法判断时推荐 `explore-review`）。
4. **等人选定**：未明确选定前停住。
5. **选定后直读**：完整 Read `.ai-discipline/workflows/{id}.md`，再按其 `steps`；禁止 Glob 扫库猜流程。

## 做法

1. 确认已读 `.ai-discipline/workflows/index.md`（若尚未读，先读）。
2. 复述意图；说明为何落入分诊（零命中 / 并列 / 混合）。
3. 列选项表（SOP id、适用、推荐标记）。
4. 混合意图：拆成有序子任务，给推荐执行顺序，选定前不合并硬干。
5. 用户选定后：Read 对应 SOP → 进入该 SOP。

## 完成标准

- 用户已选定 SOP（或子任务顺序）；或用户改述意图后已能直接命中并进入 SOP。
- 选定前无业务写码、无实现类 Plan。

## 禁止

- 把本 skill 当「万能主流程」一直聊下去却不进 SOP。
- 引入会话 clear/compact/prototype 等外链主线作为分诊必经步骤。
- 调用宿主 Skill tool 代替 Read SOP。
