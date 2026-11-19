# 项目规范（入口）

给 Agent 的**薄入口**：只放全局总则 + 专题索引。  
与 `rule`（gate/convention）冲突时，以 **gate / AGENTS 总禁令**为准。  
硬必须应晋升为 `role: gate`（或极短 `convention`），不要靠本文件冒充否决闸。

## 全局总则

（业务仓填写。保持短；细则放到 `standards/` 专题。）

-

## 专题索引

按需增行。Agent **仅在「何时读」命中时**再完整 Read「路径」；未命中不读。禁止 Glob `docs/`。

| 专题 id | 路径 | 何时读 | 一句话 |
| :--- | :--- | :--- | :--- |
| git-commit | `.ai-discipline/docs/standards/git-commit.md` | 用户要求生成/撰写 commit message，或执行/协助 git commit | 中文提交说明格式与范围确认 |
| （例）typescript | `.ai-discipline/docs/standards/typescript.md` | 改动含 `.ts`/`.tsx` 或用户明确要求 TS 规范 | TypeScript 写法与工程约定 |

新建专题：复制 `standards/_template.md` → `standards/{id}.md`，并在本表登记一行。
