#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Générateur de data.js pour Le Joueur Mystère — édition EA FC.

Sources :
  1. EA drop-api (build-cache/ea.json, produit par fetch_ea.py) : ~16 000 joueurs
     hommes avec la NOTE officielle EA FC — colonne p[9], moteur de la rareté.
  2. football-data.org (cache build-cache/{PL,PD,…}.json) : comble les trous de
     licence d'EA (toute l'Eredivisie et l'Amérique du Sud sont sans club chez
     EA FC 26) — joueurs ajoutés SANS note (0) : devinables, pas collectionnables.
  3. build-cache/curated.json : la base curée historique des stars — tout joueur
     curé est tier 1 (vivier des mystères jour/marathon/duel), réinjecté au
     besoin avec note 84 s'il manque partout ailleurs.

tier 1 = star (curée OU note ≥ 82) ; tier 2 = le reste.
Format d'une ligne : [nom, club, championnat, nation, drapeau, confédération,
                      poste, année de naissance, tier, note]

Usage : python3 fetch_ea.py  puis  python3 build_data.py
"""
import json, os, re, sys, unicodedata

ROOT = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(ROOT, 'build-cache')

STAR_NOTE = 82      # note EA qui suffit à faire une star (≈ 280 joueurs)
NOTE_REINJECT = 84  # note par défaut d'une star curée absente de la base EA

FD_LEAGUES = [  # (fichier cache football-data, nom affiché)
    ('PL', 'Premier League'), ('PD', 'La Liga'), ('SA', 'Serie A'),
    ('BL1', 'Bundesliga'), ('FL1', 'Ligue 1'), ('DED', 'Eredivisie'),
    ('PPL', 'Liga Portugal'), ('BSA', 'Brasileirão'),
]

# ── Nations : nom FR (référentiel du jeu) → (code drapeau ISO, confédération)
FR_NAT = {
    'Angleterre': ('GB-ENG', 'UEFA'), 'Écosse': ('GB-SCT', 'UEFA'), 'Pays de Galles': ('GB-WLS', 'UEFA'),
    'Irlande du Nord': ('GB', 'UEFA'), 'Irlande': ('IE', 'UEFA'), 'France': ('FR', 'UEFA'),
    'Espagne': ('ES', 'UEFA'), 'Allemagne': ('DE', 'UEFA'), 'Italie': ('IT', 'UEFA'),
    'Pays-Bas': ('NL', 'UEFA'), 'Portugal': ('PT', 'UEFA'), 'Belgique': ('BE', 'UEFA'),
    'Croatie': ('HR', 'UEFA'), 'Serbie': ('RS', 'UEFA'), 'Danemark': ('DK', 'UEFA'),
    'Suède': ('SE', 'UEFA'), 'Norvège': ('NO', 'UEFA'), 'Pologne': ('PL', 'UEFA'),
    'Autriche': ('AT', 'UEFA'), 'Suisse': ('CH', 'UEFA'), 'Tchéquie': ('CZ', 'UEFA'),
    'Slovaquie': ('SK', 'UEFA'), 'Slovénie': ('SI', 'UEFA'), 'Hongrie': ('HU', 'UEFA'),
    'Roumanie': ('RO', 'UEFA'), 'Bulgarie': ('BG', 'UEFA'), 'Grèce': ('GR', 'UEFA'),
    'Turquie': ('TR', 'UEFA'), 'Ukraine': ('UA', 'UEFA'), 'Russie': ('RU', 'UEFA'),
    'Islande': ('IS', 'UEFA'), 'Finlande': ('FI', 'UEFA'), 'Albanie': ('AL', 'UEFA'),
    'Macédoine du Nord': ('MK', 'UEFA'), 'Monténégro': ('ME', 'UEFA'),
    'Bosnie-Herzégovine': ('BA', 'UEFA'), 'Kosovo': ('XK', 'UEFA'), 'Géorgie': ('GE', 'UEFA'),
    'Arménie': ('AM', 'UEFA'), 'Azerbaïdjan': ('AZ', 'UEFA'), 'Israël': ('IL', 'UEFA'),
    'Chypre': ('CY', 'UEFA'), 'Malte': ('MT', 'UEFA'), 'Luxembourg': ('LU', 'UEFA'),
    'Estonie': ('EE', 'UEFA'), 'Lettonie': ('LV', 'UEFA'), 'Lituanie': ('LT', 'UEFA'),
    'Biélorussie': ('BY', 'UEFA'), 'Moldavie': ('MD', 'UEFA'), 'Îles Féroé': ('FO', 'UEFA'),
    'Gibraltar': ('GI', 'UEFA'), 'Andorre': ('AD', 'UEFA'), 'Liechtenstein': ('LI', 'UEFA'),
    'Kazakhstan': ('KZ', 'UEFA'),
    'Brésil': ('BR', 'CONMEBOL'), 'Argentine': ('AR', 'CONMEBOL'), 'Uruguay': ('UY', 'CONMEBOL'),
    'Chili': ('CL', 'CONMEBOL'), 'Colombie': ('CO', 'CONMEBOL'), 'Pérou': ('PE', 'CONMEBOL'),
    'Équateur': ('EC', 'CONMEBOL'), 'Paraguay': ('PY', 'CONMEBOL'), 'Venezuela': ('VE', 'CONMEBOL'),
    'Bolivie': ('BO', 'CONMEBOL'),
    'Mexique': ('MX', 'CONCACAF'), 'États-Unis': ('US', 'CONCACAF'), 'Canada': ('CA', 'CONCACAF'),
    'Jamaïque': ('JM', 'CONCACAF'), 'Costa Rica': ('CR', 'CONCACAF'), 'Honduras': ('HN', 'CONCACAF'),
    'Panama': ('PA', 'CONCACAF'), 'Curaçao': ('CW', 'CONCACAF'), 'Suriname': ('SR', 'CONCACAF'),
    'Haïti': ('HT', 'CONCACAF'), 'Rép. dominicaine': ('DO', 'CONCACAF'), 'Guatemala': ('GT', 'CONCACAF'),
    'Salvador': ('SV', 'CONCACAF'), 'Trinité-et-Tobago': ('TT', 'CONCACAF'), 'Grenade': ('GD', 'CONCACAF'),
    'Guyana': ('GY', 'CONCACAF'), 'Martinique': ('MQ', 'CONCACAF'), 'Guadeloupe': ('GP', 'CONCACAF'),
    'Bermudes': ('BM', 'CONCACAF'), 'Cuba': ('CU', 'CONCACAF'), 'Saint-Kitts-et-Nevis': ('KN', 'CONCACAF'),
    'Antigua-et-Barbuda': ('AG', 'CONCACAF'), 'Sainte-Lucie': ('LC', 'CONCACAF'),
    'Montserrat': ('MS', 'CONCACAF'), 'Barbade': ('BB', 'CONCACAF'),
    'Maroc': ('MA', 'CAF'), 'Algérie': ('DZ', 'CAF'), 'Tunisie': ('TN', 'CAF'), 'Égypte': ('EG', 'CAF'),
    'Sénégal': ('SN', 'CAF'), 'Côte d’Ivoire': ('CI', 'CAF'), 'Ghana': ('GH', 'CAF'),
    'Nigeria': ('NG', 'CAF'), 'Cameroun': ('CM', 'CAF'), 'Mali': ('ML', 'CAF'),
    'Burkina Faso': ('BF', 'CAF'), 'Guinée': ('GN', 'CAF'), 'Guinée-Bissau': ('GW', 'CAF'),
    'Guinée équatoriale': ('GQ', 'CAF'), 'RD Congo': ('CD', 'CAF'), 'Congo': ('CG', 'CAF'),
    'Gabon': ('GA', 'CAF'), 'Angola': ('AO', 'CAF'), 'Mozambique': ('MZ', 'CAF'),
    'Zambie': ('ZM', 'CAF'), 'Zimbabwe': ('ZW', 'CAF'), 'Afrique du Sud': ('ZA', 'CAF'),
    'Kenya': ('KE', 'CAF'), 'Ouganda': ('UG', 'CAF'), 'Tanzanie': ('TZ', 'CAF'),
    'Éthiopie': ('ET', 'CAF'), 'Gambie': ('GM', 'CAF'), 'Sierra Leone': ('SL', 'CAF'),
    'Liberia': ('LR', 'CAF'), 'Togo': ('TG', 'CAF'), 'Bénin': ('BJ', 'CAF'),
    'Niger': ('NE', 'CAF'), 'Tchad': ('TD', 'CAF'), 'Centrafrique': ('CF', 'CAF'),
    'Cap-Vert': ('CV', 'CAF'), 'Comores': ('KM', 'CAF'), 'Madagascar': ('MG', 'CAF'),
    'Mauritanie': ('MR', 'CAF'), 'Libye': ('LY', 'CAF'), 'Soudan': ('SD', 'CAF'),
    'Soudan du Sud': ('SS', 'CAF'), 'Burundi': ('BI', 'CAF'), 'Rwanda': ('RW', 'CAF'),
    'Malawi': ('MW', 'CAF'), 'Namibie': ('NA', 'CAF'), 'Botswana': ('BW', 'CAF'),
    'Maurice': ('MU', 'CAF'), 'Somalie': ('SO', 'CAF'),
    'Japon': ('JP', 'AFC'), 'Corée du Sud': ('KR', 'AFC'), 'Chine': ('CN', 'AFC'),
    'Iran': ('IR', 'AFC'), 'Irak': ('IQ', 'AFC'), 'Arabie saoudite': ('SA', 'AFC'),
    'Qatar': ('QA', 'AFC'), 'Émirats arabes unis': ('AE', 'AFC'), 'Jordanie': ('JO', 'AFC'),
    'Liban': ('LB', 'AFC'), 'Syrie': ('SY', 'AFC'), 'Palestine': ('PS', 'AFC'),
    'Ouzbékistan': ('UZ', 'AFC'), 'Tadjikistan': ('TJ', 'AFC'), 'Kirghizistan': ('KG', 'AFC'),
    'Australie': ('AU', 'AFC'), 'Indonésie': ('ID', 'AFC'), 'Philippines': ('PH', 'AFC'),
    'Thaïlande': ('TH', 'AFC'), 'Vietnam': ('VN', 'AFC'), 'Inde': ('IN', 'AFC'),
    'Malaisie': ('MY', 'AFC'), 'Hong Kong': ('HK', 'AFC'), 'Taipei chinois': ('TW', 'AFC'),
    'Afghanistan': ('AF', 'AFC'), 'Bangladesh': ('BD', 'AFC'), 'Pakistan': ('PK', 'AFC'),
    'Sri Lanka': ('LK', 'AFC'),
    'Nouvelle-Zélande': ('NZ', 'OFC'), 'Vanuatu': ('VU', 'OFC'),
}
# Libellés EA (locale=fr) → nom FR du référentiel
NAT_RENAME = {
    'Comoros': 'Comores', 'Iles Féroé': 'Îles Féroé', "Rép. d'Irlande": 'Irlande',
    'République tchèque': 'Tchéquie', 'République dominicaine': 'Rép. dominicaine',
    'République centrafricaine': 'Centrafrique', 'St-Kitts-et-Nev.': 'Saint-Kitts-et-Nevis',
    'Ste-Lucie': 'Sainte-Lucie', 'Antigua et Barbuda': 'Antigua-et-Barbuda',
    "Côte d'Ivoire": 'Côte d’Ivoire',
}
# Nations football-data (anglais) → nom FR — pour la fusion des trous de licence
EN_NAT = {
    'england': 'Angleterre', 'scotland': 'Écosse', 'wales': 'Pays de Galles',
    'northern ireland': 'Irlande du Nord', 'ireland': 'Irlande', 'republic of ireland': 'Irlande',
    'france': 'France', 'spain': 'Espagne', 'germany': 'Allemagne', 'italy': 'Italie',
    'netherlands': 'Pays-Bas', 'portugal': 'Portugal', 'belgium': 'Belgique', 'croatia': 'Croatie',
    'serbia': 'Serbie', 'denmark': 'Danemark', 'sweden': 'Suède', 'norway': 'Norvège',
    'poland': 'Pologne', 'austria': 'Autriche', 'switzerland': 'Suisse', 'czech republic': 'Tchéquie',
    'czechia': 'Tchéquie', 'slovakia': 'Slovaquie', 'slovenia': 'Slovénie', 'hungary': 'Hongrie',
    'romania': 'Roumanie', 'bulgaria': 'Bulgarie', 'greece': 'Grèce', 'turkey': 'Turquie',
    'türkiye': 'Turquie', 'ukraine': 'Ukraine', 'russia': 'Russie', 'iceland': 'Islande',
    'finland': 'Finlande', 'albania': 'Albanie', 'north macedonia': 'Macédoine du Nord',
    'montenegro': 'Monténégro', 'bosnia-herzegovina': 'Bosnie-Herzégovine',
    'bosnia and herzegovina': 'Bosnie-Herzégovine', 'kosovo': 'Kosovo', 'georgia': 'Géorgie',
    'armenia': 'Arménie', 'azerbaijan': 'Azerbaïdjan', 'israel': 'Israël', 'cyprus': 'Chypre',
    'malta': 'Malte', 'luxembourg': 'Luxembourg', 'estonia': 'Estonie', 'latvia': 'Lettonie',
    'lithuania': 'Lituanie', 'belarus': 'Biélorussie', 'moldova': 'Moldavie',
    'faroe islands': 'Îles Féroé', 'gibraltar': 'Gibraltar', 'andorra': 'Andorre',
    'brazil': 'Brésil', 'argentina': 'Argentine', 'uruguay': 'Uruguay', 'chile': 'Chili',
    'colombia': 'Colombie', 'peru': 'Pérou', 'ecuador': 'Équateur', 'paraguay': 'Paraguay',
    'venezuela': 'Venezuela', 'bolivia': 'Bolivie', 'mexico': 'Mexique', 'usa': 'États-Unis',
    'united states': 'États-Unis', 'canada': 'Canada', 'jamaica': 'Jamaïque',
    'costa rica': 'Costa Rica', 'honduras': 'Honduras', 'panama': 'Panama', 'curacao': 'Curaçao',
    'curaçao': 'Curaçao', 'suriname': 'Suriname', 'haiti': 'Haïti',
    'dominican republic': 'Rép. dominicaine', 'guatemala': 'Guatemala', 'el salvador': 'Salvador',
    'trinidad and tobago': 'Trinité-et-Tobago', 'trinidad & tobago': 'Trinité-et-Tobago',
    'grenada': 'Grenade', 'guyana': 'Guyana', 'martinique': 'Martinique', 'guadeloupe': 'Guadeloupe',
    'bermuda': 'Bermudes', 'cuba': 'Cuba', 'saint kitts and nevis': 'Saint-Kitts-et-Nevis',
    'antigua and barbuda': 'Antigua-et-Barbuda',
    'morocco': 'Maroc', 'algeria': 'Algérie', 'tunisia': 'Tunisie', 'egypt': 'Égypte',
    'senegal': 'Sénégal', 'ivory coast': 'Côte d’Ivoire', "cote d'ivoire": 'Côte d’Ivoire',
    'côte d’ivoire': 'Côte d’Ivoire', "côte d'ivoire": 'Côte d’Ivoire', 'ghana': 'Ghana',
    'nigeria': 'Nigeria', 'cameroon': 'Cameroun', 'mali': 'Mali', 'burkina faso': 'Burkina Faso',
    'guinea': 'Guinée', 'guinea-bissau': 'Guinée-Bissau', 'equatorial guinea': 'Guinée équatoriale',
    'dr congo': 'RD Congo', 'congo dr': 'RD Congo', 'democratic republic of congo': 'RD Congo',
    'congo': 'Congo', 'gabon': 'Gabon', 'angola': 'Angola', 'mozambique': 'Mozambique',
    'zambia': 'Zambie', 'zimbabwe': 'Zimbabwe', 'south africa': 'Afrique du Sud', 'kenya': 'Kenya',
    'uganda': 'Ouganda', 'tanzania': 'Tanzanie', 'ethiopia': 'Éthiopie', 'gambia': 'Gambie',
    'sierra leone': 'Sierra Leone', 'liberia': 'Liberia', 'togo': 'Togo', 'benin': 'Bénin',
    'niger': 'Niger', 'chad': 'Tchad', 'central african republic': 'Centrafrique',
    'cape verde': 'Cap-Vert', 'cape verde islands': 'Cap-Vert', 'comoros': 'Comores',
    'madagascar': 'Madagascar', 'mauritania': 'Mauritanie', 'libya': 'Libye', 'sudan': 'Soudan',
    'south sudan': 'Soudan du Sud', 'burundi': 'Burundi', 'rwanda': 'Rwanda', 'malawi': 'Malawi',
    'namibia': 'Namibie', 'botswana': 'Botswana', 'mauritius': 'Maurice',
    'japan': 'Japon', 'south korea': 'Corée du Sud', 'korea republic': 'Corée du Sud',
    'korea, south': 'Corée du Sud', 'china': 'Chine', 'china pr': 'Chine', 'iran': 'Iran',
    'iraq': 'Irak', 'saudi arabia': 'Arabie saoudite', 'qatar': 'Qatar',
    'united arab emirates': 'Émirats arabes unis', 'jordan': 'Jordanie', 'lebanon': 'Liban',
    'syria': 'Syrie', 'palestine': 'Palestine', 'uzbekistan': 'Ouzbékistan',
    'kazakhstan': 'Kazakhstan', 'tajikistan': 'Tadjikistan', 'kyrgyzstan': 'Kirghizistan',
    'australia': 'Australie', 'new zealand': 'Nouvelle-Zélande', 'indonesia': 'Indonésie',
    'philippines': 'Philippines', 'thailand': 'Thaïlande', 'vietnam': 'Vietnam', 'india': 'Inde',
    'malaysia': 'Malaisie',
}

# ── Postes EA : position.id (stable, indépendant de la locale) → poste du jeu
POS_ID = {
    '0': 'G', '3': 'LD', '5': 'DC', '7': 'LG', '10': 'MDC', '12': 'AD',
    '14': 'MC', '16': 'AG', '18': 'MO', '23': 'AD', '25': 'BU', '27': 'AG',
}
# Postes football-data (fusion)
POS_FD = {
    'goalkeeper': 'G', 'centre-back': 'DC', 'defence': 'DC', 'defender': 'DC',
    'left-back': 'LG', 'right-back': 'LD', 'defensive midfield': 'MDC',
    'central midfield': 'MC', 'midfield': 'MC', 'midfielder': 'MC', 'attacking midfield': 'MO',
    'left winger': 'AG', 'left midfield': 'AG', 'right winger': 'AD', 'right midfield': 'AD',
    'winger': 'AD', 'centre-forward': 'BU', 'offence': 'BU', 'forward': 'BU',
    'attacker': 'BU', 'striker': 'BU',
}

# ── Championnats : libellé EA (sponsorisé/masqué) → nom d'usage FR
LEAGUE_RENAME = {
    'LALIGA EA SPORTS': 'La Liga', 'LALIGA HYPERMOTION': 'La Liga 2',
    'Serie A Enilive': 'Serie A', 'Serie BKT': 'Serie B',
    "Ligue 1 McDonald's": 'Ligue 1', 'Ligue 2 BKT': 'Ligue 2',
    'Trendyol Süper Lig': 'Süper Lig', 'ROSHN Saudi League': 'Saudi Pro League',
    '1A Pro League': 'Pro League', 'LPF': 'Primera División ARG',
    'PKO BP Ekstraklasa': 'Ekstraklasa', 'SUPERLIGA': 'SuperLiga roumaine',
    '3F Superliga': 'Superliga danoise', 'Brack Super League': 'Super League suisse',
    'Ö. Bundesliga': 'Bundesliga autrichienne', 'Scottish Prem': 'Premiership écossaise',
    'SSE Airtricity PD': 'Championnat d’Irlande', 'Hellas Liga': 'Championnat de Grèce',
    'Česká Liga': 'Championnat de Tchéquie', 'Liga Hrvatska': 'Championnat de Croatie',
    'Ukrayina Liha': 'Championnat d’Ukraine', 'Magyar Liga': 'Championnat de Hongrie',
    'CSL': 'Chinese Super League', 'ISL': 'Indian Super League',
    'Libertadores': 'Copa Libertadores', 'Sudamericana': 'Copa Sudamericana',
    'EFL Championship': 'Championship', 'EFL League One': 'League One', 'EFL League Two': 'League Two',
}

# ── Clubs : libellé EA (dont noms masqués faute de licence) → nom d'usage
CLUB_RENAME = {
    'Milano FC': 'AC Milan', 'Lombardia FC': 'Inter Milan', 'Bergamo Calcio': 'Atalanta',
    'Latium': 'Lazio', 'SSC Napoli': 'Naples',
    'OM': 'Marseille', 'OL': 'Lyon', 'Paris SG': 'PSG', 'LOSC Lille': 'Lille',
    'Stade Rennais FC': 'Rennes', 'AS Monaco': 'Monaco', 'OGC Nice': 'Nice',
    'Spurs': 'Tottenham', 'Man Utd': 'Man United', 'Manchester City': 'Man City',
    'Leeds Utd': 'Leeds', 'Newcastle Utd': 'Newcastle', 'Notting. Forest': 'Nottingham Forest',
    'AFC Bournemouth': 'Bournemouth', 'Wolverhampton': 'Wolves',
    'FC Barcelona': 'FC Barcelone', 'Athletic Club': 'Athletic Bilbao', 'Celta': 'Celta Vigo',
    'Valencia CF': 'Valence', 'Villarreal CF': 'Villarreal', 'Getafe CF': 'Getafe',
    'Girona FC': 'Gérone', 'RCD Majorque': 'Majorque', 'CA Osasuna': 'Osasuna',
    'FC Bayern München': 'Bayern Munich', 'Borussia Dortmund': 'Dortmund',
    "M'gladbach": 'Mönchengladbach', '1. FSV Mainz 05': 'Mayence', 'SV Werder Bremen': 'Werder Brême',
    'VfL Wolfsbourg': 'Wolfsburg', 'VfB Stuttgart': 'Stuttgart', 'SC Freiburg': 'Fribourg',
    'TSG Hoffenheim': 'Hoffenheim', 'Eintracht Francfort': 'Francfort',
    'SL Benfica': 'Benfica', 'Sporting CP': 'Sporting CP',
    'Al Nassr': 'Al-Nassr', 'Al Hilal': 'Al-Hilal', 'Al Ittihad': 'Al-Ittihad',
    'Al Ahli': 'Al-Ahli', 'Al Qadsiah': 'Al-Qadsiah', 'Al Shabab': 'Al-Shabab',
    'Inter Miami CF': 'Inter Miami', 'Olympiacos FC': 'Olympiakos',
}

# ── Graphies : nom EA (commonName inclus) → nom d'usage du jeu
NAME_FIX = {
    'Vini Jr.': 'Vinícius Júnior', 'Alisson': 'Alisson Becker', 'Gabriel': 'Gabriel Magalhães',
    'Heung Min Son': 'Son Heung-min', 'Andrew Robertson': 'Andy Robertson',
    'Estêvão': 'Estêvão Willian', 'Fermín': 'Fermín López', 'Oyarzabal': 'Mikel Oyarzabal',
    'Zubimendi': 'Martín Zubimendi', 'Grimaldo': 'Alejandro Grimaldo', 'Bremer': 'Gleison Bremer',
    'Amad': 'Amad Diallo',
}


def flag(code):
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


# Couleurs de kit football-data (pour JM_CLUBS)
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
FD_CLUB_RENAME = {
    'Barcelona': 'FC Barcelone', 'Barça': 'FC Barcelone', 'Atleti': 'Atlético Madrid',
    'Atlético': 'Atlético Madrid', 'Athletic': 'Athletic Bilbao', 'Napoli': 'Naples',
    'Como': 'Côme', 'Como 1907': 'Côme', 'Inter': 'Inter Milan', 'Milan': 'AC Milan',
    'Roma': 'AS Roma', 'Frankfurt': 'Francfort', 'Eintracht Frankfurt': 'Francfort',
    'Bayern': 'Bayern Munich', 'Bayern München': 'Bayern Munich', 'Porto': 'FC Porto',
    'SL Benfica': 'Benfica', 'Wolverhampton': 'Wolves', 'Nottingham': 'Nottingham Forest',
    'Olympique Marseille': 'Marseille', 'Olympique Lyon': 'Lyon', 'Olympique Lyonnais': 'Lyon',
    'Paris Saint-Germain': 'PSG', 'Brighton Hove': 'Brighton', 'Leeds United': 'Leeds',
    'Sevilla FC': 'Séville', 'Celta': 'Celta Vigo', 'Bremen': 'Werder Brême',
    '1. FC Köln': 'Cologne', 'HSV': 'Hambourg', 'Mainz': 'Mayence',
    'Stade Rennais': 'Rennes', 'RC Lens': 'Lens', 'Angers SCO': 'Angers',
    'Bologna': 'Bologne', 'Venezia FC': 'Venise', 'Mineiro': 'Atlético Mineiro',
    'Paranaense': 'Athletico-PR',
}


def luminance(hexc):
    r, g, b = (int(hexc[i:i + 2], 16) / 255 for i in (1, 3, 5))
    return 0.299 * r + 0.587 * g + 0.114 * b


def club_colors(api_colors):
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


def main():
    ea = json.load(open(os.path.join(CACHE, 'ea.json'), encoding='utf-8'))
    curated = json.load(open(os.path.join(CACHE, 'curated.json'), encoding='utf-8'))
    star_norms = {norm(r[0]) for r in curated}

    rows, seen = [], {}
    warn_nation, warn_pos, dropped = set(), set(), 0

    # ── 1. Base EA : triée par note décroissante — en cas d'homonymie (même nom
    # normalisé), c'est le joueur le plus coté qui garde le nom.
    hommes = [p for p in ea if p.get('gender') == 0 and p.get('team') and p.get('league')
              and p.get('nation') and p.get('birthdate') and p.get('note')]
    hommes.sort(key=lambda p: -p['note'])
    for p in hommes:
        name = p['commonName'] or ((p['firstName'] or '') + ' ' + (p['lastName'] or '')).strip()
        name = NAME_FIX.get(name, name)
        pos = POS_ID.get(str(p['posId']))
        if not name or not pos:
            warn_pos.add(str(p['posId']))
            dropped += 1
            continue
        nat = NAT_RENAME.get(p['nation'], p['nation'])
        info = FR_NAT.get(nat)
        if not info:
            warn_nation.add(p['nation'])
            info = (None, '?')
        try:
            year = int(p['birthdate'].split('/')[2].split(' ')[0])
        except Exception:
            dropped += 1
            continue
        key = norm(name)
        if key in seen:
            continue
        seen[key] = True
        iso, conf = info
        club = CLUB_RENAME.get(p['team'], p['team'])
        league = LEAGUE_RENAME.get(p['league'], p['league'])
        tier = 1 if (key in star_norms or p['note'] >= STAR_NOTE) else 2
        rows.append([name, club, league, nat, flag(iso) if iso else '🏳️', conf, pos, year, tier, p['note']])
    n_ea = len(rows)

    # ── 2. Fusion football-data : comble les trous de licence EA (Eredivisie,
    # Brésil, joueurs manquants) — sans note : devinables, pas collectionnables.
    clubs_colors, n_fd = {}, 0
    for code, league in FD_LEAGUES:
        path = os.path.join(CACHE, code + '.json')
        if not os.path.exists(path):
            print('⚠ cache football-data manquant :', code)
            continue
        data = json.load(open(path, encoding='utf-8'))
        for team in data.get('teams', []):
            club = team.get('shortName') or team['name']
            club = FD_CLUB_RENAME.get(club, club)
            cc = club_colors(team.get('clubColors'))
            if cc and club not in clubs_colors:
                clubs_colors[club] = cc
            for pl in team.get('squad', []):
                name, nat_en, pos, dob = pl.get('name'), pl.get('nationality'), pl.get('position'), pl.get('dateOfBirth')
                if not (name and nat_en and pos and dob) or pos == 'null':
                    continue
                key = norm(name)
                if key in seen:
                    continue
                p2 = POS_FD.get(pos.lower().strip())
                nat = EN_NAT.get(nat_en.lower().strip())
                if not p2:
                    continue
                if not nat:
                    warn_nation.add(nat_en)
                    nat, info = nat_en, (None, '?')
                else:
                    info = FR_NAT[nat]
                seen[key] = True
                iso, conf = info
                tier = 1 if key in star_norms else 2
                rows.append([name, club, league, nat, flag(iso) if iso else '🏳️', conf, p2, int(dob[:4]),
                             tier, NOTE_REINJECT if tier == 1 else 0])
                n_fd += 1

    # ── 3. Stars curées toujours absentes : réinjection telle quelle
    kept = 0
    for r in curated:
        if norm(r[0]) in seen:
            continue
        seen[norm(r[0])] = True
        rows.append(r + [1, NOTE_REINJECT])
        kept += 1
        print('  + star réinjectée :', r[0], '(' + r[1] + ')')

    n_stars = sum(1 for r in rows if r[8] == 1)
    bands = {'💎 légende (87+)': sum(1 for r in rows if r[9] >= 87),
             '🟡 or (84-86)': sum(1 for r in rows if 84 <= r[9] < 87),
             '⚪ argent (80-83)': sum(1 for r in rows if 80 <= r[9] < 84),
             '🟤 bronze (76-79)': sum(1 for r in rows if 76 <= r[9] < 80)}

    out = []
    out.append('// Base de joueurs du Joueur Mystère — générée par build_data.py (édition EA FC)')
    out.append('// Sources : EA drop-api (notes officielles) + football-data.org (trous de licence) + stars curées.')
    out.append('// Format : [nom, club, championnat, nation, drapeau, confédération, poste, année de naissance, tier, note]')
    out.append('// tier 1 = star (mystères jour/marathon/duel) ; note 0 = devinable mais hors album. NE PAS ÉDITER À LA MAIN.')
    out.append('window.JM_DATA = /*JM-DATA*/[')
    out.append(',\n'.join(json.dumps(r, ensure_ascii=False) for r in rows))
    out.append(']/*JM-DATA-END*/;')
    out.append('// Couleurs officielles des clubs (football-data) — les clubs curés de app.js ont priorité')
    out.append('window.JM_CLUBS = ' + json.dumps(clubs_colors, ensure_ascii=False, sort_keys=True) + ';')
    open(os.path.join(ROOT, 'data.js'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')

    print('joueurs : %d (EA %d + football-data %d + stars réinjectées %d)' % (len(rows), n_ea, n_fd, kept))
    print('stars (tier 1) :', n_stars, '| album (note ≥ 76) :', sum(1 for r in rows if r[9] >= 76))
    for k, v in bands.items():
        print(' ', k, ':', v)
    print('ignorés (incomplets/poste inconnu) :', dropped)
    if warn_nation:
        print('⚠ nations sans mapping :', sorted(warn_nation))
    if warn_pos:
        print('⚠ posId inconnus :', sorted(warn_pos))


if __name__ == '__main__':
    main()
