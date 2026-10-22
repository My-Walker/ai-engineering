# AI Engineering 体系

本目录是 **AI 工程五层体系** 的中立工作区根，**不是**某一个规范 npm 包。

| 路径 | 含义 |
|------|------|
| [`00-overview/`](./00-overview/) | 体系级总纲（五层、横切、组合关系、学习顺序） |
| [`01-model/`](./01-model/) | L1 模型层 |
| [`02-runtime-app/`](./02-runtime-app/) | L2 能力与应用层（现阶段借用 Cursor） |
| [`03-spec-orchestration/`](./03-spec-orchestration/) | L3 规范与编排层（可含多个规范包） |
| [`04-tools/`](./04-tools/) | L4 工具与集成层（含 MCP，不限于 MCP） |
| [`05-data-memory/`](./05-data-memory/) | L5 数据与记忆层 |

每层统一结构：

- `overview/` — 本层总纲（定位、边界、非目标、现状）
- `docs/` — 本层详细文档（后续填充）

规范产品示例：`mdd-ai-eng-spec` 是 L3 下的 **规范包之一**，当前仍在原 git 仓，见 [`03-spec-orchestration/packages/README.md`](./03-spec-orchestration/packages/README.md)。

原则：**分工独立、运行组合。**
