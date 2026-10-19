# Cloudflare Pages 发布配置

同一 GitHub `main` 分支可供 Vercel 与 Cloudflare Pages 构建。

| 配置 | 值 |
|---|---|
| GitHub 仓库 | `freddhluo/postgraduate-program` |
| 生产分支 | `main` |
| 框架预设 | VitePress（或 None 并手动填写下列命令） |
| 根目录 | 仓库根目录 |
| 构建命令 | `npm run build && npm run check` |
| 输出目录 | `docs/.vitepress/dist` |
| Node 版本 | 24（`.node-version`） |
| SITE_BASE | `/`，或不设置 |

在 Cloudflare 的 Workers & Pages → Create application → Pages → Import an existing Git repository 中关联该仓库。首次关联需允许 Cloudflare GitHub App 访问该仓库。项目创建时选择 `main`，保存并部署。成功后，每次推送到 `main` 会自动构建并更新网站。

`wrangler.jsonc` 声明 Pages 构建目录。此静态网站无需数据库、API 密钥或运行时绑定。不要将 GitHub Pages 专用的 `/postgraduate-program/` 前缀用于 Cloudflare 或 Vercel。

部署后检查：首页 42 所大学 / 457 个项目与方向、`/alumni.html` 的案例、单校项目锚点、PDF 下载与项目对比。只有 Cloudflare 返回成功状态后，才能确认具体的 `pages.dev` 地址。

官方文档：[GitHub 集成](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/) · [Pages 构建配置](https://developers.cloudflare.com/pages/configuration/build-configuration/) · [Wrangler 配置](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)
