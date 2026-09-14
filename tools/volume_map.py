"""Handbook volume helpers.

Canonical article assignment lives in analysis/volumes.json (11 卷, 全量 Articles).
This module only keeps UI loop copy, post-attach keywords, and fallbacks for
articles that land in raw_tweets.json before they are added to volumes.json.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VOLUMES_PATH = ROOT / "analysis" / "volumes.json"

LOOP = [
    {"step": "01", "name": "立因果", "detail": "先分清 Timing 与结构，再谈方向"},
    {"step": "02", "name": "筛边缘", "detail": "IV Rank / VRP / 接货意愿，卖方只接好保单"},
    {"step": "03", "name": "选尺子", "detail": "VIX、0DTE、一日波动，用对的尺度定价"},
    {"step": "04", "name": "上盔甲", "detail": "保证金管道、对冲盔甲、尾部凸性"},
    {"step": "05", "name": "找错价", "detail": "套利、贴水、跨市场——赚市场犯错的钱"},
]

UNASSIGNED_VOLUME = {
    "id": "vol-99",
    "num": "99",
    "title": "未分卷精读 · 等待归类的原文",
    "subtitle": "尚未写入 analysis/volumes.json 的新篇",
    "desc": "新导入、主题交叉或分卷表未收录的篇目暂放于此。全文已嵌入，可检索；重新生成站点前把它编入 analysis/volumes.json 即可归正卷。",
}

# Volume-level keywords for leftover posts / future articles.
VOLUME_KEYWORDS = {
    "vol-01": ["买方", "Timing", "学期权", "期权书", "电影", "小白", "养成计划", "不该出手"],
    "vol-02": ["卖 Put", "卖Put", "Sell Put", "轮式", "备兑", "现金担保", "接货", "IV Rank", "权利金"],
    "vol-03": ["VIX", "ETP", "SVXY", "UVIX", "晴雨表", "波动率", "多空策略"],
    "vol-04": ["0DTE", "末日轮", "Gamma", "Theta", "铁鹰", "VIX1D"],
    "vol-05": ["LEAPS", "替代正股", "零成本", "ZEBRA", "深度实值", "佩洛西"],
    "vol-06": ["做空", "崩盘险", "尾部", "伯里", "英伟达", "对冲", "看涨期权"],
    "vol-07": ["保证金", "上交所", "鸭站", "Deribit", "deribit", "GEX", "做市", "港交所", "ETF期权"],
    "vol-08": ["套利", "贴水", "平价", "捡硬币", "量化"],
    "vol-09": ["段永平", "巴菲特", "13F", "伯克希尔", "BRK", "宇树"],
    "vol-10": ["财务自由", "一人企业", "绝望之谷", "基本功", "俱乐部", "学员", "指标", "焦虑"],
    "vol-11": ["本周市场", "下周市场", "美债", "TLT", "大选", "特斯拉", "黄金"],
}

NOTES_VOLUME_ID = "vol-10"


def normalize_vol_id(raw_id: str, index: int) -> str:
    m = re.search(r"(\d+)", str(raw_id) or "")
    n = int(m.group(1)) if m else index + 1
    return f"vol-{n:02d}"


def load_volume_plan() -> list[dict]:
    """Return volume dicts with id/num/title/desc/article_ids from analysis/volumes.json."""
    if not VOLUMES_PATH.exists():
        return []
    rows = json.loads(VOLUMES_PATH.read_text(encoding="utf-8"))
    out = []
    for i, row in enumerate(rows):
        vid = normalize_vol_id(row.get("id") or "", i)
        num = vid.split("-")[-1]
        out.append(
            {
                "id": vid,
                "num": num,
                "title": row.get("title") or f"第 {num} 卷",
                "subtitle": "",
                "desc": row.get("description") or "",
                "article_ids": [str(x) for x in (row.get("article_ids") or [])],
            }
        )
    return out
