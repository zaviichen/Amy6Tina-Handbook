#!/usr/bin/env python3
"""Call DeepSeek OpenAI-compatible chat API. Default model: deepseek-flash."""
from __future__ import annotations
import argparse, json, os, sys, urllib.request
from pathlib import Path

DEFAULT_MODEL = "deepseek-flash"
BASE = "https://api.deepseek.com"

def load_key() -> str:
    env = os.environ.get("DEEPSEEK_API_KEY")
    if env:
        return env
    for p in (
        Path("/home/box/sand-data/box-secrets.json"),
        Path("/home/box/agent-data/box-secrets.json"),
    ):
        if p.exists():
            data = json.loads(p.read_text())
            key = (data.get("card") or {}).get("DEEPSEEK_API_KEY")
            if key:
                return key
    raise SystemExit("DEEPSEEK_API_KEY not found")

def chat(messages, model=DEFAULT_MODEL, temperature=0.2, max_tokens=4096) -> str:
    body = json.dumps({
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }).encode()
    req = urllib.request.Request(
        f"{BASE}/chat/completions",
        data=body,
        headers={
            "Authorization": f"Bearer {load_key()}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        data = json.loads(r.read().decode())
    return data["choices"][0]["message"]["content"]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default=DEFAULT_MODEL)
    ap.add_argument("--system", default="")
    ap.add_argument("--prompt", default="")
    ap.add_argument("--file", help="user prompt file")
    ap.add_argument("--json-out")
    ap.add_argument("--temperature", type=float, default=0.2)
    ap.add_argument("--max-tokens", type=int, default=4096)
    args = ap.parse_args()
    user = Path(args.file).read_text() if args.file else args.prompt
    if not user:
        ap.error("need --prompt or --file")
    messages = []
    if args.system:
        messages.append({"role": "system", "content": args.system})
    messages.append({"role": "user", "content": user})
    text = chat(messages, model=args.model, temperature=args.temperature, max_tokens=args.max_tokens)
    if args.json_out:
        Path(args.json_out).write_text(json.dumps({"model": args.model, "content": text}, ensure_ascii=False, indent=2))
    sys.stdout.write(text)
    if not text.endswith("\n"):
        sys.stdout.write("\n")

if __name__ == "__main__":
    main()
