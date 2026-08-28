#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Télécharge la base complète EA FC (drop-api) → build-cache/ea.json.

Endpoint public non documenté qui alimente ea.com/games/ea-sports-fc/ratings.
locale=fr : nationalités et postes déjà en français.
User-Agent navigateur obligatoire (Cloudflare), pause entre les pages.
"""
import json, os, sys, time, urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'build-cache', 'ea.json')
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126.0 Safari/537.36')
BASE = 'https://drop-api.ea.com/rating/ea-sports-fc?locale=fr&limit=100&offset=%d'


def page(offset, tries=3):
    req = urllib.request.Request(BASE % offset, headers={'User-Agent': UA, 'Accept': 'application/json'})
    for k in range(tries):
        try:
            return json.load(urllib.request.urlopen(req, timeout=30))
        except Exception as e:
            if k == tries - 1:
                raise
            print('  retry offset %d (%s)' % (offset, e), flush=True)
            time.sleep(3)


def main():
    items, offset, total = [], 0, None
    while total is None or offset < total:
        d = page(offset)
        total = d.get('totalItems', 0)
        items.extend(d.get('items', []))
        offset += 100
        if offset % 2000 == 0:
            print('%d / %d' % (min(offset, total), total), flush=True)
        time.sleep(0.5)
    # On ne garde que l'essentiel (le JSON brut avec les playerAbilities pèse des dizaines de Mo)
    slim = []
    for p in items:
        slim.append({
            'id': p.get('id'),
            'note': p.get('overallRating'),
            'firstName': p.get('firstName'), 'lastName': p.get('lastName'),
            'commonName': p.get('commonName'),
            'birthdate': p.get('birthdate'),
            'league': p.get('leagueName'),
            'gender': (p.get('gender') or {}).get('id'),
            'nation': (p.get('nationality') or {}).get('label'),
            'nationId': (p.get('nationality') or {}).get('id'),
            'team': (p.get('team') or {}).get('label'),
            'posId': (p.get('position') or {}).get('id'),
            'pos': (p.get('position') or {}).get('label'),
        })
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(slim, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False)
    print('OK — %d joueurs (total annoncé %s) → %s' % (len(slim), total, OUT), flush=True)


if __name__ == '__main__':
    main()
