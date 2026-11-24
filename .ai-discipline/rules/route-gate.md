---
kind: rule
id: route-gate
name: 路由门
description: 无匹配 SOP 或混合意图须走 skill:ask-route；禁止无路径乱改业务代码
role: gate
always: true
summary: 无匹配 SOP 或混合/不清意图须走 skill:ask-route；禁止无路径直接改业务代码
---

# 路由门

1. 必须先 Read `.ai-discipline/workflows/index.md` 匹配主 SOP。
2. 零命中、多命中 priority 并列难决、或**混合意图 / 意图不清**：完整 Read `.ai-discipline/skills/ask-route.md`，按其执行；选定前不得改业务代码。
3. **混合意图（须 ask-route，不得因单侧 trigger 命中直接进入）**包括但不限于：
   - 同时要新功能与修缺陷等，不能塞进单一 SOP；
   - **任务类型信号**与**方式信号**并存：类型如新功能 / 需求落地 / 实现功能 / 新增 / 需求调整 / 缺陷 / bug / 报错 等；方式如分析 / 评审 / review / 只读 等（例：先描述需求再「分析」；「报错但先别改只分析」）；
   - 整体说不清该进哪条入口 SOP。
4. trigger 词须**语义贴合**对应 SOP 任务类型；不得为迁就个人口头禅把过漂的词塞进词表。含糊时走 `skill:ask-route`，不锁死只读，也不猜「最像」的 SOP。
5. 禁止仅凭猜测套用「最像」的 SOP。
