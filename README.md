# 升学图谱 · 金融数学研究生项目知识库

面向对外经济贸易大学统计学院金融数学专业本科生的班会分享网站。目标入学年份为 2028，整合 42 所大学、457 个项目 / 培养方向条目。保留报告的实际参考届别、原始来源、核验日期与草稿状态。

## 网站功能

- 分地区院校导航、一校一页完整报告、章节目录。
- 全站本地全文搜索，项目全文关键词、地区、学校和方向筛选。
- 最多四个项目并列对比；保留申请要求、课程、费用和就业数据的原文依据；支持分享对比链接。
- 2028 入学准备节奏，以及各校报告原有申请日程。
- 每校 Markdown / PDF 下载，自动生成跨校 CSV 索引。
- 响应式布局、深色模式、键盘操作、静态网站，无数据库。

## 本地运行

使用 Node.js 24（支持 Node.js 22 以上）。

```bash
npm ci
npm run dev
```

生产构建和校验：

```bash
npm run build
npm run check
npm run preview
```

## 内容维护

`schools/<region>/<school_id>.md` 是唯一内容主文件。`docs/schools/` 为自动生成页面，请勿直接编辑。所有原始报告保持八章结构与稳定项目 ID。

新增或修改报告后运行 `npm run build`；构建会重新生成页面、项目检索数据、时间线和 `data/programs.csv`。新增学校会自动加入导航。

PDF 放在 `docs/public/pdf/<school_id>.pdf`。当前 PDF 是与报告一起提供的阅读版，本项目不重新排版 PDF。修改报告时应从同一 Markdown 重新导出 PDF 并替换对应文件；如暂未更新，删除旧 PDF，网站会自动隐藏入口，避免读者下载过期资料。

不要因构建网站而更新 `last_verified_on`，也不要把 `draft` 自动改成 `reviewed`。只有实际复核后才更新这些字段。

方向标签为检索辅助；项目数含培养方向，不等同独立招生学位数量。招生渠道不根据关键词自动推断。

## Vercel

目标 GitHub 仓库：<https://github.com/freddhluo/postgraduate-program>

导入该仓库，Framework 选择 VitePress，部署设置已保存在 `vercel.json`：

- Build Command：`npm run build`
- Output Directory：`docs/.vitepress/dist`
- Install Command：`npm ci`
- Node.js：24.x
- Vercel 根域部署不设置 `SITE_BASE`（默认 `/`）。

关联仓库后，推送到生产分支 main 会触发 Vercel 构建。

## GitHub Pages

已提供 `.github/workflows/deploy-pages.yml`。在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。

工作流使用 Pages 返回的 `base_path`，可自动适配仓库路径 `/postgraduate-program/` 和以后设置的自定义域名。推送 main 或在 Actions 手动运行工作流即可部署。

预期默认地址：<https://freddhluo.github.io/postgraduate-program/>（需要 Pages 启用且工作流成功后才可访问）。

本地模拟 GitHub Pages 子路径：

```bash
SITE_BASE=/postgraduate-program/ npm run build
SITE_BASE=/postgraduate-program/ npm run check
```

Windows PowerShell：

```powershell
$env:SITE_BASE='/postgraduate-program/'
npm run build
npm run check
Remove-Item Env:SITE_BASE
```

## 校验范围

`npm run check` 校验源文件一致性、学校与项目 ID、各项目锚点、时间线、来源记录、PDF 文件头、全站内部链接及本地搜索索引。外部官方招生信息沿用报告，不将网站发布视为事实重新核验。

## 部署文档

- [VitePress 官方部署指南](https://vitepress.dev/guide/deploy)
- [Vercel 官方文档](https://vercel.com/docs)

## 资料说明

网站是升学准备资料库，不是院校招生承诺。费用、日期、招生规模和就业统计均须按原报告中的届别和口径阅读，报名时以对应年度官方通知为准。
