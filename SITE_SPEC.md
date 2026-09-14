# Amy6Tina Handbook — GitHub Pages 站点规格

目标：对标 https://suoha888.github.io/CJ-DeFi-Handbook/ 的单页/静态手册站，**全文中文**，部署到用户 GitHub → GitHub Pages。

## 品牌与标题
- 标题：期权坤哥实战手册 · Amy6Tina-Handbook
- 副标题：Sober CFA（@Amy6Tina）推文与 Articles 体系化精解
- 数据源：本仓库 `data/raw_tweets.json` + `analysis/`（站内免跳，嵌入原文）

## 页面结构（仿 CJ）
1. Hero：开源实战专著徽章、全量篇数、站内免跳阅览
2. 决策闭环 / 核心数字（Articles 数、Posts 数、Volumes、Topics）
3. 分卷导航（VOLUME 01…N）— 每卷含：
   - 卷名与导读
   - 若干 TOPIC：Key Takeaways、机制推演、嵌入原文卡片（日期/互动/全文）
4. 全量知识库全文检索（客户端搜索 raw JSON）
5. 致敬与免责声明

## 技术
- 纯静态：Vite + 单页，或纯 HTML/JS（优先可 GitHub Pages 直接托管）
- `base` 适配 `https://<user>.github.io/<repo>/`
- 构建产物进 `docs/` 或 `gh-pages` / Actions deploy
- 全部 UI 文案中文；原文保持作者原文（多为中文）

## 数据管线
1. 完成下载 → `data/raw_tweets.json`（不重下已有 id）
2. LLM 解析 → `analysis/` 分卷归类 + takeaways
3. 站点生成脚本把 analysis + raw 编成可检索 JSON 供前端加载

## 仓库
- 建议名：`Amy6Tina-Handbook`（或用户指定）
- README 中文说明如何本地构建与 Pages 设置
