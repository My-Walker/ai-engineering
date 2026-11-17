# 开发说明

给维护本包的人看。安装方用法见 [`README.md`](./README.md)。设计定稿见伞仓 [`规范纪律层 · 设计理念.md`](../../docs/规范纪律层%20·%20设计理念.md) §6–§12。

`DEVELOPMENT.md` **不**进 `package.json` 的 `files`，发版时不会随包发布。

## 所在位置

```text
ai-engineering/03-spec-orchestration/packages/ai-discipline-spec/
```

- 伞仓 git 在 `ai-engineering` 根提交；**不要**在本包目录误跑 `install` 把真源写进包树。
- npm 名：`@ai-engineering/discipline`；CLI bin：`discipline`。第一枪以源码联调为主，publish 流程未定前勿随意发版。
- **不要**动 `mdd-ai-eng-spec`。

## 目录

```text
package.json                 包名、bin、files、scripts
README.md                    安装用户说明（会随 files 发布）
DEVELOPMENT.md               本文件（不发布）
seed/                        纪律正文种子 → install 补缺到业务仓 .ai-discipline/
  workflows/                 SOP（bugfix / feature / explore-review）
  skills/                    原子 skill（含 ask-route、discipline-author 等）
  rules/                     门禁 / 约定（always 带 summary）
  commands/index.yaml        挂哪些 skill command（≤10，必含 discipline-author）
templates/
  agents-generated.md        sync 填充 always summary → 仓根 AGENTS 标记块
scripts/
  discipline.js              CLI 入口
  validate.js / sync.js / install.js
  lib/parse.js               frontmatter（已归一化 CRLF）
  lib/hosts.js               各宿主薄壳与 Cursor mdc
  lib/fs-util.js             标记块、writeIfChanged、路径
test/cli.test.js             临时目录单测
evals/                       评测预留（可空）
```

## 本地命令

在**本包目录**执行：

```bash
npm test
npm run validate          # 需目标仓已有 .ai-discipline；开发时多用 --root
npm run sync
npm run install-local     # = install --hosts cursor，目标是 cwd，慎用
```

联调 / 验收请装到**空沙箱或业务仓**，用脚本绝对路径 + 对方 cwd，或 `--root`：

```bash
# 示例：当前目录是沙箱根
node "E:/work/project/git/ai-engineering/03-spec-orchestration/packages/ai-discipline-spec/scripts/discipline.js" install --hosts cursor

# 或任意 cwd
node "…/scripts/discipline.js" install --root "D:/path/to/sandbox" --hosts cursor,claude,codex
```

误装进本包时删除：`.ai-discipline/`、`.cursor/`、`AGENTS.md`（以及若有的 `CLAUDE.md`、`.claude/`、`.agents/`）。

## 改什么、怎么验

| 改动 | 建议动作 |
| :--- | :--- |
| `seed/**` 正文 | `npm test`；沙箱再 `install`（已有文件不覆盖——若要看新 seed 正文，用新沙箱或手动删对应文件） |
| `templates/agents-generated.md` | 沙箱 `sync` / `install`，看 `AGENTS.md` 标记块 |
| `scripts/lib/hosts.js` 薄壳 | 沙箱 `install`（薄壳按清单**覆盖**） |
| `scripts/lib/parse.js` / validate | `npm test`；故意坏引用应失败 |
| `commands/index.yaml`（seed） | 新沙箱 install；或业务仓改声明后再 install 刷新壳 |

Windows 下 seed 多为 CRLF；解析必须经 `parse.js` 归一化，勿再引入「按裸 `$` 匹配行尾」的脆弱写法。

## CLI 语义（实现约束）

- `validate`：失败 exit ≠ 0；检查 kind/id/name/description、路径=`id`、steps/inserts、command 约束、`ask-route` 存在。
- `sync`：先 validate；重写 `workflows/index.md`（含 priority）；重写 AGENTS 标记块（总禁令 = always `summary`；强制加载含 ask-route；**无** command 表）。
- `install`：seed **补缺不覆盖** → 宿主薄壳覆盖 + 清单外删除 → sync。Cursor command 正文标题下先写 skill `description`（供 `/` 预览），再写执行三步。

薄壳统一三步：Read `.ai-discipline/skills/{id}.md` → 执行 → 回到当前任务/SOP 阶段。

## 验收场景（手工）

1. 安装后新会话：Cursor 锚点迫使 Read `AGENTS.md` → Read `workflows/index.md`
2. 模糊意图 → `ask-route`，选定前不改代码
3. 缺陷无证据 → evidence-gate；可走向 `/add-logs`
4. `/add-logs` 等人触发 command 只加载对应 skill；`/` 预览应先见用途句而非套话
5. 再次 install 不覆盖用户已改 skill；可刷新 command 薄壳与 sync 生成物

## 非本包范围（第一枪）

npm publish 流程、与 mdd 迁移/卸载、用户级路径、长 SOP 状态文件、Codex 字段深度兼容矩阵、完整 evals 题集。
