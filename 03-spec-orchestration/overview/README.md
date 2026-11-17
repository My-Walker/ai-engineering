# L3 规范与编排层 · 总纲

## 定位

以可版本化文档约束 Agent 行为：薄常驻索引与禁令、主路径（workflows/SOP）、原子 skills、少量 skill commands。  
本层是 **层**，其下可以有 **多个规范包**。

## 职责

- 定义门禁（作用）与 rules（载体）、SOP、skills、SOP 索引路由、skill command 协议  
- 约束 L2 内 Agent（含何时出 Plan、何时调工具、缺陷如何取证等）  
- 规范包的发布、薄宿主适配（AGENTS / commands）、行为评测（随具体包）

## 非职责

- 不是五层体系的总伞命名空间（体系根是 `ai-engineering`）  
- 不实现 MCP Server 或模型服务  
- 不替代应用宿主本身

## 层内结构

| 概念 | 说明 |
|------|------|
| 门禁 / rules | 门禁是放行作用；rules 是自有目录载体。不另立门禁类型；整库不默认进宿主 rules |
| 薄常驻 | `AGENTS.md`：总禁令 + 加载协议 + SOP 索引指针；无 command 表；SOP 大表在 `workflows/index.md` |
| 路由 | Read `workflows/index`（含 priority）；未命中走 skill `ask-route`；无 rules/skills 路由索引 |
| workflows / SOP | 组合菜谱（`.ai-discipline/workflows/`）；引用原子 skill + 门禁；人可用 skill command 中途插入 |
| skills | 原子积木（`.ai-discipline/skills/`）；高频者注册宿主 command；不替代 SOP |
| 元 skill | 一条 command：增删改 rules/skills/SOP/command 声明（作者态，须人确认） |
| 命名 / 落盘 | 新包 `ai-discipline-spec`（`@ai-engineering/discipline` / CLI `discipline`）；真源 `.ai-discipline/`；薄 `AGENTS.md` 仓根 |
| 第一枪零件 | SOP：bugfix/feature/explore-review；6 条 skill commands；见设计理念 §7 |
| 资产 schema | frontmatter：`kind`/`id`/`name`；SOP `steps:` 结构化；`commands/index.yaml`；见 §8 |
| 宿主 command | Cursor `.cursor/commands`；Claude `.claude/commands`；Codex 关隐式 host skill；见 §10 |
| 元 skill / CLI | 作者只写真源；`validate` + `sync` + `install`；见 §11（M1/V1） |
| 包内树 | `seed/`→`.ai-discipline/`；CLI 在 `scripts/`；见 §12 |
| packages/ | 可发版规范包目录；一包一产品 |

设计定稿见 [`../docs/规范纪律层 · 设计理念.md`](../docs/规范纪律层%20·%20设计理念.md)。

## 现有规范包

| 包 | 说明 | 位置 |
|----|------|------|
| `mdd-ai-eng-spec` | 通用规范包（标识 `mdd-ai-eng`，npm `@mdd-ai-eng/specs`） | [`../packages/mdd-ai-eng-spec/`](../packages/mdd-ai-eng-spec/) |
| `ai-discipline-spec` | 新纪律包（`ai-discipline` / `@ai-engineering/discipline`） | [`../packages/ai-discipline-spec/`](../packages/ai-discipline-spec/) |

层级 `docs/` / `overview/` 只做层设计与索引；改规范正文请到对应 package 目录。

## 现状

L3 是当前唯一有落地产品的层；通用包已干净迁入 `packages/`。建设重心继续放在规范包质量与评测。

## 详细文档

- **L3 本层**：[设计理念](../docs/规范纪律层%20·%20设计理念.md) · [docs 索引](../docs/)  
- **跨层概念**（通用层 / 流派 / 完备集 / 准则）：[`../../00-overview/docs/`](../../00-overview/docs/)
