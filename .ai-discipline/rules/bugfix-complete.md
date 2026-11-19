---
kind: rule
id: bugfix-complete
name: 缺陷完成门
description: bugfix 收工前对照完成定义放行
role: gate
always: false
---

# 缺陷完成门

对照当前 `sop:bugfix` 正文「完成定义」逐条核对。未满足则不得宣称完成；无法在本环境验证的项须写明。
