#!/usr/bin/env python3
"""Import @Amy6Tina X Articles by status id via api.fxtwitter.com (full body in article.content.blocks)."""
from __future__ import annotations
import argparse, json, time, urllib.request
from pathlib import Path

ROOT = Path('/workspace/amy6tina-handbook/data')

def fetch_tweet(status_id: str):
    url = f'https://api.fxtwitter.com/Amy6Tina/status/{status_id}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=45) as r:
        return json.load(r)['tweet']

def article_to_record(tw: dict) -> dict:
    art = tw.get('article') or {}
    if not art:
        raise ValueError('not an article tweet')
    blocks = ((art.get('content') or {}).get('blocks') or [])
    text = '\n'.join(b.get('text', '') for b in blocks if b.get('text') is not None)
    media_urls = []
    seen = set()
    def add(u):
        if u and u not in seen:
            seen.add(u); media_urls.append(u)
    for m in art.get('media_entities') or []:
        if not isinstance(m, dict):
            continue
        for k in ('media_url_https', 'url', 'preview_image_url'):
            add(m.get(k))
        mi = m.get('media_info') or {}
        if isinstance(mi, dict):
            add(mi.get('original_img_url') or mi.get('url'))
    cover = art.get('cover_media') or {}
    mi = cover.get('media_info') or {}
    if isinstance(mi, dict):
        add(mi.get('original_img_url') or mi.get('url'))
    return {
        'id': str(tw.get('id') or tw.get('id_str')),
        'date': art.get('created_at') or tw.get('created_at'),
        'title': (art.get('title') or '').strip(),
        'text': text.strip(),
        'url': tw.get('url') or f"https://x.com/Amy6Tina/status/{tw.get('id')}",
        'likes': tw.get('likes') or 0,
        'retweets': tw.get('retweets') or 0,
        'replies': tw.get('replies') or 0,
        'views': tw.get('views') or 0,
        'has_media': bool(media_urls),
        'media_count': len(media_urls),
        'media_urls': media_urls,
        'tags': [],
        'kind': 'article',
        'preview_text': art.get('preview_text'),
        'article_id': art.get('id'),
        'source': 'fxtwitter',
    }

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('ids', nargs='*', help='status ids')
    ap.add_argument('--ids-file')
    ap.add_argument('--sleep', type=float, default=0.4)
    args = ap.parse_args()
    ids = list(args.ids)
    if args.ids_file:
        ids.extend([ln.strip() for ln in Path(args.ids_file).read_text().splitlines() if ln.strip()])
    raw_path = ROOT / 'raw_tweets.json'
    raw = json.loads(raw_path.read_text()) if raw_path.exists() else []
    by_id = {str(t['id']): i for i, t in enumerate(raw)}
    cat_path = ROOT / 'articles_catalog.json'
    cat = json.loads(cat_path.read_text()) if cat_path.exists() else []
    cat_ids = {str(x['id']) for x in cat}
    ok = fail = 0
    # skip already downloaded
    existing = set(by_id)
    ids = [sid for sid in ids if str(sid) not in existing]
    print('to_fetch', len(ids), 'skipped_existing', len(existing))
    for sid in ids:
        try:
            tw = fetch_tweet(sid)
            if not tw.get('article'):
                print('skip_not_article', sid)
                fail += 1
                continue
            rec = article_to_record(tw)
            if rec['id'] in by_id:
                raw[by_id[rec['id']]] = rec
            else:
                by_id[rec['id']] = len(raw)
                raw.append(rec)
            if rec['id'] not in cat_ids:
                cat.append({'id': rec['id'], 'url': rec['url'], 'title': rec['title'], 'date': rec['date']})
                cat_ids.add(rec['id'])
            ok += 1
            print('ok', rec['id'], rec['title'][:40], 'chars', len(rec['text']))
        except Exception as e:
            fail += 1
            print('fail', sid, type(e).__name__, e)
        time.sleep(args.sleep)
        if ok and ok % 5 == 0:
            raw_path.write_text(json.dumps(raw, ensure_ascii=False, indent=2))
            cat_path.write_text(json.dumps(cat, ensure_ascii=False, indent=2))
    raw_path.write_text(json.dumps(raw, ensure_ascii=False, indent=2))
    cat_path.write_text(json.dumps(cat, ensure_ascii=False, indent=2))
    arts = sum(1 for t in raw if t.get('kind') == 'article')
    (ROOT / 'downloaded_ids.txt').write_text('\n'.join(sorted(str(t['id']) for t in raw)) + '\n')
    print(json.dumps({'ok': ok, 'fail': fail, 'article_count': arts, 'catalog': len(cat)}, ensure_ascii=False))

if __name__ == '__main__':
    main()
