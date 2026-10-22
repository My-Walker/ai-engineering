# L3 规范与编排层 · 总纲

## 定位

以可版本化文档约束 Agent 行为：底线（rules）、主路径（workflows/SOP）、专项手法（skills）、路由与裁决（编排）。  
本层是 **层**，其下可以有 **多个规范包**。

## 职责

- 定义门禁、SOP、skills、索引路由与覆盖层协议  
- 约束 L2 内 Agent（含何时出 Plan、何时调工具、缺陷如何取证等）  
- 规范包的发布、安装锚点、行为评测（随具体包）

## 非职责

- 不是五层体系的总伞命名空间（体系根是 `ai-engineering`）  
- 不实现 MCP Server 或模型服务  
- 不替代应用宿主本身

## 层内结构

| 概念 | 说明 |
|------|------|
| rules | 跨任务底线，可叠加 |
| workflows | 主 SOP；每轮至多一个主流程；可含共享阶段（如 plan-shared） |
| skills | 可叠加的短手法；不替代 workflow；无复用可不建 |
| packages/ | 可发版规范包目录；一包一产品 |

## 现有规范包

| 包 | 说明 | 位置 |
|----|------|------|
| `mdd-ai-eng-spec` | 通用规范包（标识 `mdd-ai-eng`，npm `@mdd-ai-eng/specs`） | [`../packages/mdd-ai-eng-spec/`](../packages/mdd-ai-eng-spec/) |

层级 `docs/` / `overview/` 只做层设计与索引；改规范正文请到对应 package 目录。

## 现状

L3 是当前唯一有落地产品的层；通用包已干净迁入 `packages/`。建设重心继续放在规范包质量与评测。

## 详细文档

见同层 [`../docs/`](../docs/)。
