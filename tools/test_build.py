#!/usr/bin/env python3
"""Smoke-check compiled handbook.json against the raw corpus."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = json.loads((ROOT / "data" / "raw_tweets.json").read_text(encoding="utf-8"))
HB = json.loads((ROOT / "public" / "data" / "handbook.json").read_text(encoding="utf-8"))


def fail(msg: str) -> None:
    print(f"FAIL: {msg}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    raw_ids = {str(x["id"]) for x in RAW}
    corpus_ids = {str(x["id"]) for x in HB["corpus"]}
    if raw_ids != corpus_ids:
        fail(f"corpus mismatch extra={corpus_ids - raw_ids} missing={raw_ids - corpus_ids}")

    nested = []
    for vol in HB["volumes"]:
        for topic in vol["topics"]:
            for it in topic["items"]:
                nested.append(it["id"])
                if not (it.get("text") or "").strip():
                    fail(f"empty text {it['id']}")
    nested_set = set(nested)
    if nested_set != raw_ids:
        fail(f"volume coverage missing={raw_ids - nested_set} extra={nested_set - raw_ids}")

    kinds = {x.get("kind") for x in RAW}
    if kinds != {"article", "post"}:
        fail(f"unexpected kinds {kinds}")

    meta = HB["meta"]
    for key in ("articles", "posts", "volumes", "topics"):
        if meta["counts"][key] <= 0:
            fail(f"count {key} is {meta['counts'][key]}")
    if meta["counts"]["volumes"] < 3:
        fail("need several volumes")
    if "期权坤哥" not in meta["title"]:
        fail("Chinese title missing")

    print(
        "OK",
        f"items={len(raw_ids)}",
        f"volumes={meta['counts']['volumes']}",
        f"topics={meta['counts']['topics']}",
        f"articles={meta['counts']['articles']}",
        f"posts={meta['counts']['posts']}",
    )


if __name__ == "__main__":
    main()
