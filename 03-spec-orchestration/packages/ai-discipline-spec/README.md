# @ai-engineering/discipline

标识：`ai-discipline`。L3 **规范纪律层**第一枪实现包。

用薄常驻 + SOP 组合 + 原子 skill，约束 Agent 怎么干活；高频动作用人触发的 skill **command** 插入。设计定稿见伞仓 [`规范纪律层 · 设计理念.md`](../../docs/规范纪律层%20·%20设计理念.md)。

> 与 `@mdd-ai-eng/specs` **独立**：本包不改旧包；真源落在**业务仓** `.ai-discipline/`，不是留在 `node_modules` 里只靠锚点去读。

## 你得到什么

在**业务项目根**执行 `install` 后会写入：

| 路径 | 作用 | 再装是否覆盖 |
| :--- | :--- | :--- |
| `.ai-discipline/workflows\|skills\|rules/*.md` | 纪律真源 | 默认**不覆盖**只补缺；`install --force` 时同名整文件覆盖（不删本地多出来的） |
| `.ai-discipline/commands/index.yaml` | 挂哪些 skill command | 默认已存在则不覆盖；`--force` 时覆盖 |
| `.ai-discipline/workflows/index.md` | SOP 路由索引 | `sync` / `install` 末尾可重写 |
| 仓根 `AGENTS.md`（`<!-- ai-discipline:… -->`） | 薄常驻：总禁令 + 强制加载 | 只改标记块内 |
| 所选宿主薄壳 | Cursor / Claude / Codex 的 command 入口 | **按清单覆盖**；清单外旧壳删除 |
| Cursor：`.cursor/rules/ai-discipline.mdc` | 极薄 always，只逼 Read `AGENTS.md` | 覆盖生成 |

这些文件应**提交进业务仓**，团队共享同一套纪律。

## 安装（开发态 / 本地脚本）

当前以伞仓源码联调为主（尚未走 npm publish 发版流程时）：

1. 先进入**业务仓根或空沙箱目录**（不要在本包目录里装）。
2. 用脚本绝对路径执行 `install`：

```bash
# 当前目录 = 要安装的项目根
node "E:/work/project/git/ai-engineering/03-spec-orchestration/packages/ai-discipline-spec/scripts/discipline.js" install --hosts cursor
```

或在任意目录用 `--root`：

```bash
node "E:/work/project/git/ai-engineering/03-spec-orchestration/packages/ai-discipline-spec/scripts/discipline.js" install --root "D:/path/to/your-app" --hosts cursor
```

跟上游 seed 对齐（会丢掉同名真源的本地修改，先提交或备份）：

```bash
node "…/scripts/discipline.js" install --root "D:/path/to/your-app" --hosts cursor --force
```

- `--hosts`：`cursor` / `claude` / `codex`，逗号多选。未传且在 TTY 下会交互多选。
- `--force`：用 seed **整文件覆盖**已存在的同名 `workflows`/`skills`/`rules` 与 `commands/index.yaml`；**不删除**本地多出来的资产；末尾仍 `sync`（按当前磁盘重写 index 与 AGENTS 标记块）。
- 装完用 Cursor **打开该项目根**做会话验收；不要打开本包目录当业务仓。

### 各宿主会多写什么

| 宿主 | 额外产物 |
| :--- | :--- |
| `cursor` | `.cursor/commands/{id}.md` + `.cursor/rules/ai-discipline.mdc` |
| `claude` | `.claude/commands/{id}.md`（含 `disable-model-invocation`）+ 仓根 `CLAUDE.md` 镜像块 |
| `codex` | `.agents/skills/{id}/SKILL.md` + `agents/openai.yaml`（关闭隐式调用） |

## CLI

```bash
node …/scripts/discipline.js validate [--root <dir>]
node …/scripts/discipline.js sync [--root <dir>] [--claude]
node …/scripts/discipline.js install [--root <dir>] [--hosts cursor,claude,codex]
```

| 命令 | 作用 |
| :--- | :--- |
| `validate` | 校验 schema、路径=`id`、steps/inserts 引用、command ≤10 且含 `discipline-author` |
| `sync` | 先 validate；重写 `workflows/index.md` 与 AGENTS 标记块（及已有/指定的 `CLAUDE.md`） |
| `install` | 补缺 seed（可选 `--force` 同名覆盖）→ 写宿主薄壳 → sync |

改了 skill/SOP/rule 正文后一般只需 `validate` + `sync`。改了 `commands/index.yaml` 或要刷新薄壳说明时再 `install`。

## 日常怎么用（装完之后）

1. 新会话：Cursor 锚点迫使 Agent **完整 Read** 仓根 `AGENTS.md`，再按其中协议读 `.ai-discipline/workflows/index.md` 路由 SOP。
2. 意图清晰：命中 SOP → 按 `steps` 顺序 Read skill/rule；遵守 `optional` / `when`。
3. 意图模糊 / 多命中难决：走 `ask-route`（选项 + 推荐），选定前不改业务代码。
4. 中途插入：在聊天里用 `/` 触发已登记 command（如 `/add-logs`），只加载对应 skill，做完回到当前 SOP 阶段。
5. 改纪律资产：用人触发的 `/discipline-author`（或直接改文件），然后 `validate` → `sync`（改 command 声明再 `install`）。

第一枪预挂的 command：`discipline-author`、`clarify-grill`、`add-logs`、`verify`、`code-review`、`handoff`。  
`/handoff` 默认把交接文档写到系统临时目录，对话只给绝对路径；新会话 `Read` 该路径续跑（不要靠复制整段聊天）。

## 与旧包

不修改、不依赖运行时的 `@mdd-ai-eng/specs` / `mdd-ai-eng-spec`。同一仓库若两者都装，会出现两套 always，仅建议在迁移对比时短暂并存。
