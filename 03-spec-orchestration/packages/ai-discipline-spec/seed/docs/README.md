# `.ai-discipline/docs/` 说明

项目级 **Agent 知识库**（规范与坑）——轴是 KNOW，不是 rule。

| 路径 | 作用 |
| :--- | :--- |
| `standards.md` / `pitfalls.md` | 薄入口：总则/全局坑 + 索引表 |
| `standards/` / `pitfalls/` | 专题/分册正文；按索引「何时读」按需 Read |
| `*/_template.md` | 新建文件时的骨架 |

## 边界（与 rules / skills）

- **不是** rule：无 `kind`/`id`，**不能**写入 SOP `steps` 的 `use: rule:…`。
- 长文、案例、勤增删的写法/坑 → 放本目录；看起来像「通用规范」也仍然是 docs。
- 需要阶段否决，或短条且要 `rule:id` 挂进 SOP / 被 skill 点名 → **晋升**为 `rules/` 的 gate 或（少见）convention；本处可留链接。
- `skills/` 是做法积木（HOW），不是第二套规范百科。

加载协议见仓根 `AGENTS.md` 强制加载；禁止 Glob 本目录。  
`install --force` 会覆盖与 seed **同名**的入口/模板文件；业务正文请用补缺后本地维护，勿依赖 force 刷新。
