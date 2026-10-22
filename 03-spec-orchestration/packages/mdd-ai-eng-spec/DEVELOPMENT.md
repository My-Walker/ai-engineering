# 开发本仓库

这份说明只给维护 `@mdd-ai-eng/specs` 的人。它不进入 npm 发布包。安装后的使用方式见 `README.md`。

## 所在位置（monorepo）

本包已迁入体系伞仓，路径：

```text
ai-engineering/03-spec-orchestration/packages/mdd-ai-eng-spec/
```

- 伞仓 git：`ai-engineering`（在伞仓根提交）。
- npm 包名不变：`@mdd-ai-eng/specs`；在本目录手动 `npm publish`。
- 旧独立仓 `https://github.com/My-Walker/mdd-ai-eng-spec` 仅作历史归档，勿再推送功能。
- 干净迁入基线：旧仓 `1.2.0` / commit `c9ca89f`。
- **Agent 激活**：请打开伞仓根（不是本包目录、也不是旧路径）。伞仓根锚点指向本包 `ai-engineering-specs/AGENTS.md`。勿在伞仓根安装本 npm 包。在本包目录执行 `node scripts/install-anchors.js` 只会刷新**本包根**锚点，供单独打开本包目录时使用。

## 发布内容

`package.json` 的 `files` 决定额外打进包里的路径。当前为：

- `README.md`
- `ai-engineering-specs/`
- `scripts/install-anchors.js`

`package.json` 本身会被 npm 一并发布。`DEVELOPMENT.md`、`test/`、`evals/`、`ai-engineering-sandbox/`、`.cursor/`、`.kilocoderrules` 不在 `files` 中，不会发布。

版本只记录在本包目录 `package.json`。发布源由本包 `.npmrc` 固定为官方源。  
推荐发版：在本目录执行 `npm run release -- <版本>`（升版本、检查、推伞仓 `main`、打 `specs-v*` tag），再在本目录手动 `npm publish`。不要在伞仓根 publish。

## 目录

```text
package.json                  包名、版本、发布清单、安装脚本入口
README.md                     安装方说明，随包发布
DEVELOPMENT.md                本文件，不发布
scripts/                     维护脚本。作用与用法见 scripts/README.md
  install-anchors.js          写入或刷新锚点，随包发布
  check-system.sh             校验规范索引路径
  run-evals.py                检查已保存的真实 Agent 回复
  release.sh                  发布准备（升版本/推 main/打 specs-v* tag，不执行 publish）
test/                         锚点安装单元测试
evals/                        行为评测。用法见 evals/README.md
  test-suite.json             题目与通过条件
  responses/                  人工保存的真实 Agent 回复，文件名为 <用例id>.txt
ai-engineering-specs/         规范正文
  AGENTS.md                   总纲：优先级、门禁、路由、overlay、发布约定
  rules/                      技术底线
  workflows/                  标准作业流程（含 explore-review、plan-shared）
  skills/                     技能（可为预留空索引）
ai-engineering-overlay/       可选；业务/本仓加严层，不进入发布包
ai-engineering-sandbox/       试写代码目录，不发布
.cursor/rules/mdd-ai-eng.mdc  本仓库的 Cursor 锚点
.kilocoderrules               本仓库的 Kilo 锚点
```

`ai-engineering-sandbox/` 只用来让 AI 试写代码，目录内不放锚点。约束来自仓库根目录的 `.cursor`、`.kilocoderrules` 和 `ai-engineering-specs/`。

## 本地命令

在**本包目录**执行：

```bash
npm test
npm run check
node scripts/install-anchors.js
python scripts/run-evals.py
npm run release -- 1.2.1
# 或先预览：npm run release -- --dry-run --bump patch
```

- `npm test`：验证锚点写入、路径刷新和标记替换。
- `npm run check`：验证三个索引里的文件路径都存在。
- `node scripts/install-anchors.js`：在本包根刷新锚点。内容未变时跳过。路径是 `./ai-engineering-specs/AGENTS.md`。
- `python scripts/run-evals.py`：按 `evals/README.md` 检查 `evals/responses/<用例id>.txt`。没有真实回复时评测失败。
- `npm run release -- <版本>`：发布准备流程，详见 `scripts/README.md`。结束后仍在伞仓 `main`，在本目录手动 `npm publish`（浏览器 2FA）。

作为 npm 依赖安装时，锚点写到执行安装命令的业务项目根目录，路径指向 `node_modules` 中的总纲。
