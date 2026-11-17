---
kind: rule
id: route-gate
name: 路由门
description: 无匹配 SOP 须走 ask-route；禁止无路径乱改业务代码
role: gate
always: true
summary: 无匹配 SOP 须走 ask-route；禁止无路径直接改业务代码
---

# 路由门

1. 必须先 Read `.ai-discipline/workflows/index.md` 匹配主 SOP。
2. 零命中、多命中 priority 并列难决、或混合意图：完整 Read `.ai-discipline/skills/ask-route.md`，按其执行；选定前不得改业务代码。
3. 禁止仅凭猜测套用「最像」的 SOP。
