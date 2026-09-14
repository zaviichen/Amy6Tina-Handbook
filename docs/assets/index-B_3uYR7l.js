(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const c of document.querySelectorAll('link[rel="modulepreload"]'))r(c);new MutationObserver(c=>{for(const n of c)if(n.type==="childList")for(const v of n.addedNodes)v.tagName==="LINK"&&v.rel==="modulepreload"&&r(v)}).observe(document,{childList:!0,subtree:!0});function a(c){const n={};return c.integrity&&(n.integrity=c.integrity),c.referrerPolicy&&(n.referrerPolicy=c.referrerPolicy),c.crossOrigin==="use-credentials"?n.credentials="include":c.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function r(c){if(c.ep)return;c.ep=!0;const n=a(c);fetch(c.href,n)}})();const k="/Amy6Tina-Handbook/",w=`${k}data/handbook.json`,y=`${k}avatar.jpg`,L=`${k}data/handbook.md`,u=(t,s=document)=>s.querySelector(t);function e(t){return String(t??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function g(t){return(Number(t)||0).toLocaleString("zh-CN")}function E(t){if(!t)return"";const s=new Date(t);if(Number.isNaN(s.getTime()))return e(t.slice(0,16).replace("T"," "));const a=r=>String(r).padStart(2,"0");return`${s.getFullYear()}-${a(s.getMonth()+1)}-${a(s.getDate())} ${a(s.getHours())}:${a(s.getMinutes())}`}function f(t){const s=u("#toast");s.textContent=t,s.classList.add("show"),clearTimeout(f._t),f._t=setTimeout(()=>s.classList.remove("show"),1800)}function T(t){navigator.clipboard.writeText(t).then(()=>f("已复制到剪贴板"),()=>f("复制失败，请手动选择"))}function x(t,s){const a=e(t);if(!s)return a;const r=e(s);if(!r)return a;const c=new RegExp(r.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"gi");return a.replace(c,n=>`<mark class="search-hit">${n}</mark>`)}function j(t){return t==="article"?"长文 Article":"推文 Post"}function S(t,s){return`<div class="${s?"tw-card-body collapsed":"tw-card-body"}">${e(t)}</div>`}function _(t){return t!=null&&t.length?`<div class="tw-media ${t.length===1?"count-1":t.length===2?"count-2":"count-n"}">${t.map(a=>`<img src="${e(a)}" alt="原文配图" loading="lazy" data-full="${e(a)}" onerror="this.parentNode.style.display='none'" />`).join("")}</div>`:""}function A(t,s,a={}){const r=(t.text||"").length>720,c=r&&!a.expanded,n=t.title?`<div class="tw-title">${a.q?x(t.title,a.q):e(t.title)}</div>`:"",v=a.q?`<div class="tw-card-body">${x(t.text,a.q)}</div>`:S(t.text,c),h=r&&!a.q?`<button type="button" class="btn-expand" data-expand="${e(t.id)}">展开全文 · 站内免跳阅览</button>`:"";return`
    <article class="tweet-card" id="item-${e(t.id)}" data-item-id="${e(t.id)}">
      <div class="tw-card-top">
        <div class="tw-author">
          <img class="tw-avatar-img" src="${y}" alt="${e(s.name)}" />
          <div>
            <div class="tw-name-line">
              <span class="tw-author-name">${e(s.name)}</span>
              ${s.verified?'<span class="tw-badge-gold">认证</span>':""}
            </div>
            <div class="tw-author-handle">${e(s.handle)}</div>
            <div class="tw-date-line">
              <span>📅 ${e(E(t.date))}</span>
              <span class="tw-source-pill">${e(j(t.kind))}</span>
            </div>
          </div>
        </div>
        <div class="tw-btn-group">
          <button type="button" class="btn-tw-action" data-copy="${e(t.text)}">复制原文</button>
          <a class="btn-tw-action" href="${e(t.url)}" target="_blank" rel="noopener noreferrer">X 原帖</a>
        </div>
      </div>
      ${n}
      ${v}
      ${h}
      ${_(t.media_urls)}
      <div class="tw-card-bottom">
        <div class="tw-stats-cluster">
          <span>❤ ${g(t.likes)}</span>
          <span>↻ ${g(t.retweets)}</span>
          <span>💬 ${g(t.replies)}</span>
          <span>▶ ${g(t.views)}</span>
        </div>
        <span class="tw-id-tag">#${e(t.id)}</span>
      </div>
    </article>`}function q(t,s,a){const r=(t.takeaways||[]).map(o=>`<li><span class="pt-icon">🔑</span><span>${e(o)}</span></li>`).join(""),c=t.has_llm?'<span class="takeaways-source">含 LLM 精读样本</span>':'<span class="takeaways-source">要点摘自原文关键句，非另行改写</span>',n=(t.deepdive||[]).map(o=>{const i=o.source==="llm"?"机制推演（精读摘要）":"原文导读（节选，未改写）";return`<div>
        <div class="dd-block-title">${e(o.title?`${i} · ${o.title}`:i)}</div>
        <div class="dd-p">${e(o.body)}</div>
      </div>`}).join(""),v=(t.quotes||[]).map(o=>`<div class="quote-row">「${e(o)}」</div>`).join(""),h=(t.strategies||[]).map(o=>`<span class="strategy-chip">${e(o)}</span>`).join(""),l=(t.items||[]).map(o=>A(o,a)).join("");return`
    <section class="topic-card" id="${e(t.id)}">
      <header class="topic-header">
        <div class="topic-meta-row">
          <span class="topic-tag-num">TOPIC ${e(t.num)}</span>
          <span class="topic-tag-vol">第 ${e(s.num)} 卷核心精讲</span>
          <span class="topic-tag-time">⏱️ 研读约 ${e(t.minutes)} 分钟</span>
          <span class="topic-tag-count">📝 嵌入原文 ${e(t.article_count)} 篇长文 · ${e(t.post_count)} 条推文</span>
        </div>
        <h3 class="topic-title">${e(t.title)}</h3>
        ${h?`<div class="strategy-row">${h}</div>`:""}
      </header>
      ${r?`<div class="takeaways-box">
              <div class="takeaways-title">本章实战精髓与心智法则 (Key Takeaways) ${c}</div>
              <ul class="takeaways-list">${r}</ul>
            </div>`:""}
      ${n?`<div class="deepdive-box">
              <div class="deepdive-header">
                <span class="dd-badge">深度</span>
                <div class="dd-title">底层机制推演与交易实操解析</div>
              </div>
              <div class="deepdive-body">${n}${v}</div>
            </div>`:""}
      <div class="case-tweets-wrap">
        <div class="case-tweets-header">
          <div class="ct-heading"><span class="ct-dot"></span> 期权坤哥原文精读 · 站内免跳阅览</div>
          <div class="ct-tip">日期 / 互动 / 全文均已嵌入，无需跳转 X</div>
        </div>
        <div class="case-tweets-list">${l}</div>
      </div>
    </section>`}function C(t,s,a){const r=t.topics.map(c=>q(c,t,s)).join("");return`
    <section class="volume-section" id="${e(t.id)}">
      <div class="volume-banner">
        <div class="vol-banner-pre">VOLUME ${e(t.num)} / ${String(a).padStart(2,"0")}</div>
        <h2 class="vol-banner-title">${e(t.title)}</h2>
        <p class="vol-banner-desc">${e(t.desc)}</p>
        <div class="vol-banner-meta">包含 ${e(t.topic_count)} 个实战核心课题 • 嵌入 ${e(t.item_count)} 条原文卡片</div>
      </div>
      ${r}
    </section>`}function M(t){const{meta:s,loop:a,volumes:r,corpus:c}=t,n=s.author,v=(s.hero_pills||[]).map((i,d)=>`<span class="hero-pill ${d===1?"hero-pill-green":"hero-pill-gold"}">${e(i)}</span>`).join(""),h=(a||[]).map(i=>`<div class="flow-node">
        <div class="flow-step-num">STEP ${e(i.step)}</div>
        <div class="flow-step-name">${e(i.name)}</div>
        <div class="flow-step-detail">${e(i.detail)}</div>
      </div>`).join(""),l=r.map((i,d)=>{const b=i.topics.map(m=>`<a class="nav-topic-link" href="#${e(m.id)}">
            <span class="nav-topic-num">${e(m.num)}</span>
            <span class="nav-topic-title">${e(m.title)}</span>
          </a>`).join("");return`<div class="nav-vol-group${d===0?"":" collapsed"}" data-vol="${e(i.id)}">
        <div class="nav-vol-header">
          <span class="nav-vol-badge">VOL ${e(i.num)}</span>
          <a class="nav-vol-title" href="#${e(i.id)}">${e(i.title.split("·")[0].trim())}</a>
          <span class="nav-vol-arrow">▾</span>
        </div>
        <div class="nav-vol-sublist">${b}</div>
      </div>`}).join(""),o=r.map(i=>C(i,n,r.length)).join("");return`
    <div class="mobile-bar">
      <strong>期权坤哥实战手册</strong>
      <button type="button" class="btn-menu" data-toggle-nav>目录</button>
    </div>
    <div class="layout">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-profile">
          <div class="profile-main-row">
            <div class="profile-avatar-wrap">
              <img class="profile-avatar-img" src="${y}" alt="${e(n.name)}" />
              <span class="profile-badge-auth">✓</span>
            </div>
            <div>
              <div class="profile-name">${e(n.name)}</div>
              <div class="profile-handle">${e(n.handle)}</div>
            </div>
          </div>
          <div class="profile-tagline">Sober CFA · 全球华人期权精英俱乐部 · 原文版权归作者</div>
          <div class="profile-stats-row">
            <span>关注者 <strong>${g(n.followers)}</strong></span>
            <span>推文 <strong>${g(n.tweets)}</strong></span>
          </div>
        </div>
        <div class="sidebar-search-box">
          <div class="search-input-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>
            <input class="sidebar-search-input" type="search" placeholder="筛选目录，回车则全文检索…" data-nav-search />
          </div>
        </div>
        <nav class="sidebar-nav" id="sidebar-nav">${l}
          <a class="nav-topic-link" href="#archive" style="margin-top:8px">🔎 全量知识库检索</a>
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-curator-note">开源手册 · <a href="${e(s.repo_url)}" target="_blank" rel="noopener">GitHub</a></div>
          <a class="btn-sidebar-action btn-download-full" href="${L}" download="Amy6Tina-Handbook.md">下载全文 Markdown</a>
          <button type="button" class="btn-sidebar-action btn-back-top" data-top>回到顶部</button>
        </div>
      </aside>
      <main class="main">
        <header class="hero-banner">
          <div class="hero-meta-row">${v}</div>
          <a class="hero-author-badge" href="${e(s.x_url)}" target="_blank" rel="noopener">
            <img class="hero-author-avatar" src="${y}" alt="" />
            <span class="hero-author-text">${e(n.name)}</span>
            <span class="hero-author-sub">${e(n.handle)}</span>
          </a>
          <h1 class="hero-title">期权坤哥实战手册 · Amy6Tina-Handbook</h1>
          <p class="hero-subtitle">${e(s.subtitle)}</p>
          <p class="hero-desc">${e(s.description)}</p>
          <div class="method-flow-wrap">
            <div class="flow-title">期权坤哥实战决策闭环 · 五步硬核筛法</div>
            <div class="flow-grid">${h}</div>
          </div>
          <div class="hero-stats-grid">
            <div class="hero-stat-card"><div class="hstat-num">${e(s.counts.articles)}</div><div class="hstat-label">Articles 长文</div></div>
            <div class="hero-stat-card"><div class="hstat-num">${e(s.counts.posts)}</div><div class="hstat-label">Posts 推文</div></div>
            <div class="hero-stat-card"><div class="hstat-num">${e(s.counts.volumes)}</div><div class="hstat-label">Volumes 实战篇章</div></div>
            <div class="hero-stat-card"><div class="hstat-num">${e(s.counts.topics)}</div><div class="hstat-label">Topics 硬核课题</div></div>
          </div>
        </header>
        ${o}
        <section class="archive-search-section" id="archive">
          <div class="archive-badge">CORPUS SEARCH</div>
          <h2 class="archive-title">全手册 ${e(s.counts.corpus)} 条原文知识库全文检索</h2>
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
              <a class="dc-btn" href="${L}" download="Amy6Tina-Handbook.md">下载 .md</a>
            </div>
            <div class="download-card">
              <div class="dc-title">检索用 JSON</div>
              <div class="dc-desc">前端加载的 handbook.json，含分卷结构与语料。</div>
              <a class="dc-btn" href="${w}" download="handbook.json">下载 .json</a>
            </div>
          </div>
        </section>
        <section class="epilogue-box" id="epilogue">
          <h2 class="epilogue-title">致敬与免责声明</h2>
          <div class="epilogue-content">
            本手册由开源仓库 <a href="${e(s.repo_url)}">${e(s.brand)}</a> 整理，体系化呈现
            <a href="${e(s.x_url)}" target="_blank" rel="noopener">${e(n.name)}（${e(n.handle)}）</a>
            已公开发布的 Articles 与 Posts。页面 UI 为中文；作者原文保持原样嵌入，不作投资结论改写。
            页面风格致敬 <a href="https://suoha888.github.io/CJ-DeFi-Handbook/" target="_blank" rel="noopener">CJ-DeFi-Handbook</a>。
            <br /><br />
            <strong>以上内容不是投资建议。</strong>期权与衍生品有本金亏损乃至超过本金的风险。请自行研究（DYOR），独立判断，为你自己的仓位负责。版权归原作者；若需转载或商用请联系原作者。
          </div>
          <div class="epilogue-closing">非投资建议 · 请 DYOR · 版权归 @Amy6Tina 所有</div>
        </section>
      </main>
    </div>
  `}function O(t){var v,h;document.querySelectorAll(".nav-vol-header").forEach(l=>{l.addEventListener("click",o=>{o.target.closest("a")||l.parentElement.classList.toggle("collapsed")})}),(v=u("[data-top]"))==null||v.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"})),(h=u("[data-toggle-nav]"))==null||h.addEventListener("click",()=>{var l;return(l=u("#sidebar"))==null?void 0:l.classList.toggle("open")}),document.querySelectorAll(".sidebar a[href^='#']").forEach(l=>{l.addEventListener("click",()=>{var o;window.matchMedia("(max-width: 960px)").matches&&((o=u("#sidebar"))==null||o.classList.remove("open"))})});const s=l=>{var i;const o=u("[data-archive-q]");o&&(l!=null&&(o.value=l),o.dispatchEvent(new Event("input")),(i=document.getElementById("archive"))==null||i.scrollIntoView({behavior:"smooth",block:"start"}))},a=u("[data-nav-search]");a==null||a.addEventListener("input",()=>{const l=a.value.trim().toLowerCase();document.querySelectorAll(".nav-vol-group").forEach(o=>{const i=o.textContent.toLowerCase(),d=!l||i.includes(l);o.style.display=d?"":"none",l&&d&&o.classList.remove("collapsed")})}),a==null||a.addEventListener("keydown",l=>{var o;l.key==="Enter"&&(l.preventDefault(),s(a.value),(o=u("#sidebar"))==null||o.classList.remove("open"))});const r=[...document.querySelectorAll(".topic-card")],c=[...document.querySelectorAll(".nav-topic-link")],n=new IntersectionObserver(l=>{const o=l.filter(i=>i.isIntersecting).sort((i,d)=>d.intersectionRatio-i.intersectionRatio)[0];o&&c.forEach(i=>i.classList.toggle("active",i.getAttribute("href")===`#${o.target.id}`))},{rootMargin:"-20% 0px -70% 0px",threshold:[0,.2,.6]});r.forEach(l=>n.observe(l))}function N(){var t,s;document.body.addEventListener("click",a=>{const r=a.target.closest("[data-copy]");if(r){T(r.getAttribute("data-copy")||"");return}const c=a.target.closest("[data-expand]");if(c){const v=c.closest(".tweet-card"),h=v==null?void 0:v.querySelector(".tw-card-body");h&&(h.classList.remove("collapsed"),c.remove());return}const n=a.target.closest(".tw-media img");if(n){const v=u("#lightbox");u("#lightbox-img").src=n.getAttribute("data-full")||n.src,v.hidden=!1,v.classList.add("active")}}),(t=u("#lightbox .lightbox-close"))==null||t.addEventListener("click",$),(s=u("#lightbox"))==null||s.addEventListener("click",a=>{a.target.id==="lightbox"&&$()}),document.addEventListener("keydown",a=>{a.key==="Escape"&&$()})}function $(){const t=u("#lightbox");t.classList.remove("active"),t.hidden=!0}function H(t){const s=u("[data-archive-q]"),a=u("[data-archive-grid]"),r=u("[data-archive-info]"),c=u("[data-load-more]");let n="all",v=8;const h=t.corpus||[],l=(i,d)=>{if(!d)return i.date;const b=`${i.title||""} ${i.text||""}`.toLowerCase();if(!b.includes(d))return-1;let p=0;return(i.title||"").toLowerCase().includes(d)&&(p+=50),p+=(b.split(d).length-1)*3,p+=Math.min(20,(i.likes||0)/10),p},o=()=>{const i=((s==null?void 0:s.value)||"").trim().toLowerCase();let d=h.filter(p=>n==="all"?!0:p.kind===n);i?(d=d.map(p=>({it:p,s:l(p,i)})).filter(p=>p.s>=0),d.sort((p,m)=>m.s-p.s),d=d.map(p=>p.it)):d=[...d].sort((p,m)=>(m.date||"").localeCompare(p.date||""));const b=d.slice(0,v);r.textContent=i?`共匹配 ${d.length} 条（当前展示 ${b.length}）`:`语料 ${d.length} 条 · 当前展示最近 ${b.length} 条`,a.innerHTML=b.map(p=>A(p,t.meta.author,{q:i,expanded:!!i})).join("")||'<p class="archive-desc">没有找到包含该关键词的原文。</p>',c.hidden=b.length>=d.length,c.onclick=()=>{v+=8,o()}};s==null||s.addEventListener("input",()=>{v=8,o()}),document.querySelectorAll("[data-kind]").forEach(i=>{i.addEventListener("click",()=>{document.querySelectorAll("[data-kind]").forEach(d=>d.classList.remove("active")),i.classList.add("active"),n=i.getAttribute("data-kind"),v=8,o()})}),o()}async function P(){const t=u("#app");try{const s=await fetch(w);if(!s.ok)throw new Error(`无法加载 ${w}`);const a=await s.json();document.title=`${a.meta.title} · ${a.meta.brand}`,t.innerHTML=M(a),O(a),N(),H(a)}catch(s){t.innerHTML=`<div class="boot">手册数据加载失败：${e(s.message)}</div>`}}P();
