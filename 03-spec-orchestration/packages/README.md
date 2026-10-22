# L3 packages（规范包）

本目录存放规范与编排层下的 **可发版规范包**（完整产品目录，含 `package.json`）。

## 包登记

| 包目录 | 标识 / npm | 状态 |
|--------|------------|------|
| [`mdd-ai-eng-spec/`](./mdd-ai-eng-spec/) | `mdd-ai-eng` / `@mdd-ai-eng/specs` | 已迁入（干净快照，源自旧仓 `My-Walker/mdd-ai-eng-spec` @ `1.2.0` / `c9ca89f`） |

## 版本与发布

- **一包一 version**：只改该包目录下 `package.json` 的 `version`。
- **手动发布**：进入包目录执行自测后 `npm publish`（不要在伞仓根目录 publish）。
- npm 包名保持 `@mdd-ai-eng/specs`，已发布版本不撤回。

```bash
cd 03-spec-orchestration/packages/mdd-ai-eng-spec
npm run release -- 1.2.1          # 或 --bump patch；先 --dry-run 可预览
# 脚本推 main、打 specs-v* tag 后，在本目录：
npm publish
```

## 约定

- 规范正文留在各包 `ai-engineering-specs/`，不要复制进层级 `docs/`。
- 新增 uniapp / RN 等规范包时，在本目录并列新建完整包，并更新本表。
- 旧独立仓 `https://github.com/My-Walker/mdd-ai-eng-spec`：归档保留历史，不再作为开发入口。
