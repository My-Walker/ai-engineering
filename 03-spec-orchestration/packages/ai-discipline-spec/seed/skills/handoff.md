---
kind: skill
id: handoff
name: 会话交接
description: 把当前会话压成交接文档写入系统临时目录，供新会话 Read 续跑
---

# 会话交接

把当前进度压成**一份可续跑的交接文档**，让新会话少靠「复制长聊天」。  
本层**不做** SOP 步骤状态机；临时交接文件 ≠ 仓内状态真源。

## 进入条件

- 长任务将中断、换会话、换人或换工作副本；或用户触发 `/handoff`。
- 用户可附带「下一会话焦点」说明以裁剪文档。

## 核心规则

1. **默认写系统临时目录**，不进工作区 / `.ai-discipline/`（除非用户明确要求其它路径）。
2. **对话只回绝对路径 + 短摘要**，不倾倒与文件重复的全文。
3. **已有产物只引用**路径/URL（plan、spec、ADR、diff、测试报告等），不重抄全文。
4. **脱敏**：密钥/密码/令牌/PII 涂改；只写环境变量名或「存在何处」。
5. **建议续跑**使用本层路径：直读 `.ai-discipline/skills|rules|workflows/{id}.md`，或提示人触发已登记 command（见 `commands/index.yaml`）；**禁止**写「调用宿主 Skill tool」。

## 落盘（默认）

1. 路径：`$TMPDIR`，否则 Unix `/tmp`，Windows `%TEMP%`（或等价）。
2. 文件名建议：`ai-discipline-handoff-<短时间戳或随机串>.md`。
3. 写完后对话报告：绝对路径、一两句摘要、续跑提示（先 Read 该文件）。
4. 用户要求落工作区时：确认路径后再写；仍须脱敏。

## 文档必须包含的节

### 1. 下一会话焦点

用户触发参数或推断的一句话目标。

### 2. 进度快照

- 当前 SOP id/名称与卡点（steps 序号或 skill/rule id）
- 已确认结论（短）
- 证据与未决
- 下一步建议（1～3 条）

### 3. 关键路径与命令

仓库内路径、关键命令、issue/PR URL；产物只引用。

### 4. 建议续跑

示例顺序：

1. 完整 Read 仓根 `AGENTS.md`（若尚未加载）
2. 完整 Read `.ai-discipline/workflows/index.md`；必要时直读当前 SOP  
   `.ai-discipline/workflows/{id}.md`
3. 按需直读 `.ai-discipline/skills/{id}.md` / `rules/{id}.md`（点名 id，禁止 Glob）
4. 若需人触发插入：提示 `/` + 已登记 command id（勿写成 Skill tool）

### 5. 敏感信息

已脱敏说明。

## 完成标准

- 临时文件已写入；对话已给**绝对路径**与短摘要。
- 文档含焦点、进度、路径、建议续跑、脱敏处理。

## 禁止

- 默认提交进 git，或当 SOP 步骤状态文件长期维护。
- 未给绝对路径就结束。
- 「suggested skills → Skill tool」类宿主话术。
