"""Reproducible, cached Wikimedia cookbook collection; no credentials required."""
import pathlib, urllib.request, urllib.parse, json, time, hashlib

import argparse
parser=argparse.ArgumentParser()
parser.add_argument('--cache-dir',type=pathlib.Path,required=True)
arguments=parser.parse_args()
ROOT = arguments.cache_dir.resolve()
ROOT.mkdir(parents=True,exist_ok=True)
CACHE = ROOT / 'wikimedia-cache'
CACHE.mkdir(exist_ok=True)
UA = 'GrocysteCatalog/1.0 (https://github.com/Raph563/Grocyste; licensed cookbook snapshot)'

def query(host, parameters):
    params = dict(action='query', format='json', formatversion=2, maxlag=5, **parameters)
    url = 'https://' + host + '/w/api.php?' + urllib.parse.urlencode(params)
    file = CACHE / (hashlib.sha256(url.encode()).hexdigest() + '.json')
    if file.exists():
        return json.loads(file.read_text(encoding='utf-8'))
    for attempt in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=45) as response:
                data = json.loads(response.read(12 * 1024 * 1024))
            if 'error' in data:
                raise ValueError(data['error'].get('code'))
            file.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
            time.sleep(0.25)
            return data
        except Exception:
            if attempt == 4:
                raise
            time.sleep(2 * (attempt + 1))

def collect(host, language):
    pages, continuation = [], {}
    base = dict(list='categorymembers', cmtitle='Category:Recipes', cmlimit=500, cmtype='page') if language == 'en' else dict(list='allpages', apprefix='Livre de cuisine/', aplimit=500, apfilterredir='nonredirects')
    while True:
        result = query(host, {**base, **continuation})
        pages.extend(result['query']['categorymembers' if language == 'en' else 'allpages'])
        if 'continue' not in result:
            break
        continuation = result['continue']
    # Keep book pages, never users' personal pages or talks.
    pages = [p for p in pages if p['title'].startswith('Cookbook:' if language == 'en' else 'Livre de cuisine/')]
    print(json.dumps({'language': language, 'discovered': len(pages)}), flush=True)
    records = []
    for offset in range(0, len(pages), 50):
        batch = pages[offset:offset+50]
        result = query(host, dict(prop='revisions', pageids='|'.join(str(p['pageid']) for p in batch), rvprop='ids|timestamp|content', rvslots='main'))
        for page in result['query']['pages']:
            if page.get('revisions'):
                records.append(dict(language=language, host=host, **page))
        if offset % 500 == 0:
            print(json.dumps({'language': language, 'collected': len(records)}), flush=True)
    file = ROOT / ('wikibooks-' + language + '.json')
    file.write_text(json.dumps(records, ensure_ascii=False), encoding='utf-8')
    print(json.dumps({'language': language, 'completed': len(records)}), flush=True)

if __name__ == '__main__':
    for host, language in [('fr.wikibooks.org', 'fr'), ('en.wikibooks.org', 'en')]:
        collect(host, language)
