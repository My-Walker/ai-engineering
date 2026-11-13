# 开发本包

这份说明只给维护 `@mdd-ai-eng/agent-memory-mcp` 的人。**它不进入 npm 发布包。**  
安装后的使用方式见 `README.md`。

## 所在位置（monorepo）

```text
ai-engineering/05-data-memory/packages/agent-memory-mcp/
```

- 伞仓 git：在 `ai-engineering` 根提交。
- npm 包名：`@mdd-ai-eng/agent-memory-mcp`；在**本目录**手动 `npm publish`（不要在伞仓根 publish）。
- 产品定稿（不随包发布）：伞仓 `design-assets/记忆mcp/记忆机制定稿记录.md`。

## 发布内容

`package.json` 的 `files` 决定打进包的路径。当前为：

- `README.md`
- `dist/`（构建产物）

`package.json` 本身会被 npm 一并发布。  
**不发布：** `DEVELOPMENT.md`、`src/`、`test/`、`scripts/`（若未列入 files）、定稿文档等。

版本只记在本包 `package.json`。`engines.node` 为 `>=24`；依赖 `better-sqlite3@^12.11.1`（需带 Node 24 / ABI 137 预编译，勿降到无 prebuild 的 11.x）。

## 目录

```text
package.json           包名、版本、bin、files、依赖
README.md              安装方说明，随包发布
DEVELOPMENT.md         本文件，不发布
src/                   TypeScript 源码
dist/                  tsc 输出（发布）
test/                  单测
scripts/               构建辅助（如 copy-templates）
```

## 本地开发

```bash
cd 05-data-memory/packages/agent-memory-mcp
npm install
npm run build
npm test
```

对业务项目试 init / MCP（未 publish 时）：

```bash
node dist/src/cli.js init --project /absolute/path/to/app
node dist/src/cli.js mcp
```

业务项目 mcp.json 可临时指向：

```json
{
  "mcpServers": {
    "agent-memory": {
      "command": "node",
      "args": ["/absolute/path/to/agent-memory-mcp/dist/src/cli.js", "mcp"]
    }
  }
}
```

## 实现约束（与定稿一致）

- 索引引擎：`better-sqlite3`（非擅自改用 `node:sqlite`）
- 语义默认开；缓存显式指向用户级 huggingface 缓存目录
- 写入门闩、四态、CJK bigram、`_superseded/` 等见定稿 Q1–Q61
- 改对外行为前按伞仓规范做需求澄清 / 实现 Plan

## 发版建议

1. `npm test` 通过  
2. 升本包 `package.json` 版本  
3. 在本目录 `npm publish`（确认 registry、登录、是否 public/scoped）  
4. 在伞仓提交并推送  
