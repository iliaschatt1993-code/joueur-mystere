#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Générateur de data.js pour Le Joueur Mystère.

Source : football-data.org v4 (clé FOOTBALL_DATA_API_KEY dans le .env racine).
Une requête par ligue (effectifs inclus), cache disque dans build-cache/.

Deux niveaux de joueurs :
  tier 1 = les « stars » (base curée historique, build-cache/curated.json)
           → seul vivier des mystères (jour, marathon, duel) ;
  tier 2 = tout le reste des effectifs → uniquement devinables.
Les stars dont la ligue n'est pas couverte par l'API (Saudi, MLS, Pro League,
Süper Lig, ARG) sont conservées telles quelles.

Usage : python3 build_data.py [--offline]   (--offline = cache uniquement)
"""
import json, os, re, sys, time, unicodedata, urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(ROOT, 'build-cache')
ENV = os.path.join(ROOT, '..', '..', '.env')

LEAGUES = [  # (code API, nom affiché)
    ('PL',  'Premier League'),
    ('PD',  'La Liga'),
    ('SA',  'Serie A'),
    ('BL1', 'Bundesliga'),
    ('FL1', 'Ligue 1'),
    ('DED', 'Eredivisie'),
    ('PPL', 'Liga Portugal'),
    ('BSA', 'Brasileirão'),
]
COVERED = {name for _, name in LEAGUES}

# ── Nations : nom API (anglais, minuscules) → (nom FR, code drapeau, confédération)
# Code drapeau : ISO alpha-2, ou GB-ENG/GB-SCT/GB-WLS pour les nations britanniques.
N = {
    'england': ('Angleterre', 'GB-ENG', 'UEFA'), 'scotland': ('Écosse', 'GB-SCT', 'UEFA'),
    'wales': ('Pays de Galles', 'GB-WLS', 'UEFA'), 'northern ireland': ('Irlande du Nord', 'GB', 'UEFA'),
    'ireland': ('Irlande', 'IE', 'UEFA'), 'republic of ireland': ('Irlande', 'IE', 'UEFA'),
    'france': ('France', 'FR', 'UEFA'), 'spain': ('Espagne', 'ES', 'UEFA'),
    'germany': ('Allemagne', 'DE', 'UEFA'), 'italy': ('Italie', 'IT', 'UEFA'),
    'netherlands': ('Pays-Bas', 'NL', 'UEFA'), 'portugal': ('Portugal', 'PT', 'UEFA'),
    'belgium': ('Belgique', 'BE', 'UEFA'), 'croatia': ('Croatie', 'HR', 'UEFA'),
    'serbia': ('Serbie', 'RS', 'UEFA'), 'denmark': ('Danemark', 'DK', 'UEFA'),
    'sweden': ('Suède', 'SE', 'UEFA'), 'norway': ('Norvège', 'NO', 'UEFA'),
    'poland': ('Pologne', 'PL', 'UEFA'), 'austria': ('Autriche', 'AT', 'UEFA'),
    'switzerland': ('Suisse', 'CH', 'UEFA'), 'czech republic': ('Tchéquie', 'CZ', 'UEFA'),
    'czechia': ('Tchéquie', 'CZ', 'UEFA'), 'slovakia': ('Slovaquie', 'SK', 'UEFA'),
    'slovenia': ('Slovénie', 'SI', 'UEFA'), 'hungary': ('Hongrie', 'HU', 'UEFA'),
    'romania': ('Roumanie', 'RO', 'UEFA'), 'bulgaria': ('Bulgarie', 'BG', 'UEFA'),
    'greece': ('Grèce', 'GR', 'UEFA'), 'turkey': ('Turquie', 'TR', 'UEFA'),
    'türkiye': ('Turquie', 'TR', 'UEFA'), 'ukraine': ('Ukraine', 'UA', 'UEFA'),
    'russia': ('Russie', 'RU', 'UEFA'), 'iceland': ('Islande', 'IS', 'UEFA'),
    'finland': ('Finlande', 'FI', 'UEFA'), 'albania': ('Albanie', 'AL', 'UEFA'),
    'north macedonia': ('Macédoine du Nord', 'MK', 'UEFA'), 'montenegro': ('Monténégro', 'ME', 'UEFA'),
    'bosnia-herzegovina': ('Bosnie-Herzégovine', 'BA', 'UEFA'),
    'bosnia and herzegovina': ('Bosnie-Herzégovine', 'BA', 'UEFA'),
    'kosovo': ('Kosovo', 'XK', 'UEFA'), 'georgia': ('Géorgie', 'GE', 'UEFA'),
    'armenia': ('Arménie', 'AM', 'UEFA'), 'azerbaijan': ('Azerbaïdjan', 'AZ', 'UEFA'),
    'israel': ('Israël', 'IL', 'UEFA'), 'cyprus': ('Chypre', 'CY', 'UEFA'),
    'malta': ('Malte', 'MT', 'UEFA'), 'luxembourg': ('Luxembourg', 'LU', 'UEFA'),
    'estonia': ('Estonie', 'EE', 'UEFA'), 'latvia': ('Lettonie', 'LV', 'UEFA'),
    'lithuania': ('Lituanie', 'LT', 'UEFA'), 'belarus': ('Biélorussie', 'BY', 'UEFA'),
    'moldova': ('Moldavie', 'MD', 'UEFA'), 'faroe islands': ('Îles Féroé', 'FO', 'UEFA'),
    'gibraltar': ('Gibraltar', 'GI', 'UEFA'), 'andorra': ('Andorre', 'AD', 'UEFA'),
    # Amériques
    'brazil': ('Brésil', 'BR', 'CONMEBOL'), 'argentina': ('Argentine', 'AR', 'CONMEBOL'),
    'uruguay': ('Uruguay', 'UY', 'CONMEBOL'), 'chile': ('Chili', 'CL', 'CONMEBOL'),
    'colombia': ('Colombie', 'CO', 'CONMEBOL'), 'peru': ('Pérou', 'PE', 'CONMEBOL'),
    'ecuador': ('Équateur', 'EC', 'CONMEBOL'), 'paraguay': ('Paraguay', 'PY', 'CONMEBOL'),
    'venezuela': ('Venezuela', 'VE', 'CONMEBOL'), 'bolivia': ('Bolivie', 'BO', 'CONMEBOL'),
    'mexico': ('Mexique', 'MX', 'CONCACAF'), 'usa': ('États-Unis', 'US', 'CONCACAF'),
    'united states': ('États-Unis', 'US', 'CONCACAF'), 'canada': ('Canada', 'CA', 'CONCACAF'),
    'jamaica': ('Jamaïque', 'JM', 'CONCACAF'), 'costa rica': ('Costa Rica', 'CR', 'CONCACAF'),
    'honduras': ('Honduras', 'HN', 'CONCACAF'), 'panama': ('Panama', 'PA', 'CONCACAF'),
    'curacao': ('Curaçao', 'CW', 'CONCACAF'), 'curaçao': ('Curaçao', 'CW', 'CONCACAF'),
    'suriname': ('Suriname', 'SR', 'CONCACAF'), 'haiti': ('Haïti', 'HT', 'CONCACAF'),
    'dominican republic': ('Rép. dominicaine', 'DO', 'CONCACAF'),
    'guatemala': ('Guatemala', 'GT', 'CONCACAF'), 'el salvador': ('Salvador', 'SV', 'CONCACAF'),
    'trinidad and tobago': ('Trinité-et-Tobago', 'TT', 'CONCACAF'),
    'trinidad & tobago': ('Trinité-et-Tobago', 'TT', 'CONCACAF'),
    'grenada': ('Grenade', 'GD', 'CONCACAF'), 'guyana': ('Guyana', 'GY', 'CONCACAF'),
    'martinique': ('Martinique', 'MQ', 'CONCACAF'), 'guadeloupe': ('Guadeloupe', 'GP', 'CONCACAF'),
    'bermuda': ('Bermudes', 'BM', 'CONCACAF'), 'cuba': ('Cuba', 'CU', 'CONCACAF'),
    'saint kitts and nevis': ('Saint-Kitts-et-Nevis', 'KN', 'CONCACAF'),
    'antigua and barbuda': ('Antigua-et-Barbuda', 'AG', 'CONCACAF'),
    # Afrique
    'morocco': ('Maroc', 'MA', 'CAF'), 'algeria': ('Algérie', 'DZ', 'CAF'),
    'tunisia': ('Tunisie', 'TN', 'CAF'), 'egypt': ('Égypte', 'EG', 'CAF'),
    'senegal': ('Sénégal', 'SN', 'CAF'), 'ivory coast': ('Côte d’Ivoire', 'CI', 'CAF'),
    "cote d'ivoire": ('Côte d’Ivoire', 'CI', 'CAF'), 'côte d’ivoire': ('Côte d’Ivoire', 'CI', 'CAF'),
    "côte d'ivoire": ('Côte d’Ivoire', 'CI', 'CAF'),
    'ghana': ('Ghana', 'GH', 'CAF'), 'nigeria': ('Nigeria', 'NG', 'CAF'),
    'cameroon': ('Cameroun', 'CM', 'CAF'), 'mali': ('Mali', 'ML', 'CAF'),
    'burkina faso': ('Burkina Faso', 'BF', 'CAF'), 'guinea': ('Guinée', 'GN', 'CAF'),
    'guinea-bissau': ('Guinée-Bissau', 'GW', 'CAF'), 'equatorial guinea': ('Guinée équatoriale', 'GQ', 'CAF'),
    'dr congo': ('RD Congo', 'CD', 'CAF'), 'congo dr': ('RD Congo', 'CD', 'CAF'),
    'democratic republic of congo': ('RD Congo', 'CD', 'CAF'),
    'congo': ('Congo', 'CG', 'CAF'), 'gabon': ('Gabon', 'GA', 'CAF'),
    'angola': ('Angola', 'AO', 'CAF'), 'mozambique': ('Mozambique', 'MZ', 'CAF'),
    'zambia': ('Zambie', 'ZM', 'CAF'), 'zimbabwe': ('Zimbabwe', 'ZW', 'CAF'),
    'south africa': ('Afrique du Sud', 'ZA', 'CAF'), 'kenya': ('Kenya', 'KE', 'CAF'),
    'uganda': ('Ouganda', 'UG', 'CAF'), 'tanzania': ('Tanzanie', 'TZ', 'CAF'),
    'ethiopia': ('Éthiopie', 'ET', 'CAF'), 'gambia': ('Gambie', 'GM', 'CAF'),
    'sierra leone': ('Sierra Leone', 'SL', 'CAF'), 'liberia': ('Liberia', 'LR', 'CAF'),
    'togo': ('Togo', 'TG', 'CAF'), 'benin': ('Bénin', 'BJ', 'CAF'),
    'niger': ('Niger', 'NE', 'CAF'), 'chad': ('Tchad', 'TD', 'CAF'),
    'central african republic': ('Centrafrique', 'CF', 'CAF'),
    'cape verde': ('Cap-Vert', 'CV', 'CAF'), 'cape verde islands': ('Cap-Vert', 'CV', 'CAF'),
    'comoros': ('Comores', 'KM', 'CAF'), 'madagascar': ('Madagascar', 'MG', 'CAF'),
    'mauritania': ('Mauritanie', 'MR', 'CAF'), 'libya': ('Libye', 'LY', 'CAF'),
    'sudan': ('Soudan', 'SD', 'CAF'), 'south sudan': ('Soudan du Sud', 'SS', 'CAF'),
    'burundi': ('Burundi', 'BI', 'CAF'), 'rwanda': ('Rwanda', 'RW', 'CAF'),
    'malawi': ('Malawi', 'MW', 'CAF'), 'namibia': ('Namibie', 'NA', 'CAF'),
    'botswana': ('Botswana', 'BW', 'CAF'), 'mauritius': ('Maurice', 'MU', 'CAF'),
    # Asie / Océanie
    'japan': ('Japon', 'JP', 'AFC'), 'south korea': ('Corée du Sud', 'KR', 'AFC'),
    'korea republic': ('Corée du Sud', 'KR', 'AFC'), 'korea, south': ('Corée du Sud', 'KR', 'AFC'),
    'china': ('Chine', 'CN', 'AFC'), 'china pr': ('Chine', 'CN', 'AFC'),
    'iran': ('Iran', 'IR', 'AFC'), 'iraq': ('Irak', 'IQ', 'AFC'),
    'saudi arabia': ('Arabie saoudite', 'SA', 'AFC'), 'qatar': ('Qatar', 'QA', 'AFC'),
    'united arab emirates': ('Émirats arabes unis', 'AE', 'AFC'),
    'jordan': ('Jordanie', 'JO', 'AFC'), 'lebanon': ('Liban', 'LB', 'AFC'),
    'syria': ('Syrie', 'SY', 'AFC'), 'palestine': ('Palestine', 'PS', 'AFC'),
    'uzbekistan': ('Ouzbékistan', 'UZ', 'AFC'), 'kazakhstan': ('Kazakhstan', 'KZ', 'UEFA'),
    'tajikistan': ('Tadjikistan', 'TJ', 'AFC'), 'kyrgyzstan': ('Kirghizistan', 'KG', 'AFC'),
    'australia': ('Australie', 'AU', 'AFC'), 'new zealand': ('Nouvelle-Zélande', 'NZ', 'OFC'),
    'indonesia': ('Indonésie', 'ID', 'AFC'), 'philippines': ('Philippines', 'PH', 'AFC'),
    'thailand': ('Thaïlande', 'TH', 'AFC'), 'vietnam': ('Vietnam', 'VN', 'AFC'),
    'india': ('Inde', 'IN', 'AFC'), 'malaysia': ('Malaisie', 'MY', 'AFC'),
}

# ── Postes : position API → poste fin du jeu
P = {
    'goalkeeper': 'G',
    'centre-back': 'DC', 'defence': 'DC', 'defender': 'DC',
    'left-back': 'LG', 'right-back': 'LD',
    'defensive midfield': 'MDC', 'central midfield': 'MC', 'midfield': 'MC', 'midfielder': 'MC',
    'attacking midfield': 'MO',
    'left winger': 'AG', 'left midfield': 'AG',
    'right winger': 'AD', 'right midfield': 'AD', 'winger': 'AD',
    'centre-forward': 'BU', 'offence': 'BU', 'forward': 'BU', 'attacker': 'BU', 'striker': 'BU',
}

# ── Clubs : shortName API → nom d'usage FR (sinon shortName tel quel)
CLUB_RENAME = {
    'Barcelona': 'FC Barcelone', 'Barça': 'FC Barcelone', 'Atleti': 'Atlético Madrid',
    'Atlético': 'Atlético Madrid', 'Athletic': 'Athletic Bilbao',
    'Napoli': 'Naples', 'Como': 'Côme', 'Como 1907': 'Côme',
    'Inter': 'Inter Milan', 'Milan': 'AC Milan',
    'Roma': 'AS Roma', 'Frankfurt': 'Francfort', 'Eintracht Frankfurt': 'Francfort',
    'Bayern': 'Bayern Munich', 'Bayern München': 'Bayern Munich',
    'Porto': 'FC Porto', 'SL Benfica': 'Benfica',
    'Wolverhampton': 'Wolves', 'Nottingham': 'Nottingham Forest',
    'Olympique Marseille': 'Marseille', 'Olympique Lyon': 'Lyon', 'Olympique Lyonnais': 'Lyon',
    'Paris Saint-Germain': 'PSG',
    'Brighton Hove': 'Brighton', 'Leeds United': 'Leeds',
    'Sevilla FC': 'Séville', 'Celta': 'Celta Vigo', 'Santander': 'Racing Santander',
    'Bremen': 'Werder Brême', '1. FC Köln': 'Cologne', 'HSV': 'Hambourg', 'Mainz': 'Mayence',
    'Stade Rennais': 'Rennes', 'RC Lens': 'Lens', 'Angers SCO': 'Angers',
    'Bologna': 'Bologne', 'Venezia FC': 'Venise',
    'Mineiro': 'Atlético Mineiro', 'Paranaense': 'Athletico-PR',
}

# ── Corrections de graphies de l'API (noms tronqués, coquilles, diminutifs)
NAME_FIX = {
    'Christian Romero': 'Cristian Romero', 'Alejandro Baena': 'Álex Baena',
    'Marcus Thuram-Ulien': 'Marcus Thuram', 'Khéphren Thuram-Ulie': 'Khéphren Thuram',
    'Sehrou Guirassy': 'Serhou Guirassy', 'Anatolii Trubin': 'Anatoliy Trubin',
    'Andrew Robertson': 'Andy Robertson', 'Cucurella': 'Marc Cucurella',
    'Bremer': 'Gleison Bremer',
}

# ── Couleurs de kit : mot anglais → hex (pour JM_CLUBS)
COLORS = {
    'red': '#c8102e', 'white': '#ffffff', 'blue': '#1565c0', 'navy blue': '#0d2c54',
    'navy': '#0d2c54', 'sky blue': '#6cabdd', 'light blue': '#6cabdd', 'royal blue': '#1b458f',
    'dark blue': '#12284b', 'yellow': '#fdd835', 'gold': '#c9a227', 'orange': '#f57c00',
    'black': '#1a1a1a', 'green': '#2e7d46', 'dark green': '#1f5c32', 'purple': '#582c83',
    'maroon': '#7b1e3f', 'claret': '#7a263a', 'burgundy': '#8e1f2f', 'pink': '#f48fb1',
    'grey': '#9e9e9e', 'gray': '#9e9e9e', 'silver': '#b0bec5', 'brown': '#6d4c41',
    'amber': '#ffb300', 'turquoise': '#00b2a9', 'lilac': '#b39ddb', 'violet': '#582c83',
    'crimson': '#a6192e', 'scarlet': '#c8102e', 'garnet': '#8e1f2f',
}

def flag(code):
    """Code drapeau → emoji (indicateurs régionaux, ou séquences de tags GB)."""
    if code == 'GB-ENG':
        return '🏴' + ''.join(chr(0xE0000 + ord(c)) for c in 'gbeng') + '\U000E007F'
    if code == 'GB-SCT':
        return '🏴' + ''.join(chr(0xE0000 + ord(c)) for c in 'gbsct') + '\U000E007F'
    if code == 'GB-WLS':
        return '🏴' + ''.join(chr(0xE0000 + ord(c)) for c in 'gbwls') + '\U000E007F'
    return ''.join(chr(0x1F1E6 + ord(c) - 65) for c in code)

def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]', ' ', ''.join(c for c in s if not unicodedata.combining(c)))).strip()

def luminance(hexc):
    r, g, b = (int(hexc[i:i+2], 16) / 255 for i in (1, 3, 5))
    return 0.299 * r + 0.587 * g + 0.114 * b

def club_colors(api_colors):
    """'Red / White' → [c1, c2, texte] ou None."""
    if not api_colors:
        return None
    parts = [p.strip().lower() for p in api_colors.split('/')]
    hexes = [COLORS[p] for p in parts if p in COLORS][:2]
    if not hexes:
        return None
    if len(hexes) == 1:
        hexes.append('#1a1a1a' if luminance(hexes[0]) > 0.45 else '#ffffff')
    text = '#1a1a1a' if luminance(hexes[0]) > 0.6 else '#ffffff'
    return [hexes[0], hexes[1], text]

def fetch(code, key, offline):
    path = os.path.join(CACHE, code + '.json')
    if os.path.exists(path):
        return json.load(open(path, encoding='utf-8'))
    if offline:
        raise SystemExit('Cache manquant pour ' + code + ' en mode --offline')
    req = urllib.request.Request('https://api.football-data.org/v4/competitions/%s/teams' % code,
                                 headers={'X-Auth-Token': key})
    data = json.load(urllib.request.urlopen(req))
    json.dump(data, open(path, 'w', encoding='utf-8'), ensure_ascii=False)
    time.sleep(6.5)  # limite gratuite : 10 requêtes/minute
    return data

def main():
    offline = '--offline' in sys.argv
    key = ''
    if os.path.exists(ENV):
        for line in open(ENV, encoding='utf-8'):
            if line.startswith('FOOTBALL_DATA_API_KEY'):
                key = line.split('=', 1)[1].strip()
    if not key and not offline:
        raise SystemExit('FOOTBALL_DATA_API_KEY introuvable dans ' + ENV)

    curated = json.load(open(os.path.join(CACHE, 'curated.json'), encoding='utf-8'))
    stars = {norm(r[0]) for r in curated}

    rows, clubs, seen = [], {}, {}
    warn_nation, warn_pos, dropped, collisions = set(), {}, 0, 0

    for code, league in LEAGUES:
        data = fetch(code, key, offline)
        for team in data['teams']:
            club = team.get('shortName') or team['name']
            club = CLUB_RENAME.get(club, club)
            cc = club_colors(team.get('clubColors'))
            if cc and club not in clubs:
                clubs[club] = cc
            for pl in team.get('squad', []):
                name, nat, pos, dob = pl.get('name'), pl.get('nationality'), pl.get('position'), pl.get('dateOfBirth')
                if not (name and nat and pos and dob) or pos == 'null':
                    dropped += 1
                    continue
                name = NAME_FIX.get(name, name)
                info = N.get(nat.lower().strip())
                if not info:
                    warn_nation.add(nat)
                    info = (nat, None, '?')
                p = P.get(pos.lower().strip())
                if not p:
                    warn_pos[pos] = warn_pos.get(pos, 0) + 1
                    continue
                key_n = norm(name)
                if key_n in seen:
                    collisions += 1
                    continue
                seen[key_n] = True
                fr, iso, conf = info
                rows.append([name, club, league, fr, flag(iso) if iso else '🏳️', conf, p,
                             int(dob[:4]), 1 if key_n in stars else 2])

    # Stars absentes des effectifs API : ligues non couvertes (Saudi, MLS, Pro League,
    # Süper Lig, ARG…) mais aussi joueurs manquants des ligues couvertes — la base
    # curée (recherchée à la main) fait alors foi.
    kept_extra = 0
    for r in curated:
        if norm(r[0]) in seen:
            continue
        seen[norm(r[0])] = True
        rows.append(r + [1])
        kept_extra += 1
        if r[2] in COVERED:
            print('  + star réinjectée (absente des effectifs API) :', r[0], '(' + r[1] + ')')

    n_stars = sum(1 for r in rows if r[8] == 1)
    api_stars = n_stars - kept_extra

    out = []
    out.append('// Base de joueurs du Joueur Mystère — générée par build_data.py, saison 2026-27')
    out.append('// Source : football-data.org (8 ligues) + stars hors ligues couvertes (base curée).')
    out.append('// Format : [nom, club, championnat, nation, drapeau, confédération, poste, année de naissance, tier]')
    out.append('// tier 1 = star (vivier des mystères), tier 2 = seulement devinable. NE PAS ÉDITER À LA MAIN.')
    out.append('window.JM_DATA = /*JM-DATA*/[')
    body = ',\n'.join(json.dumps(r, ensure_ascii=False) for r in rows)
    out.append(body)
    out.append(']/*JM-DATA-END*/;')
    out.append('// Couleurs officielles des clubs (API) — les clubs curés de app.js ont priorité')
    out.append('window.JM_CLUBS = ' + json.dumps(clubs, ensure_ascii=False, sort_keys=True) + ';')
    open(os.path.join(ROOT, 'data.js'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')

    print('joueurs : %d (stars %d, dont %d hors ligues API ; devinables %d)' %
          (len(rows), n_stars, kept_extra, len(rows) - n_stars))
    print('clubs avec couleurs API :', len(clubs))
    print('doublons de noms ignorés :', collisions, '| incomplets ignorés :', dropped)
    if warn_nation:
        print('⚠ nations sans traduction :', sorted(warn_nation))
    if warn_pos:
        print('⚠ postes non mappés :', warn_pos)
    print('stars retrouvées dans les effectifs API : %d / %d' % (api_stars, len(stars)))

if __name__ == '__main__':
    main()
