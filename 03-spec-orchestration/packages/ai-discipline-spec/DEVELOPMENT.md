# 开发说明

给维护本包的人看。安装方用法见 [`README.md`](./README.md)。设计定稿见伞仓 [`规范纪律层 · 设计理念.md`](../../docs/规范纪律层%20·%20设计理念.md) §6–§12。

`DEVELOPMENT.md` **不**进 `package.json` 的 `files`，发版时不会随包发布。

## 所在位置

```text
ai-engineering/03-spec-orchestration/packages/ai-discipline-spec/
```

- 伞仓 git 在 `ai-engineering` 根提交；**不要**在本包目录误跑 `install` 把真源写进包树。
- npm 名：`@ai-engineering/discipline`；CLI bin：`discipline`；license：`MIT`。
- **不要**动 `mdd-ai-eng-spec`。

## 目录

```text
package.json                 包名、bin、files、scripts
README.md                    安装用户说明（会随 files 发布）
DEVELOPMENT.md               本文件（不发布）
.npmrc                       钉官方源 + @ai-engineering scope
seed/                        纪律正文种子 → install 补缺到业务仓 .ai-discipline/
  workflows/                 SOP（bugfix / feature / explore-review）
  skills/                    做法积木（原子 skill；含 ask-route、discipline-author 等）
  rules/                     约束资产（gate 否决 / convention 短合规）；always 须 summary
  commands/index.yaml        挂哪些 skill command（≤10，必含 discipline-author）
  docs/                      项目知识库：入口 standards/pitfalls + standards|pitfalls/ 专题与 _template
templates/
  agents-generated.md        sync：always summary + 强制加载（含 docs 分层；不解释 role）
scripts/
  discipline.js              CLI 入口
  validate.js / sync.js / install.js
  release.sh                 发版准备（不随业务用法；不执行 npm publish）
  lib/parse.js               frontmatter（已归一化 CRLF）
  lib/hosts.js               各宿主薄壳与 Cursor mdc
  lib/fs-util.js             标记块、writeIfChanged、路径
test/cli.test.js             临时目录单测
evals/                       评测预留（可空）
```

## 作者话术（防与宿主撞车）

目录名 `skills` / `rules` / `docs` 与 `kind`、引用前缀（`skill:` / `rule:`）**不要改**。对人说明时用中文轴，避免当成 Cursor「通用 rules/skills 百科」：

| 目录 | 称呼 | 轴 | 不是 |
| :--- | :--- | :--- | :--- |
| `skills/` | **做法积木** | HOW：单一任务怎么做 | 项目规范百科；任务主入口 |
| `rules/` | **约束资产** | WHETHER：gate 否决 / convention 短合规且可 `rule:id` | 长规范、案例集（那是 docs） |
| `docs/` | **项目知识库** | KNOW：standards / pitfalls，按「何时读」加载 | rule；**不能**写进 SOP `use: rule:…` |

`convention` **少用、可空**：种子可以没有一条；空 ≠ 该并进 docs。它的硬价值是短文 + 稳定 id + 能挂 `steps`。

## 放哪：决策树

```text
要写的是「一步怎么做」（可被 SOP/command 复用）？
  → skill（做法积木）

未满足就不得往下 / 不得宣称完成？
  → rule + role: gate（必要时 always + summary）

短、非否决、但要挂 steps 或被 skill 点名 rule:id？
  → rule + role: convention（默认 always: false）

长文、案例、勤增删的写法/坑、不需要进 SOP steps？
  → docs（入口 standards.md / pitfalls.md + 专题子目录并登记「何时读」）
  其中若抽出「硬必须」→ 再晋升为 gate 或（少见）convention；docs 可链 rule:id
```

| 选型 | 用当 |
| :--- | :--- |
| `role: gate` | 未满足 → **不得**进入下一步 / **不得**宣称完成（否决型） |
| `role: convention` | 短合规提醒；可挂 `steps` / 被 skill 点名；**默认 `always: false`**；always 极少 |
| docs 专题 | 长规范 / 坑案例；**不要**拆成大量 rule 冒充知识库 |

差别是**语义角色与可否引用**（否决 vs 短合规 vs 知识），不是强制力——本层均为软约束。AGENTS **不**写 role 教程；docs **分层加载**（入口全读、专题按需）。

常见误读：`docs/standards/git-commit` 等内容**长得像**旧式「通用 rule」，但它不可进 SOP steps；真要阶段否决或短条可引用，再晋升为 rule。

改 `seed/docs/**` 或 `templates/agents-generated.md` 后：`npm test`；业务仓要吃到新入口/模板：`install --force`（注意会盖同名 docs）或删对应文件后再 install。

## 本地命令

在**本包目录**执行：

```bash
npm test
npm run validate          # 需目标仓已有 .ai-discipline；开发时多用 --root
npm run sync
npm run install-local     # = install --hosts cursor，目标是 cwd，慎用
```

## 源码联调（伞仓绝对路径）

未发版、或要验证未发布的本地改动时：装到**空沙箱或业务仓**，用脚本绝对路径 + 对方 cwd，或 `--root`（不要在本包目录里装）：

```bash
# 示例：当前目录是沙箱根
node "E:/work/project/git/ai-engineering/03-spec-orchestration/packages/ai-discipline-spec/scripts/discipline.js" install --hosts cursor

# 或任意 cwd
node "…/scripts/discipline.js" install --root "D:/path/to/sandbox" --hosts cursor,claude,codex
```

误装进本包时删除：`.ai-discipline/`、`.cursor/`、`AGENTS.md`（以及若有的 `CLAUDE.md`、`.claude/`、`.agents/`）。

## 发版

在本包目录、伞仓 **`main`**、工作区干净时执行发布准备；脚本**不**执行 `npm publish`（留给维护者处理浏览器 2FA）。

**边界（硬）：** Agent / 自动化跑完 `npm run release`（或 `scripts/release.sh`）即收工。即使用户说「发布 npm」，也**不得**代跑 `npm publish`；仅可提示维护者本机手动执行。除非用户**另行明确**「连 publish 也一起执行」，才可越此界。

```bash
# 指定版本（推荐）
npm run release -- 0.1.1

# 或相对当前 package.json 自动 +1
npm run release -- --bump patch

# 只预览步骤
npm run release -- --dry-run 0.1.1
```

流程：升版本并提交 → `npm test` → 推 `main` → 打 `discipline-vX.Y.Z` tag → **打印**手动发布命令后结束。维护者本机再执行：

```bash
cd 03-spec-orchestration/packages/ai-discipline-spec
npm publish
npm view @ai-engineering/discipline version
```

- Tag 前缀用 `discipline-v*`，避免与 `specs-v*` 等其它规范包冲突。
- 勿在伞仓根目录 `npm publish`。
- scoped 包已设 `publishConfig.access=public`；若 npm 仍提示，按提示补 `--access public`。

## 改什么、怎么验

| 改动 | 建议动作 |
| :--- | :--- |
| `seed/**` 正文 | `npm test`。默认 **install 不覆盖**已有 skill/sop/rule；业务仓跟上游：`install --force`（同名整文件覆盖，不 prune 多余文件），或删对应文件后再 install / 手工拷 / 新沙箱。正文跨资产跳转须写 `skill:`/`rule:`/`sop:` + id（勿裸 id） |
| `templates/agents-generated.md` | 沙箱 `sync` / `install`，看 `AGENTS.md` 标记块 |
| `scripts/lib/hosts.js` 薄壳 | 沙箱 `install`（薄壳按清单**覆盖**） |
| `scripts/lib/parse.js` / validate | `npm test`；故意坏引用应失败 |
| `commands/index.yaml`（seed） | 新沙箱 install；或业务仓改声明后再 install 刷新壳 |

Windows 下 seed 多为 CRLF；解析必须经 `parse.js` 归一化，勿再引入「按裸 `$` 匹配行尾」的脆弱写法。

## CLI 语义（实现约束）

- `validate`：失败 exit ≠ 0；检查 kind/id/name/description、路径=`id`、steps/inserts（含 `confirm` 须布尔；`use` 可为 `skill|rule|dispatch`；`dispatch:<id>` 须存在对应 skill 且存在 `dispatch-run`）、command 约束、`ask-route` 存在。
- `sync`：先 validate；重写 `workflows/index.md`（含 priority）；重写 AGENTS 标记块（总禁令 = always `summary`；强制加载含 ask-route 与 dispatch 语义；**无** command 表）。
- `install`：seed 默认 **补缺不覆盖**（含 `docs/`）；`--force` 时同名 skill/sop/rule/docs 与 `commands/index.yaml` **整文件覆盖**（不删本地多出来的）→ 宿主薄壳覆盖 + 清单外删除 → sync。Cursor command 正文标题下先写 skill `description`（供 `/` 预览），再写执行三步。

薄壳统一三步：Read `.ai-discipline/skills/{id}.md` → 执行 → 回到当前任务/SOP 阶段。

## 省心编排（种子约定）

- Spec：`.scratch/<feature>/spec.md`；runtime：同目录 `runtime.md`。未开闸不写；开闸后有新确认自动增量（`clarify-grill` + `publish-spec`）。
- `feature`/`bugfix`：澄清（含开闸/增量）→ 终稿 `publish-spec`（可跳过琐碎不写）→ `spec-gate` → 琐碎同窗 / 非琐碎 `dispatch:*` → `join-dispatch` → `verify`。
- `dispatch` 软派发（Task）；串行；单 feature 上限见 `dispatch-run`；无 hook 硬拦。

## 验收场景（手工）

1. 安装后新会话：Cursor 锚点迫使 Read `AGENTS.md` → Read `workflows/index.md`
2. 模糊意图 → `ask-route`，选定前不改代码
3. 缺陷无证据 → evidence-gate；可走向 `/add-logs`
4. `/add-logs` 等人触发 command 只加载对应 skill；`/` 预览应先见用途句而非套话
5. 再次 install 不覆盖用户已改 skill；可刷新 command 薄壳与 sync 生成物；`install --force` 应恢复 seed 同名正文且保留本地多余文件
6. `validate` 接受种子中的 `dispatch:implement-change`；坏 `dispatch:` 目标应失败

## 非本包范围（当前）

与 mdd 迁移/卸载、用户级路径、并行 fan-out、Cloud 多后端、Matt 全套手搓兼容包、Codex 字段深度兼容矩阵、完整 evals 题集。
