# @mdd-ai-eng/agent-memory-mcp

项目级 Agent 记忆 MCP：Markdown 真源 + `better-sqlite3` FTS5（CJK bigram）+ 可选本地 e5 语义精排。

给当前项目一套可进 git 的记忆（决策 / 约定 / 模块 / 坑 / 词义等），经 MCP 供 Cursor、Claude Code 等读写与检索。索引可删可重建，**权威永远是 md 文件**。个人口味放宿主 User Rules，本包不做角色库。

维护本包源码见同目录 `DEVELOPMENT.md`（**不随 npm 发布**）。

---

## 要求（请先读：安装失败多半在这里）

- **Node.js ≥ 24**（推荐 **24.x**，不要盲升到尚无预编译支持的更新大版本）
- 依赖 **`better-sqlite3@^12.11.1`**（本包已锁定）

`better-sqlite3` 是原生模块。安装时先找 `Node ABI + OS + arch` 的预编译包（Node 24 ≈ ABI **137**）；没有则本机编译。Windows 缺 Visual Studio C++ 工具链时会失败。

常见坑：`better-sqlite3@11.x` 对 Node 24 Windows 往往**没有** prebuild，会卡很久；本包用 **12.x**。同类 MCP 也请先核对 Node 与 better-sqlite3 是否匹配。

| 检查 | 说明 |
|------|------|
| `node -v` | 应为 v24.x；MCP 用的是 PATH 里的 node |
| `node -p "process.versions.modules"` | Node 24 一般为 137 |
| 依赖 | 勿擅自降到无 Node 24 prebuild 的 11.x |
| 升 Node 25/26 前 | 先确认该 ABI 已有 better-sqlite3 预编译 |

---

## 安装与接入

在业务项目根目录：

```bash
npx -y @mdd-ai-eng/agent-memory-mcp init
```

然后**重启** Cursor / Claude Code，确认 MCP `agent-memory` 已连接。

`init` 默认写入：

| 项 | 落点 |
|----|------|
| 记忆根 | `.agent-memory/` |
| 配置 | `.agent-memory/config.yaml` |
| gitignore | 忽略 `inbox/`、`index/`、`logs/` |
| MCP | 合并 `.cursor/mcp.json` + 项目根 `.mcp.json` |
| Cursor 规则 | `.cursor/rules/agent-memory.mdc` |
| Cursor `/` 命令 | `.cursor/commands/memory-*.md`（7 个） |
| Claude 锚点 | 项目根 `CLAUDE.md`（`<!-- agent-memory:start -->` …） |
| Stop hook | `.cursor/hooks.json` + `.cursor/hooks/memory-stop.mjs` |
| git post-commit | **默认不装**；仅 `--hooks` 时装 noop（非 LLM） |

MCP 片段形态：

```json
{
  "mcpServers": {
    "agent-memory": {
      "command": "npx",
      "args": ["-y", "@mdd-ai-eng/agent-memory-mcp", "mcp"]
    }
  }
}
```

也可：`npm i -D @mdd-ai-eng/agent-memory-mcp` 后用本地 bin；stdio 入口为 `agent-memory-mcp mcp`。

### init 常用参数

| 选项 | 含义 |
|------|------|
| `--project <path>` | 业务项目根（默认 cwd） |
| `--memory-root <path>` | 记忆根（默认 `<project>/.agent-memory`） |
| `--mcp-target both\|cursor\|mcp-json\|print` | MCP 写入目标；`print` 只打印 |
| `--skip-mcp` / `--skip-rules` / `--skip-commands` / `--skip-claude-rules` | 跳过对应项 |
| `--hooks` | 本机 `.git/hooks/post-commit` noop |
| `--force` | 覆盖已存在文件（部分路径） |

其它 CLI：

| 命令 | 说明 |
|------|------|
| `mcp` / `serve` | 启动 MCP stdio |
| `doctor [--prefetch-model]` | 自检；可选预拉 embedding |
| `prefetch-model` | 仅预拉模型到缓存目录 |

---

## 记忆根目录（`.agent-memory/`）

```text
.agent-memory/
  config.yaml
  workspace/handoff.md          # 交接卡（整卡覆盖）
  workspace/seed_done           # 冷启动已关闭（可与空正式层并存）
  canonical/
    decisions/                  # 决策（YYYYMMDD-slug.md）
    conventions/                # 约定
    modules/                    # 模块事实
    pitfalls/                   # 踩坑
    domain/                     # 词义
    <topic>/_superseded/        # 近义合并后的旧条（检索默认排除）
  inbox/                        # 待审（gitignore）
  archive/                      # 归档（进 git，开场默认不注入）
  index/                        # sqlite 索引（gitignore，可重建）
  logs/                         # 日志（gitignore）
  templates/                    # 正文模板参考
```

| 路径 | 默认进 git | 用途 |
|------|------------|------|
| `canonical/**`、`archive/**`、`handoff.md`、`config.yaml` | 是 | 团队共享 |
| `inbox/`、`index/`、`logs/` | 否 | 本机待审 / 可重建索引 / 日志 |

主题封闭为上述五个；禁止写到 `canonical/` 根。

---

## Cursor `/` 命令

| 命令 | 作用 |
|------|------|
| `/memory-fetch-context` | 开场召回 |
| `/memory-draft-save` | 拟稿 → 四态 → 写入 |
| `/memory-inbox-list` | 待审列表 |
| `/memory-dedupe-review` | 近义整理 |
| `/memory-handoff-update` / `/memory-handoff-clear` | 交接卡 |
| `/memory-doctor` | 自检；必要时询问后 reindex |

`/` 是提示词触发器，落盘仍走 MCP。

---

## MCP 工具

| 工具 | 说明 |
|------|------|
| `memory_fetch_context` | 有效 handoff → 只返回卡；否则花名册；有 `query` 才附探针。meta 含 `canonical_empty` / `seed_done` / `seed_recommended`（只信号，不建档） |
| `memory_search` / `memory_get` | 检索短探针 / 按 id 或路径取全文 |
| `handoff_update` / `handoff_clear` | 更新 / 清空交接卡 |
| `memory_seed_draft` | 冷启动：Agent 拟稿写入 inbox（须 confirmed；仅 `canonical_empty && !seed_done`）；不置 `seed_done` |
| `memory_seed_skip` | 关闭冷启动（写 `seed_done`）；允许正式层仍为空 |
| `memory_write` | 写正式层（须 `confirmed_by_user: true`） |
| `memory_inbox_write` | 写待审（须 confirmed） |
| `inbox_list` / `inbox_promote` / `inbox_discard` | 待审策展；promote 可 `reject: true`；晋升 `source_type=seed` 条目会置 `seed_done` |
| `memory_archive` | 正式 → archive |
| `memory_dedupe_scan` / `memory_dedupe_apply` | 近义扫描 / 确认后合并（旧条进 `_superseded/`） |
| `memory_reindex` / `memory_doctor` | 重建索引 / 自检（doctor 含 seed 生命周期字段） |

### 人审四态（写入前必须展示）

```text
【记忆待确认】
拟写入：<topic> / <title>
摘要：<summary 一行>
请回复其一：
1. 通过 — 写入正式记忆
2. 放弃 — 不保存
3. 修改 — 说明改法后我改拟稿，再请你确认
4. 进入待审 — 先放入 inbox，稍后再转正
（未选定时不得 memory_write / inbox 落盘）
```

### 门闩

- 缺 confirmed → `CONFIRMATION_REQUIRED`
- 疑似密钥 → `SECRET_REJECTED`（整次不落盘）
- 近义过高 → `needs_review` + `near_matches`（尚未落盘）
- 同 content_hash / slug 冲突 → `CONFLICT`

---

## 推荐流程

生命周期：**安装（init）→ 建档（seed，一次性）→ 稳态召回 / 日常写入**。

1. **开场：** `memory_fetch_context`（有任务带 `query`）— 只召回
2. **冷启动（仅当 `seed_recommended`）：** 用户在谈本仓库时提议建档 → 四态 → `memory_seed_draft`；跳过 → `memory_seed_skip`（done 后可仍 empty）。草案进 inbox 后 `inbox_promote` 转正也会置 `seed_done`
3. **记结论：** 拟稿 → 四态 → `memory_write`；有 `near_matches` 再四态
4. **待审：** `inbox_list` → promote / reject / discard
5. **收工：** `handoff_update`（Stop hook 仅辅助）
6. **手改 md：** `doctor` → **询问是否** `memory_reindex` → 同意再重建

交接卡：`status: active|done`，TTL 默认 7 天；过期或 `done` 时开场视为无卡（文件默认保留）。

---

## 配置与环境变量

`config.yaml` 主要默认：语义开、`Xenova/multilingual-e5-small`、近义阈值 0.85、search top_k 8、roster 4000 字、handoff TTL 7 天、inbox 逾期提醒 30 天、写入扫密钥。

环境变量（覆盖 yaml）：`AGENT_MEMORY_ROOT` / `CONFIG` / `SEMANTIC` / `EMBEDDING_MODEL` / `EMBEDDING_CACHE` / `SIMILARITY_THRESHOLD` / `NEAR_TOP_K` / `ROSTER_MAX_CHARS` / `SEARCH_TOP_K` / `HANDOFF_TTL_DAYS` / `LOG_LEVEL`。

优先级：**CLI > 环境变量 > config.yaml > 默认**。模型缓存默认 `~/.cache/huggingface/`。

密钥 allowlist 仅支持 `{ type: rule, id }` 与 `{ type: path, pattern }`，禁止把密钥原文写入配置。

---

## 常见问题

- **看不到工具：** 重启 IDE；查 mcp.json；看 MCP 面板（常为 Node / better-sqlite3）。
- **安装失败：** 见上文「要求」。
- **中文搜不到：** `memory_reindex`；检索为 CJK bigram，非 jieba。
- **首次语义慢：** `doctor --prefetch-model`；失败会 fallback 纯 FTS。
- **同事 clone：** Stop hooks 若已进 git 一般不用重装；缺 MCP/规则/记忆根再 `init`；可选 git hook 需本机 `init --hooks`。
