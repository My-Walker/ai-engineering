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

规范产品：`mdd-ai-eng-spec` 是 L3 下的 **规范包之一**，位于 [`03-spec-orchestration/packages/mdd-ai-eng-spec`](./03-spec-orchestration/packages/mdd-ai-eng-spec/)，npm 仍为 `@mdd-ai-eng/specs`。包登记见 [`packages/README.md`](./03-spec-orchestration/packages/README.md)。

本仓库是体系 **伞仓**（git）；各规范包在子目录内维护版本并手动 `npm publish`。

## 在本仓开发时如何「用」规范

- **改规范**：直接编辑 `03-spec-orchestration/packages/mdd-ai-eng-spec/ai-engineering-specs/`，不要在伞仓根 `npm install @mdd-ai-eng/specs`。
- **让 Cursor / Kilo 加载规范**：仓库根已放本地锚点（`.cursor/rules/mdd-ai-eng.mdc`、`.kilocoderrules`），指向上述 `AGENTS.md`。请用 Cursor **打开本伞仓根目录** 作为工作区。
- **业务项目**：仍通过 `npm install @mdd-ai-eng/specs` 消费已发布包。
- **多规范包本地互依**：等出现第二个包且需要依赖通用包时，再在伞仓根加 npm workspaces（当前单包不必）。

原则：**分工独立、运行组合。**
