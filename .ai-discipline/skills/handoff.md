---
kind: skill
id: handoff
name: 会话交接
description: 把当前会话压成交接文档写入系统临时目录，供新会话 Read 续跑；须链到 spec
---

# 会话交接

把当前进度压成**一份可续跑的交接文档**，让新会话少靠「复制长聊天」。  
**需求/验收真源**是 `.scratch/<feature>/spec.md`（若有）；handoff 是进度指针，不替代 spec。

## 进入条件

- 长任务将中断、换会话、换人或换工作副本；或用户触发 `/handoff`。  
- 用户可附带「下一会话焦点」说明以裁剪文档。

## 核心规则

1. **必须链到 spec**：若存在 `.scratch/<feature>/spec.md`（或 runtime 指针），交接文档须写明该路径；**无 spec** 时须显式写明「无 spec」，并建议续跑前先 `publish-spec`（或 `/publish-spec`）。  
2. **默认写系统临时目录**，不进工作区 / `.ai-discipline/`（除非用户明确要求其它路径）。  
3. **对话只回绝对路径 + 短摘要**，不倾倒与文件重复的全文。  
4. **已有产物只引用**路径/URL（spec、runtime、plan、diff、测试报告等），不重抄全文。  
5. **脱敏**：密钥/密码/令牌/PII 涂改；只写环境变量名或「存在何处」。  
6. **建议续跑**使用本层路径：先 Read spec（若有）→ AGENTS → workflows；或提示人触发已登记 command；**禁止**写「调用宿主 Skill tool」。

## 落盘（默认）

1. 路径：`$TMPDIR`，否则 Unix `/tmp`，Windows `%TEMP%`（或等价）。  
2. 文件名建议：`ai-discipline-handoff-<短时间戳或随机串>.md`。  
3. 写完后对话报告：绝对路径、一两句摘要、续跑提示（先 Read 该文件，再 Read spec）。  
4. 用户要求落工作区时：确认路径后再写；仍须脱敏。

## 文档必须包含的节

### 1. 下一会话焦点

用户触发参数或推断的一句话目标。

### 2. Spec 与 runtime

- spec 路径（或「无 spec」+ 建议 publish-spec）  
- runtime 路径（若有）与当前阶段/dispatch 状态  

### 3. 进度快照

- 当前 SOP id/名称与卡点（steps 序号或 skill/rule/dispatch id）  
- 已确认结论（短；细节以 spec 为准）  
- 证据与未决  
- 下一步建议（1～3 条）

### 4. 关键路径与命令

仓库内路径、关键命令、issue/PR URL；产物只引用。

### 5. 建议续跑

示例顺序：

1. Read spec（若有）与本 handoff  
2. 完整 Read 仓根 `AGENTS.md`（若尚未加载）  
3. 完整 Read `.ai-discipline/workflows/index.md`；必要时直读当前 SOP  
4. 按需直读 skill/rule（点名 id，禁止 Glob）  
5. 若需人触发插入：提示 `/` + 已登记 command id  

### 6. 敏感信息

已脱敏说明。

## 完成标准

- 临时文件已写入；对话已给**绝对路径**与短摘要。  
- 文档含焦点、**spec 链接或无 spec 说明**、进度、路径、建议续跑、脱敏处理。

## 禁止

- 用 handoff 正文代替 spec 验收契约。  
- 默认提交进 git，或把 handoff 当长期需求真源。  
- 未给绝对路径就结束。  
- 「suggested skills → Skill tool」类宿主话术。
