---
kind: rule
id: explore-readonly
name: 只读门
description: explore-review 默认禁止改业务代码
role: gate
always: false
---

# 只读门

在 `sop:explore-review` 期间默认不得修改业务代码、不得输出实现类 Plan 并开写。  
用户明确要求落地实现时：结束本 SOP，重路由到 `feature` / `bugfix`（必要时先 `ask-route`）。
