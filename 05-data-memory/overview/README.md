# L5 数据与记忆层 · 总纲

## 定位

为 Agent 提供任务依据：代码与文档检索、RAG、会话记忆、过程工件等；关注召回质量、隐私、新鲜度与权限。

## 职责

- 上下文来源的组织与检索策略  
- 记忆写入/失效/隔离（租户、仓库、会话）  
- 与敏感信息相关的进入模型前处理（脱敏等）

## 非职责

- 不替代规范门禁与 SOP（→ L3）  
- 不替代模型本身（→ L1）  
- 存储适配器若通过 MCP/API 暴露，实现可与 L4 协作，但「记忆策略」归属本层

## 现状

产品包：[`../packages/agent-memory-mcp`](../packages/agent-memory-mcp)（`@mdd-ai-eng/agent-memory-mcp`）。设计定稿见仓库 `design-assets/记忆mcp/记忆机制定稿记录.md`。

## 详细文档

见同层 [`../docs/`](../docs/)（若有）；包内 [`../packages/agent-memory-mcp/README.md`](../packages/agent-memory-mcp/README.md)。
