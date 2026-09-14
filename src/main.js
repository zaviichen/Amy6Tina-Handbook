import "./style.css";

const BASE = import.meta.env.BASE_URL || "/";
const DATA_URL = `${BASE}data/handbook.json`;
const AVATAR = `${BASE}avatar.jpg`;
const MD_URL = `${BASE}data/handbook.md`;

const $ = (sel, root = document) => root.querySelector(sel);

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fmtNum(n) {
  const x = Number(n) || 0;
  return x.toLocaleString("zh-CN");
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return esc(iso.slice(0, 16).replace("T", " "));
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 1800);
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(
    () => toast("已复制到剪贴板"),
    () => toast("复制失败，请手动选择"),
  );
}

function highlight(text, q) {
  const src = esc(text);
  if (!q) return src;
  const needle = esc(q);
  if (!needle) return src;
  const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  return src.replace(re, (m) => `<mark class="search-hit">${m}</mark>`);
}

function kindLabel(kind) {
  return kind === "article" ? "长文 Article" : "推文 Post";
}

function renderTweetBody(text, collapsed) {
  const cls = collapsed ? "tw-card-body collapsed" : "tw-card-body";
  return `<div class="${cls}">${esc(text)}</div>`;
}

function renderMedia(urls) {
  if (!urls?.length) return "";
  const cls = urls.length === 1 ? "count-1" : urls.length === 2 ? "count-2" : "count-n";
  return `<div class="tw-media ${cls}">${urls
    .map(
      (u) =>
        `<img src="${esc(u)}" alt="原文配图" loading="lazy" data-full="${esc(u)}" onerror="this.parentNode.style.display='none'" />`,
    )
    .join("")}</div>`;
}

function renderCard(item, author, opts = {}) {
  const long = (item.text || "").length > 720;
  const collapsed = long && !opts.expanded;
  const title = item.title
    ? `<div class="tw-title">${opts.q ? highlight(item.title, opts.q) : esc(item.title)}</div>`
    : "";
  const body = opts.q
    ? `<div class="tw-card-body">${highlight(item.text, opts.q)}</div>`
    : renderTweetBody(item.text, collapsed);
  const expand = long && !opts.q
    ? `<button type="button" class="btn-expand" data-expand="${esc(item.id)}">展开全文 · 站内免跳阅览</button>`
    : "";
  return `
    <article class="tweet-card" id="item-${esc(item.id)}" data-item-id="${esc(item.id)}">
      <div class="tw-card-top">
        <div class="tw-author">
          <img class="tw-avatar-img" src="${AVATAR}" alt="${esc(author.name)}" />
          <div>
            <div class="tw-name-line">
              <span class="tw-author-name">${esc(author.name)}</span>
              ${author.verified ? `<span class="tw-badge-gold">认证</span>` : ""}
            </div>
            <div class="tw-author-handle">${esc(author.handle)}</div>
            <div class="tw-date-line">
              <span>📅 ${esc(fmtDate(item.date))}</span>
              <span class="tw-source-pill">${esc(kindLabel(item.kind))}</span>
            </div>
          </div>
        </div>
        <div class="tw-btn-group">
          <button type="button" class="btn-tw-action" data-copy="${esc(item.text)}">复制原文</button>
          <a class="btn-tw-action" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">X 原帖</a>
        </div>
      </div>
      ${title}
      ${body}
      ${expand}
      ${renderMedia(item.media_urls)}
      <div class="tw-card-bottom">
        <div class="tw-stats-cluster">
          <span>❤ ${fmtNum(item.likes)}</span>
          <span>↻ ${fmtNum(item.retweets)}</span>
          <span>💬 ${fmtNum(item.replies)}</span>
          <span>▶ ${fmtNum(item.views)}</span>
        </div>
        <span class="tw-id-tag">#${esc(item.id)}</span>
      </div>
    </article>`;
}

function renderTopic(topic, vol, author) {
  const takeaways = (topic.takeaways || [])
    .map((t) => `<li><span class="pt-icon">🔑</span><span>${esc(t)}</span></li>`)
    .join("");
  const srcNote = topic.has_llm
    ? `<span class="takeaways-source">含 LLM 精读样本</span>`
    : `<span class="takeaways-source">要点摘自原文关键句，非另行改写</span>`;
  const deepdive = (topic.deepdive || [])
    .map((d) => {
      const label = d.source === "llm" ? "机制推演（精读摘要）" : "原文导读（节选，未改写）";
      return `<div>
        <div class="dd-block-title">${esc(d.title ? `${label} · ${d.title}` : label)}</div>
        <div class="dd-p">${esc(d.body)}</div>
      </div>`;
    })
    .join("");
  const quotes = (topic.quotes || [])
    .map((q) => `<div class="quote-row">「${esc(q)}」</div>`)
    .join("");
  const chips = (topic.strategies || [])
    .map((s) => `<span class="strategy-chip">${esc(s)}</span>`)
    .join("");
  const items = (topic.items || []).map((it) => renderCard(it, author)).join("");
  return `
    <section class="topic-card" id="${esc(topic.id)}">
      <header class="topic-header">
        <div class="topic-meta-row">
          <span class="topic-tag-num">TOPIC ${esc(topic.num)}</span>
          <span class="topic-tag-vol">第 ${esc(vol.num)} 卷核心精讲</span>
          <span class="topic-tag-time">⏱️ 研读约 ${esc(topic.minutes)} 分钟</span>
          <span class="topic-tag-count">📝 嵌入原文 ${esc(topic.article_count)} 篇长文 · ${esc(topic.post_count)} 条推文</span>
        </div>
        <h3 class="topic-title">${esc(topic.title)}</h3>
        ${chips ? `<div class="strategy-row">${chips}</div>` : ""}
      </header>
      ${
        takeaways
          ? `<div class="takeaways-box">
              <div class="takeaways-title">本章实战精髓与心智法则 (Key Takeaways) ${srcNote}</div>
              <ul class="takeaways-list">${takeaways}</ul>
            </div>`
          : ""
      }
      ${
        deepdive
          ? `<div class="deepdive-box">
              <div class="deepdive-header">
                <span class="dd-badge">深度</span>
                <div class="dd-title">底层机制推演与交易实操解析</div>
              </div>
              <div class="deepdive-body">${deepdive}${quotes}</div>
            </div>`
          : ""
      }
      <div class="case-tweets-wrap">
        <div class="case-tweets-header">
          <div class="ct-heading"><span class="ct-dot"></span> 期权坤哥原文精读 · 站内免跳阅览</div>
          <div class="ct-tip">日期 / 互动 / 全文均已嵌入，无需跳转 X</div>
        </div>
        <div class="case-tweets-list">${items}</div>
      </div>
    </section>`;
}

function renderVolume(vol, author, totalVols) {
  const topics = vol.topics.map((t) => renderTopic(t, vol, author)).join("");
  return `
    <section class="volume-section" id="${esc(vol.id)}">
      <div class="volume-banner">
        <div class="vol-banner-pre">VOLUME ${esc(vol.num)} / ${String(totalVols).padStart(2, "0")}</div>
        <h2 class="vol-banner-title">${esc(vol.title)}</h2>
        <p class="vol-banner-desc">${esc(vol.desc)}</p>
        <div class="vol-banner-meta">包含 ${esc(vol.topic_count)} 个实战核心课题 • 嵌入 ${esc(vol.item_count)} 条原文卡片</div>
      </div>
      ${topics}
    </section>`;
}

function renderApp(data) {
  const { meta, loop, volumes, corpus } = data;
  const author = meta.author;
  const pills = (meta.hero_pills || [])
    .map((p, i) => `<span class="hero-pill ${i === 1 ? "hero-pill-green" : "hero-pill-gold"}">${esc(p)}</span>`)
    .join("");
  const flow = (loop || [])
    .map(
      (s) => `<div class="flow-node">
        <div class="flow-step-num">STEP ${esc(s.step)}</div>
        <div class="flow-step-name">${esc(s.name)}</div>
        <div class="flow-step-detail">${esc(s.detail)}</div>
      </div>`,
    )
    .join("");
  const nav = volumes
    .map((v) => {
      const links = v.topics
        .map(
          (t) => `<a class="nav-topic-link" href="#${esc(t.id)}">
            <span class="nav-topic-num">${esc(t.num)}</span>
            <span class="nav-topic-title">${esc(t.title)}</span>
          </a>`,
        )
        .join("");
      return `<div class="nav-vol-group" data-vol="${esc(v.id)}">
        <div class="nav-vol-header">
          <span class="nav-vol-badge">VOL ${esc(v.num)}</span>
          <a class="nav-vol-title" href="#${esc(v.id)}">${esc(v.title.split("·")[0].trim())}</a>
          <span class="nav-vol-arrow">▾</span>
        </div>
        <div class="nav-vol-sublist">${links}</div>
      </div>`;
    })
    .join("");

  const volHtml = volumes.map((v) => renderVolume(v, author, volumes.length)).join("");

  return `
    <div class="mobile-bar">
      <strong>期权坤哥实战手册</strong>
      <button type="button" class="btn-menu" data-toggle-nav>目录</button>
    </div>
    <div class="layout">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-profile">
          <div class="profile-main-row">
            <div class="profile-avatar-wrap">
              <img class="profile-avatar-img" src="${AVATAR}" alt="${esc(author.name)}" />
              <span class="profile-badge-auth">✓</span>
            </div>
            <div>
              <div class="profile-name">${esc(author.name)}</div>
              <div class="profile-handle">${esc(author.handle)}</div>
            </div>
          </div>
          <div class="profile-tagline">Sober CFA · 全球华人期权精英俱乐部 · 原文版权归作者</div>
          <div class="profile-stats-row">
            <span>关注者 <strong>${fmtNum(author.followers)}</strong></span>
            <span>推文 <strong>${fmtNum(author.tweets)}</strong></span>
          </div>
        </div>
        <div class="sidebar-search-box">
          <div class="search-input-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>
            <input class="sidebar-search-input" type="search" placeholder="筛选目录，回车则全文检索…" data-nav-search />
          </div>
        </div>
        <nav class="sidebar-nav" id="sidebar-nav">${nav}
          <a class="nav-topic-link" href="#archive" style="margin-top:8px">🔎 全量知识库检索</a>
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-curator-note">开源手册 · <a href="${esc(meta.repo_url)}" target="_blank" rel="noopener">GitHub</a></div>
          <a class="btn-sidebar-action btn-download-full" href="${MD_URL}" download="Amy6Tina-Handbook.md">下载全文 Markdown</a>
          <button type="button" class="btn-sidebar-action btn-back-top" data-top>回到顶部</button>
        </div>
      </aside>
      <main class="main">
        <header class="hero-banner">
          <div class="hero-meta-row">${pills}</div>
          <a class="hero-author-badge" href="${esc(meta.x_url)}" target="_blank" rel="noopener">
            <img class="hero-author-avatar" src="${AVATAR}" alt="" />
            <span class="hero-author-text">${esc(author.name)}</span>
            <span class="hero-author-sub">${esc(author.handle)}</span>
          </a>
          <h1 class="hero-title">期权坤哥实战手册 · Amy6Tina-Handbook</h1>
          <p class="hero-subtitle">${esc(meta.subtitle)}</p>
          <p class="hero-desc">${esc(meta.description)}</p>
          <div class="method-flow-wrap">
            <div class="flow-title">期权坤哥卖方决策闭环 · 五步硬核筛法</div>
            <div class="flow-grid">${flow}</div>
          </div>
          <div class="hero-stats-grid">
            <div class="hero-stat-card"><div class="hstat-num">${esc(meta.counts.articles)}</div><div class="hstat-label">Articles 长文</div></div>
            <div class="hero-stat-card"><div class="hstat-num">${esc(meta.counts.posts)}</div><div class="hstat-label">Posts 推文</div></div>
            <div class="hero-stat-card"><div class="hstat-num">${esc(meta.counts.volumes)}</div><div class="hstat-label">Volumes 实战篇章</div></div>
            <div class="hero-stat-card"><div class="hstat-num">${esc(meta.counts.topics)}</div><div class="hstat-label">Topics 硬核课题</div></div>
          </div>
        </header>
        ${volHtml}
        <section class="archive-search-section" id="archive">
          <div class="archive-badge">CORPUS SEARCH</div>
          <h2 class="archive-title">全手册 ${esc(meta.counts.corpus)} 条原文知识库全文检索</h2>
          <p class="archive-desc">无需打开 X。下方引擎已本地内嵌全部 Articles 与 Posts（含标题、正文、互动数据），支持任意关键词秒级检索。</p>
          <input class="archive-search-input" type="search" placeholder="输入关键词，例如：IV Rank、保证金、LEAPS、VIX、末日轮…" data-archive-q />
          <div class="archive-filter-pills">
            <button type="button" class="filter-pill active" data-kind="all">全部</button>
            <button type="button" class="filter-pill" data-kind="article">仅 Articles</button>
            <button type="button" class="filter-pill" data-kind="post">仅 Posts</button>
          </div>
          <div class="archive-results-info" data-archive-info>默认展示最近原文。输入关键词后按相关度筛选。</div>
          <div class="archive-grid" data-archive-grid></div>
          <button type="button" class="btn-load-more" data-load-more hidden>加载更多</button>
        </section>
        <section class="download-center">
          <h2 class="archive-title" style="font-size:22px">下载与数据</h2>
          <p class="archive-desc">适合本地 Obsidian / Notion 导入，或作为后续 LLM 精读语料。不覆盖 <code>data/raw_tweets.json</code>。</p>
          <div class="download-cards-grid">
            <div class="download-card">
              <div class="dc-title">实战手册 Markdown</div>
              <div class="dc-desc">按卷导出的全文，含 Key Takeaways 与嵌入原文。</div>
              <a class="dc-btn" href="${MD_URL}" download="Amy6Tina-Handbook.md">下载 .md</a>
            </div>
            <div class="download-card">
              <div class="dc-title">检索用 JSON</div>
              <div class="dc-desc">前端加载的 handbook.json，含分卷结构与语料。</div>
              <a class="dc-btn" href="${DATA_URL}" download="handbook.json">下载 .json</a>
            </div>
          </div>
        </section>
        <section class="epilogue-box" id="epilogue">
          <h2 class="epilogue-title">致敬与免责声明</h2>
          <div class="epilogue-content">
            本手册由开源仓库 <a href="${esc(meta.repo_url)}">${esc(meta.brand)}</a> 整理，体系化呈现
            <a href="${esc(meta.x_url)}" target="_blank" rel="noopener">${esc(author.name)}（${esc(author.handle)}）</a>
            已公开发布的 Articles 与 Posts。页面 UI 为中文；作者原文保持原样嵌入，不作投资结论改写。
            页面风格致敬 <a href="https://suoha888.github.io/CJ-DeFi-Handbook/" target="_blank" rel="noopener">CJ-DeFi-Handbook</a>。
            <br /><br />
            <strong>以上内容不是投资建议。</strong>期权与衍生品有本金亏损乃至超过本金的风险。请自行研究（DYOR），独立判断，为你自己的仓位负责。版权归原作者；若需转载或商用请联系原作者。
          </div>
          <div class="epilogue-closing">非投资建议 · 请 DYOR · 版权归 @Amy6Tina 所有</div>
        </section>
      </main>
    </div>
  `;
}

function bindNav(data) {
  document.querySelectorAll(".nav-vol-header").forEach((h) => {
    h.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      h.parentElement.classList.toggle("collapsed");
    });
  });
  $("[data-top]")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  $("[data-toggle-nav]")?.addEventListener("click", () => $("#sidebar")?.classList.toggle("open"));
  document.querySelectorAll(".sidebar a[href^='#']").forEach((a) => {
    a.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 960px)").matches) {
        $("#sidebar")?.classList.remove("open");
      }
    });
  });

  const jumpArchive = (q) => {
    const archiveQ = $("[data-archive-q]");
    if (!archiveQ) return;
    if (q != null) archiveQ.value = q;
    archiveQ.dispatchEvent(new Event("input"));
    document.getElementById("archive")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const navSearch = $("[data-nav-search]");
  navSearch?.addEventListener("input", () => {
    const q = navSearch.value.trim().toLowerCase();
    document.querySelectorAll(".nav-vol-group").forEach((g) => {
      const text = g.textContent.toLowerCase();
      const hit = !q || text.includes(q);
      g.style.display = hit ? "" : "none";
      if (q && hit) g.classList.remove("collapsed");
    });
  });
  navSearch?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      jumpArchive(navSearch.value);
      $("#sidebar")?.classList.remove("open");
    }
  });

  const topics = [...document.querySelectorAll(".topic-card")];
  const links = [...document.querySelectorAll(".nav-topic-link")];
  const io = new IntersectionObserver(
    (entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!vis) return;
      links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${vis.target.id}`));
    },
    { rootMargin: "-20% 0px -70% 0px", threshold: [0, 0.2, 0.6] },
  );
  topics.forEach((t) => io.observe(t));
}

function bindCards() {
  document.body.addEventListener("click", (e) => {
    const copyBtn = e.target.closest("[data-copy]");
    if (copyBtn) {
      copyText(copyBtn.getAttribute("data-copy") || "");
      return;
    }
    const exp = e.target.closest("[data-expand]");
    if (exp) {
      const card = exp.closest(".tweet-card");
      const body = card?.querySelector(".tw-card-body");
      if (body) {
        body.classList.remove("collapsed");
        exp.remove();
      }
      return;
    }
    const img = e.target.closest(".tw-media img");
    if (img) {
      const modal = $("#lightbox");
      $("#lightbox-img").src = img.getAttribute("data-full") || img.src;
      modal.hidden = false;
      modal.classList.add("active");
    }
  });
  $("#lightbox .lightbox-close")?.addEventListener("click", closeLb);
  $("#lightbox")?.addEventListener("click", (e) => {
    if (e.target.id === "lightbox") closeLb();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLb();
  });
}

function closeLb() {
  const modal = $("#lightbox");
  modal.classList.remove("active");
  modal.hidden = true;
}

function bindSearch(data) {
  const input = $("[data-archive-q]");
  const grid = $("[data-archive-grid]");
  const info = $("[data-archive-info]");
  const more = $("[data-load-more]");
  let kind = "all";
  let shown = 8;
  const corpus = data.corpus || [];

  const score = (item, q) => {
    if (!q) return item.date;
    const hay = `${item.title || ""} ${item.text || ""}`.toLowerCase();
    if (!hay.includes(q)) return -1;
    let s = 0;
    if ((item.title || "").toLowerCase().includes(q)) s += 50;
    s += (hay.split(q).length - 1) * 3;
    s += Math.min(20, (item.likes || 0) / 10);
    return s;
  };

  const paint = () => {
    const q = (input?.value || "").trim().toLowerCase();
    let rows = corpus.filter((it) => (kind === "all" ? true : it.kind === kind));
    if (q) {
      rows = rows.map((it) => ({ it, s: score(it, q) })).filter((x) => x.s >= 0);
      rows.sort((a, b) => b.s - a.s);
      rows = rows.map((x) => x.it);
    } else {
      rows = [...rows].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    }
    const slice = rows.slice(0, shown);
    info.textContent = q
      ? `共匹配 ${rows.length} 条（当前展示 ${slice.length}）`
      : `语料 ${rows.length} 条 · 当前展示最近 ${slice.length} 条`;
    grid.innerHTML = slice.map((it) => renderCard(it, data.meta.author, { q, expanded: Boolean(q) })).join("")
      || `<p class="archive-desc">没有找到包含该关键词的原文。</p>`;
    more.hidden = slice.length >= rows.length;
    more.onclick = () => {
      shown += 8;
      paint();
    };
  };

  input?.addEventListener("input", () => {
    shown = 8;
    paint();
  });
  document.querySelectorAll("[data-kind]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-kind]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      kind = btn.getAttribute("data-kind");
      shown = 8;
      paint();
    });
  });
  paint();
}

async function main() {
  const app = $("#app");
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`无法加载 ${DATA_URL}`);
    const data = await res.json();
    document.title = `${data.meta.title} · ${data.meta.brand}`;
    app.innerHTML = renderApp(data);
    bindNav(data);
    bindCards();
    bindSearch(data);
  } catch (err) {
    app.innerHTML = `<div class="boot">手册数据加载失败：${esc(err.message)}</div>`;
  }
}

main();
