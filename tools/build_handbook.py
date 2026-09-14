#!/usr/bin/env python3
"""Compile data/raw_tweets.json + analysis/ into public/data/handbook.json.

Does not modify data/raw_tweets.json. Re-run after append-only imports.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

from volume_map import LOOP, UNASSIGNED_VOLUME, VOLUMES

ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "data" / "raw_tweets.json"
PROFILE_PATH = ROOT / "data" / "profile.json"
ANALYSIS_DIR = ROOT / "analysis" / "articles"
ANALYSIS_INDEX = ROOT / "analysis" / "articles_index.json"
OUT_JSON = ROOT / "public" / "data" / "handbook.json"
OUT_MD = ROOT / "public" / "data" / "handbook.md"

HEADER_NOISE = re.compile(
    r"^(▲\s*点击上方.*$|点击上方.*关注我\s*$)",
    re.MULTILINE,
)
SENT_SPLIT = re.compile(r"(?<=[。！？!?\n])")
TAKEAWAY_HINT = re.compile(
    r"(本质|核心|关键|必须|记住|原则|不是.{0,12}而是|千万|永远|筛子|年化|保证金|尾部|活得久|DYOR)"
)


def to_int(value) -> int:
    if value is None or value == "":
        return 0
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, (int, float)):
        return int(value)
    s = str(value).replace(",", "").replace(" ", "").strip()
    m = re.match(r"^(\d+)", s)
    return int(m.group(1)) if m else 0


def to_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {"1", "true", "yes", "y"}


def clean_text(text: str) -> str:
    if not text:
        return ""
    t = text.replace("\r\n", "\n").replace("\r", "\n")
    t = HEADER_NOISE.sub("", t)
    t = re.sub(r"\n{3,}", "\n\n", t).strip()
    return t


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def load_analyses() -> dict[str, dict]:
    out: dict[str, dict] = {}
    if ANALYSIS_INDEX.exists():
        for row in load_json(ANALYSIS_INDEX):
            if isinstance(row, dict) and row.get("id"):
                out[str(row["id"])] = row
    if ANALYSIS_DIR.exists():
        for p in ANALYSIS_DIR.glob("*.parsed.json"):
            row = load_json(p)
            if isinstance(row, dict) and row.get("id"):
                out[str(row["id"])] = row
        for p in ANALYSIS_DIR.glob("*.json"):
            if p.name.endswith(".parsed.json"):
                continue
            raw = load_json(p)
            if isinstance(raw, dict) and "content" in raw and isinstance(raw["content"], str):
                try:
                    inner = json.loads(raw["content"])
                except json.JSONDecodeError:
                    continue
                if isinstance(inner, dict) and inner.get("id"):
                    out.setdefault(str(inner["id"]), inner)
    return out


def normalize_item(raw: dict) -> dict:
    media = raw.get("media_urls") or []
    if isinstance(media, str):
        media = [media] if media else []
    kind = raw.get("kind") or "post"
    title = (raw.get("title") or "").strip()
    text = clean_text(raw.get("text") or "")
    preview = (raw.get("preview_text") or "").strip()
    if not preview:
        preview = re.sub(r"\s+", " ", text)[:180]
    return {
        "id": str(raw.get("id")),
        "kind": kind,
        "date": raw.get("date") or "",
        "title": title,
        "text": text,
        "preview": preview,
        "url": raw.get("url") or f"https://x.com/Amy6Tina/status/{raw.get('id')}",
        "likes": to_int(raw.get("likes")),
        "retweets": to_int(raw.get("retweets")),
        "replies": to_int(raw.get("replies")),
        "views": to_int(raw.get("views")),
        "has_media": to_bool(raw.get("has_media")) or bool(media),
        "media_urls": [m for m in media if m],
        "source": raw.get("source") or "",
        "article_id": str(raw.get("article_id") or "") if raw.get("article_id") else None,
    }


def extract_takeaways(text: str, limit: int = 4) -> list[str]:
    chunks = [c.strip() for c in SENT_SPLIT.split(text) if c and c.strip()]
    scored = []
    for c in chunks:
        c = re.sub(r"\s+", " ", c).strip(" -\n")
        if len(c) < 12 or len(c) > 160:
            continue
        if c.startswith("http") or c.startswith("▲"):
            continue
        score = 2 if TAKEAWAY_HINT.search(c) else 0
        if c.endswith(("。", "！", "？")):
            score += 1
        if score:
            scored.append((score, c))
    scored.sort(key=lambda x: -x[0])
    seen = set()
    out = []
    for _, c in scored:
        if c in seen:
            continue
        seen.add(c)
        out.append(c)
        if len(out) >= limit:
            return out
    if out:
        return out
    paras = [p.strip() for p in text.split("\n") if len(p.strip()) >= 20]
    return [re.sub(r"\s+", " ", p)[:140] for p in paras[:limit]]


def extract_lede(text: str, max_chars: int = 720) -> str:
    paras = []
    for p in text.split("\n"):
        p = p.strip()
        if not p or p.startswith("http") or p.startswith("▲"):
            continue
        if re.fullmatch(r"[-—=_]{3,}", p):
            continue
        paras.append(p)
        blob = "\n\n".join(paras)
        if len(blob) >= max_chars:
            return blob[: max_chars + 80].rsplit("。", 1)[0] + "。" if "。" in blob[: max_chars + 80] else blob[:max_chars]
    return "\n\n".join(paras)[:max_chars]


def reading_minutes(text: str) -> int:
    n = max(len(text), 1)
    return max(3, min(25, round(n / 420)))


def haystack(item: dict) -> str:
    return f"{item.get('title') or ''} {item.get('text') or ''}"


def attach_posts(posts: list[dict], keywords: list[str], used: set[str]) -> list[dict]:
    if not keywords:
        return []
    keys = [k.lower() for k in keywords]
    picked = []
    for p in posts:
        if p["id"] in used:
            continue
        h = haystack(p).lower()
        if any(k.lower() in h for k in keys):
            picked.append(p)
            used.add(p["id"])
    picked.sort(key=lambda x: (x["likes"] + x["views"] // 1000, x["date"]), reverse=True)
    return picked


def build_topic_analysis(items: list[dict], analyses: dict[str, dict]) -> dict:
    takeaways: list[str] = []
    quotes: list[str] = []
    strategies: list[str] = []
    tags: list[str] = []
    deepdive_parts: list[dict] = []
    llm_ids = []
    for it in items:
        if it["kind"] != "article":
            continue
        a = analyses.get(it["id"])
        if a:
            llm_ids.append(it["id"])
            for k in a.get("key_takeaways") or []:
                if k and k not in takeaways:
                    takeaways.append(k)
            for q in a.get("quotes") or []:
                if q and q not in quotes:
                    quotes.append(q)
            for s in a.get("strategies") or []:
                if s and s not in strategies:
                    strategies.append(s)
            for t in a.get("topics") or []:
                if t and t not in tags:
                    tags.append(t)
            summary = (a.get("summary") or "").strip()
            if summary:
                deepdive_parts.append(
                    {
                        "title": it.get("title") or "",
                        "body": summary,
                        "source": "llm",
                    }
                )
        else:
            extracted = extract_takeaways(it["text"])
            for k in extracted:
                if k not in takeaways:
                    takeaways.append(k)
            lede = extract_lede(it["text"])
            if lede:
                deepdive_parts.append(
                    {
                        "title": it.get("title") or "",
                        "body": lede,
                        "source": "excerpt",
                    }
                )
    if not takeaways:
        blob = "\n".join(it["text"] for it in items if it.get("text"))
        takeaways = extract_takeaways(blob)
    return {
        "takeaways": takeaways[:8],
        "quotes": quotes[:6],
        "strategies": strategies[:8],
        "tags": tags[:10],
        "deepdive": deepdive_parts,
        "has_llm": bool(llm_ids),
        "llm_article_ids": llm_ids,
    }


def write_markdown(handbook: dict) -> str:
    lines = [
        f"# {handbook['meta']['title']}",
        "",
        handbook["meta"]["subtitle"],
        "",
        f"- Articles：{handbook['meta']['counts']['articles']}",
        f"- Posts：{handbook['meta']['counts']['posts']}",
        f"- Volumes：{handbook['meta']['counts']['volumes']}",
        f"- Topics：{handbook['meta']['counts']['topics']}",
        "",
        "> 非投资建议，请自行研究（DYOR）。原文版权归 @Amy6Tina 所有。",
        "",
    ]
    for vol in handbook["volumes"]:
        lines += [
            f"## VOLUME {vol['num']} · {vol['title']}",
            "",
            vol["desc"],
            "",
        ]
        for topic in vol["topics"]:
            lines += [f"### TOPIC {topic['num']} {topic['title']}", ""]
            if topic.get("takeaways"):
                lines.append("**Key Takeaways**")
                lines.append("")
                for t in topic["takeaways"]:
                    lines.append(f"- {t}")
                lines.append("")
            for item in topic["items"]:
                kind = "Article" if item["kind"] == "article" else "Post"
                title = item.get("title") or (item["preview"][:40] + "…")
                lines += [
                    f"#### {kind} · {item['date'][:10]} · {title}",
                    "",
                    item["text"],
                    "",
                    f"[原文链接]({item['url']})",
                    "",
                ]
    return "\n".join(lines)


def main() -> None:
    raw = load_json(RAW_PATH)
    profile = load_json(PROFILE_PATH) if PROFILE_PATH.exists() else {}
    analyses = load_analyses()

    items = [normalize_item(x) for x in raw]
    by_id = {it["id"]: it for it in items}
    articles = [it for it in items if it["kind"] == "article"]
    posts = [it for it in items if it["kind"] == "post"]
    articles.sort(key=lambda x: x["date"], reverse=True)
    posts.sort(key=lambda x: x["date"], reverse=True)

    used_articles: set[str] = set()
    used_posts: set[str] = set()
    volumes_out = []

    for vol in VOLUMES:
        topics_out = []
        for topic in vol["topics"]:
            topic_items = []
            for aid in topic.get("article_ids") or []:
                it = by_id.get(str(aid))
                if not it:
                    continue
                topic_items.append(it)
                used_articles.add(it["id"])
            related_posts = attach_posts(posts, topic.get("post_keywords") or [], used_posts)
            topic_items.extend(related_posts)
            if not topic_items:
                continue
            analysis = build_topic_analysis(topic_items, analyses)
            minutes = sum(reading_minutes(it["text"]) for it in topic_items if it["kind"] == "article")
            if minutes == 0:
                minutes = max(3, sum(reading_minutes(it["text"]) for it in topic_items) // 2)
            topics_out.append(
                {
                    "id": topic["id"],
                    "num": topic["num"],
                    "title": topic["title"],
                    "minutes": minutes,
                    "article_count": sum(1 for it in topic_items if it["kind"] == "article"),
                    "post_count": sum(1 for it in topic_items if it["kind"] == "post"),
                    **analysis,
                    "items": topic_items,
                }
            )
        if not topics_out:
            continue
        volumes_out.append(
            {
                "id": vol["id"],
                "num": vol["num"],
                "title": vol["title"],
                "subtitle": vol["subtitle"],
                "desc": vol["desc"],
                "topic_count": len(topics_out),
                "item_count": sum(len(t["items"]) for t in topics_out),
                "topics": topics_out,
            }
        )

    leftover_articles = [a for a in articles if a["id"] not in used_articles]
    leftover_posts = [p for p in posts if p["id"] not in used_posts]
    if leftover_posts:
        notes_items = leftover_posts
        analysis = build_topic_analysis(notes_items, analyses)
        vol6 = next((v for v in volumes_out if v["id"] == "vol-06"), None)
        notes_topic = {
            "id": "t-06-99",
            "num": f"{(len(vol6['topics']) + 1) if vol6 else 6:02d}",
            "title": "其余推文札记（未命中关键词）",
            "minutes": 8,
            "article_count": 0,
            "post_count": len(notes_items),
            **analysis,
            "items": notes_items,
        }
        if vol6:
            vol6["topics"].append(notes_topic)
            vol6["topic_count"] = len(vol6["topics"])
            vol6["item_count"] = sum(len(t["items"]) for t in vol6["topics"])
            used_posts.update(p["id"] for p in leftover_posts)
            leftover_posts = []
    if leftover_articles or leftover_posts:
        leftover_items = leftover_articles + leftover_posts
        analysis = build_topic_analysis(leftover_items, analyses)
        volumes_out.append(
            {
                "id": UNASSIGNED_VOLUME["id"],
                "num": UNASSIGNED_VOLUME["num"],
                "title": UNASSIGNED_VOLUME["title"],
                "subtitle": UNASSIGNED_VOLUME["subtitle"],
                "desc": UNASSIGNED_VOLUME["desc"],
                "topic_count": 1,
                "item_count": len(leftover_items),
                "topics": [
                    {
                        "id": "t-99-01",
                        "num": "01",
                        "title": "尚未编入正卷的原文卡片",
                        "minutes": max(5, sum(reading_minutes(it["text"]) for it in leftover_articles) or 8),
                        "article_count": len(leftover_articles),
                        "post_count": len(leftover_posts),
                        **analysis,
                        "items": leftover_items,
                    }
                ],
            }
        )

    topic_count = sum(len(v["topics"]) for v in volumes_out)
    media_count = sum(len(it["media_urls"]) for it in items)

    handbook = {
        "meta": {
            "title": "期权坤哥实战手册",
            "brand": "Amy6Tina-Handbook",
            "subtitle": "Sober CFA（@Amy6Tina）推文与 Articles 体系化精解",
            "hero_pills": ["开源实战专著 · 典藏版", "100% 站内免跳阅览", f"{len(items)} 篇原文全量嵌入"],
            "description": (
                "在多数人眼里，期权是方向赌博的杠杆；在期权坤哥（Sober CFA）的框架里，"
                "它是保证金管道、波动率溢价与仓位纪律组成的手艺。"
                f"本手册整理仓库内 {len(articles)} 篇 Articles 与 {len(posts)} 条 Posts，"
                f"编为 {len(volumes_out)} 卷、{topic_count} 个课题，全文嵌入、无需跳转 X。"
                "非投资建议，请自行研究（DYOR）。"
            ),
            "site_url": "https://zaviichen.github.io/Amy6Tina-Handbook/",
            "repo_url": "https://github.com/zaviichen/Amy6Tina-Handbook",
            "x_url": "https://x.com/Amy6Tina",
            "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "author": {
                "name": profile.get("name") or "期权坤哥 | Sober CFA",
                "handle": f"@{profile.get('screen_name') or 'Amy6Tina'}",
                "screen_name": profile.get("screen_name") or "Amy6Tina",
                "description": (profile.get("description") or "").strip(),
                "followers": to_int(profile.get("followers")),
                "tweets": to_int(profile.get("tweets")),
                "website": (profile.get("website") or {}).get("url") or "https://sober-club.com",
                "verified": bool((profile.get("verified") or {}).get("verified")),
            },
            "counts": {
                "articles": len(articles),
                "posts": len(posts),
                "corpus": len(items),
                "volumes": len(volumes_out),
                "topics": topic_count,
                "media": media_count,
                "llm_analyzed": len(analyses),
            },
        },
        "loop": LOOP,
        "volumes": volumes_out,
        "corpus": items,
    }

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(
        json.dumps(handbook, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    OUT_MD.write_text(write_markdown(handbook), encoding="utf-8")

    assigned_a = sum(1 for a in articles if a["id"] in used_articles)
    print(
        f"handbook.json -> {OUT_JSON.relative_to(ROOT)} "
        f"({OUT_JSON.stat().st_size:,} bytes)"
    )
    print(
        f"articles {len(articles)} (assigned {assigned_a}, leftover {len(leftover_articles)}) | "
        f"posts {len(posts)} (attached {len(used_posts)}, leftover {len(leftover_posts)})"
    )
    print(
        f"volumes {len(volumes_out)} | topics {topic_count} | "
        f"llm {len(analyses)} | md {OUT_MD.stat().st_size:,} bytes"
    )
    if leftover_articles:
        print("unassigned articles:")
        for a in leftover_articles:
            print(f"  {a['id']} {a.get('title')}")


if __name__ == "__main__":
    main()
