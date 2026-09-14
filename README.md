# 期权坤哥实战手册 · Amy6Tina-Handbook

面向 [期权坤哥 | Sober CFA（@Amy6Tina）](https://x.com/Amy6Tina) 的 Articles / 推文体系化精解，风格对标 [CJ-DeFi-Handbook](https://suoha888.github.io/CJ-DeFi-Handbook/)。

**在线阅读（GitHub Pages）**：[https://zaviichen.github.io/Amy6Tina-Handbook/](https://zaviichen.github.io/Amy6Tina-Handbook/)

- **数据**：`data/raw_tweets.json`（已下载 id 请勿重复抓取，只允许按 id 追加）
- **分析**：`analysis/`（已有的 LLM 精读会编入 Key Takeaways / 机制推演）
- **规格**：`SITE_SPEC.md`
- **分卷启发式**：`tools/volume_map.py`（以语料实测为准，`analysis/volume_sketch.md` 仅作假设）

## 站点里有什么

- 中文 UI：开源实战专著徽章、全量篇数、站内免跳阅览
- 数字条：Articles / Posts / Volumes / Topics
- 七卷课题：Key Takeaways、机制推演或原文导读、嵌入原文卡片（日期 / 互动 / 全文）
- 客户端全文检索（加载 `public/data/handbook.json`）
- 致敬与免责声明（**非投资建议，请 DYOR**）

作者原文保持原样，页面文案为中文。尚无 LLM 精读的篇目仍按关键词归入对应卷，并嵌入 `raw_tweets.json` 全文。

## 本地构建

需要 Node 18+ 与 Python 3.10+。

```bash
# 1) 从语料生成站点 JSON / Markdown
python3 tools/build_handbook.py

# 2) 安装前端依赖并开发预览
npm install
npm run dev
# 浏览器打开终端提示的本地地址（Vite 默认 http://localhost:5173/Amy6Tina-Handbook/）
```

生产构建：

```bash
npm run build
npm run preview
```

产物在 `dist/`。GitHub Pages 的 `base` 为 `/Amy6Tina-Handbook/`，本地 preview 使用同一路径。

单独重新编数据（不启动开发服务器）：

```bash
npm run data
```

## GitHub Pages 设置

本仓库使用 GitHub Actions（`.github/workflows/pages.yml`）在推送到 `main` 后构建并发布。

1. 打开仓库 **Settings → Pages**
2. **Source** 选择 **GitHub Actions**
3. 合并到 `main` 或在 Actions 里手动运行 **Deploy GitHub Pages**
4. 等待 workflow 变绿后访问  
   https://zaviichen.github.io/Amy6Tina-Handbook/

若 Pages 尚未开启，具有仓库管理权限的协作者完成上述第 1–2 步即可。站点不会改写 `data/raw_tweets.json`。

## 数据管线（追加，不重下）

导入新帖时必须跳过 `data/raw_tweets.json` 与 `data/downloaded_ids.txt` 中已有的 id。详见 `README_DATA.md`。

新 id 入库后执行 `python3 tools/build_handbook.py`：脚本按 `tools/volume_map.py` 的明确 id 与关键词把条目编入卷次；未命中的 Articles 进入「未分卷精读」，未命中的 Posts 并入卷六札记。

## 免责声明

非投资建议，请自行研究（DYOR）。内容由公开推文 / Articles 整理，版权归原作者。
