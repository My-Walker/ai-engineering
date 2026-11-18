# `.ai-discipline/docs/` 说明

项目级 **Agent 知识库**（规范与坑），不是 rule，不能写入 SOP `steps` 的 `use: rule:…`。

| 路径 | 作用 |
| :--- | :--- |
| `standards.md` / `pitfalls.md` | 薄入口：总则/全局坑 + 索引表 |
| `standards/` / `pitfalls/` | 专题/分册正文；按索引「何时读」按需 Read |
| `*/_template.md` | 新建文件时的骨架 |

加载协议见仓根 `AGENTS.md` 强制加载；禁止 Glob 本目录。  
`install --force` 会覆盖与 seed **同名**的入口/模板文件；业务正文请用补缺后本地维护，勿依赖 force 刷新。
