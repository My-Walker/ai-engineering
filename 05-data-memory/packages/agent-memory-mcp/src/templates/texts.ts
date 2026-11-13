export const FOUR_STATE_TEMPLATE = `【记忆待确认】
拟写入：<topic> / <title>
摘要：<summary 一行>
请回复其一：
1. 通过 — 写入正式记忆
2. 放弃 — 不保存
3. 修改 — 说明改法后我改拟稿，再请你确认
4. 进入待审 — 先放入 inbox，稍后再转正
（未选定时不得 memory_write / inbox 落盘）`;

export const RULES_BODY = `# Agent 记忆规则

1. 会话开始 / 换任务：调用 memory_fetch_context（有任务则带 query）。只召回，不建档。
2. 冷启动：若 meta.seed_recommended（正式层空且未 seed_done），且用户已在谈本仓库，则提议建档——拟五主题草案 → 四态 → memory_seed_draft(confirmed_by_user:true)；用户明确跳过则 memory_seed_skip。禁止把建档当成 fetch 的副作用或在 fetch 里静默写入。
3. 用户确认决策 / 方案 / 约定 / 踩坑：拟稿 → 人审四态 → 通过则 memory_write(confirmed_by_user:true) 或进待审。
4. 准备写正式前：处理 near_matches；有则先四态。
5. 用户说记住 / 记下来：同 3。
6. 用户说整理记忆 / 去重：dedupe_scan → 拟文 → 四态 → dedupe_apply。
7. 收工：handoff_update（Stop hook 可辅助）；难接则催命令写卡。
8. 禁止：无四态/无 confirmed 直写正式；整库 briefing；规范全文入记忆；写入密钥；seed_done 后仍反复催建档。

默认中文叙述。正式 topic 仅：decisions / conventions / modules / pitfalls / domain。
`;

export const CLAUDE_ANCHOR = `## Agent Memory

使用 MCP \`agent-memory\`（@mdd-ai-eng/agent-memory-mcp）。

${RULES_BODY}

四态模板：

${FOUR_STATE_TEMPLATE}
`;

export const DECISION_TEMPLATE = `# Context

# Decision

# Consequences
`;
