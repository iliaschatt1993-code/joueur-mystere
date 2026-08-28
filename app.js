(function () {
  'use strict';

  var DATA = window.JM_DATA;
  var CFG = window.JM_CONFIG || {};
  var SITE = 'https://joueurmystere.com/';
  var MAX_TRIES = 6;
  var EPOCH = '2026-08-27'; // n°1 du mode jour

  var LEAGUE_FLAG = {
    'Premier League': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'La Liga': '🇪🇸', 'Serie A': '🇮🇹', 'Bundesliga': '🇩🇪', 'Ligue 1': '🇫🇷',
    'Pro League': '🇧🇪', 'Saudi Pro League': '🇸🇦', 'MLS': '🇺🇸', 'Liga Portugal': '🇵🇹', 'Eredivisie': '🇳🇱',
    'Süper Lig': '🇹🇷', 'Brasileirão': '🇧🇷', 'Primera División ARG': '🇦🇷',
    'Championship': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'League One': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'League Two': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'La Liga 2': '🇪🇸', 'Serie B': '🇮🇹', 'Ligue 2': '🇫🇷', 'Bundesliga 2': '🇩🇪', '3. Liga': '🇩🇪',
    'Ekstraklasa': '🇵🇱', 'SuperLiga roumaine': '🇷🇴', 'Superliga danoise': '🇩🇰',
    'Super League suisse': '🇨🇭', 'Bundesliga autrichienne': '🇦🇹', 'Premiership écossaise': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'Championnat d’Irlande': '🇮🇪', 'Championnat de Grèce': '🇬🇷', 'Championnat de Tchéquie': '🇨🇿',
    'Championnat de Croatie': '🇭🇷', 'Championnat d’Ukraine': '🇺🇦', 'Championnat de Hongrie': '🇭🇺',
    'Chinese Super League': '🇨🇳', 'K League 1': '🇰🇷', 'A-League': '🇦🇺', 'Indian Super League': '🇮🇳',
    'Copa Libertadores': '🌎', 'Copa Sudamericana': '🌎', 'Eliteserien': '🇳🇴', 'Allsvenskan': '🇸🇪'
  };
  // Postes fins ; la « ligne » (G/D/M/A) sert au 🟨 et à l'indice de départ
  var POS_LABEL = {
    G: 'Gardien', DC: 'Déf. central', LD: 'Latéral droit', LG: 'Latéral gauche',
    MDC: 'Milieu déf.', MC: 'Milieu', MO: 'Milieu off.', AD: 'Ailier droit', AG: 'Ailier gauche', BU: 'Avant-centre'
  };
  var POS_LINE = { G: 'G', DC: 'D', LD: 'D', LG: 'D', MDC: 'M', MC: 'M', MO: 'M', AD: 'A', AG: 'A', BU: 'A' };
  var LINE_PHRASE = { G: 'un gardien', D: 'un défenseur', M: 'un milieu', A: 'un attaquant' };
  var ALIASES = { 'cristiano ronaldo': 'cr7', 'kevin de bruyne': 'kdb' };

  // Couleurs de maillot par club [fond, second, texte] — repli : teinte dérivée du nom
  var CLUB_COLORS = {
    'AC Milan': ['#d50032', '#1a1a1a', '#fff'], 'AS Roma': ['#8e1f2f', '#f0bc42', '#fff'],
    'Ajax': ['#fff', '#d2122e', '#d2122e'], 'Al-Ahli': ['#00693e', '#fff', '#fff'],
    'Al-Hilal': ['#1451a1', '#fff', '#fff'], 'Al-Ittihad': ['#ffd500', '#1a1a1a', '#1a1a1a'],
    'Al-Nassr': ['#ffd200', '#1c3d6d', '#1c3d6d'], 'Al-Qadsiah': ['#ffc20e', '#005baa', '#005baa'],
    'Arsenal': ['#ef0107', '#fff', '#fff'], 'Aston Villa': ['#67002f', '#95bfe5', '#95bfe5'],
    'Atalanta': ['#1c62b7', '#1a1a1a', '#fff'], 'Athletic Bilbao': ['#ee2523', '#fff', '#fff'],
    'Atlético Madrid': ['#cb3524', '#fff', '#fff'], 'Bayern Munich': ['#dc052d', '#fff', '#fff'],
    'Benfica': ['#e83030', '#fff', '#fff'], 'Brighton': ['#0057b8', '#fff', '#fff'],
    'Chelsea': ['#034694', '#fff', '#fff'], 'Chicago Fire': ['#c8102e', '#141946', '#fff'],
    'Club Bruges': ['#0d5eaf', '#1a1a1a', '#fff'], 'Crystal Palace': ['#1b458f', '#c4122e', '#fff'],
    'Côme': ['#041c2c', '#fff', '#fff'], 'Dortmund': ['#fde100', '#1a1a1a', '#1a1a1a'],
    'Everton': ['#003399', '#fff', '#fff'], 'FC Barcelone': ['#a50044', '#004d98', '#fff'],
    'FC Porto': ['#00428c', '#fff', '#fff'], 'Fenerbahçe': ['#163e90', '#ffed00', '#ffed00'],
    'Fiorentina': ['#582c83', '#fff', '#fff'], 'Francfort': ['#e1000f', '#1a1a1a', '#fff'],
    'Fulham': ['#fff', '#1a1a1a', '#1a1a1a'], 'Galatasaray': ['#a90432', '#fdb912', '#fdb912'],
    'Inter Miami': ['#f7b5cd', '#231f20', '#231f20'], 'Inter Milan': ['#0068a8', '#1a1a1a', '#fff'],
    'Juventus': ['#1a1a1a', '#fff', '#fff'], 'Lazio': ['#87d8f7', '#fff', '#1a3c5e'],
    'Leeds': ['#fff', '#1d428a', '#1d428a'], 'Leverkusen': ['#e32219', '#1a1a1a', '#fff'],
    'Lille': ['#e01e13', '#12284b', '#fff'], 'Liverpool': ['#c8102e', '#fff', '#fff'],
    'Los Angeles FC': ['#1a1a1a', '#c39e6d', '#c39e6d'], 'Lyon': ['#fff', '#da291c', '#14387f'],
    'Man City': ['#6cabdd', '#fff', '#fff'], 'Man United': ['#da291c', '#fbe122', '#fff'],
    'Marseille': ['#fff', '#2faee0', '#2faee0'], 'Monaco': ['#e63312', '#fff', '#fff'],
    'NEOM SC': ['#00b2a9', '#1a1a1a', '#fff'], 'Naples': ['#12a0d7', '#fff', '#fff'],
    'Newcastle': ['#241f20', '#fff', '#fff'], 'Nottingham Forest': ['#dd0000', '#fff', '#fff'],
    'PSG': ['#004170', '#da291c', '#fff'], 'PSV': ['#ed1c24', '#fff', '#fff'],
    'RB Leipzig': ['#dd013f', '#fff', '#fff'], 'Real Betis': ['#00954c', '#fff', '#fff'],
    'Real Madrid': ['#fff', '#febe10', '#1a1a1a'], 'Real Sociedad': ['#0067b1', '#fff', '#fff'],
    'Rosario Central': ['#002d72', '#ffd100', '#ffd100'], 'Santos': ['#fff', '#1a1a1a', '#1a1a1a'],
    'Sassuolo': ['#00a752', '#1a1a1a', '#fff'], 'Sporting CP': ['#008557', '#fff', '#fff'],
    'Stuttgart': ['#fff', '#e32219', '#e32219'], 'Sunderland': ['#eb172b', '#fff', '#fff'],
    'Tottenham': ['#fff', '#132257', '#132257'], 'Trabzonspor': ['#841e35', '#5ec2e0', '#fff'],
    'Vancouver': ['#04265c', '#94c2e4', '#fff'], 'West Ham': ['#7a263a', '#1bb1e7', '#fff']
  };
  function clubColors(club) {
    if (CLUB_COLORS[club]) return CLUB_COLORS[club];
    if (window.JM_CLUBS && window.JM_CLUBS[club]) return window.JM_CLUBS[club];
    var h = fnv('club:' + club) % 360;
    return ['hsl(' + h + ',55%,38%)', 'hsl(' + ((h + 40) % 360) + ',55%,26%)', '#fff'];
  }
  // ── Drapeaux : émojis si la plateforme les rend (pas Windows/Opera), sinon écusson texte ──
  var FLAG_OK = (function () {
    try {
      var cv = document.createElement('canvas'); cv.width = cv.height = 20;
      var cx = cv.getContext('2d');
      cx.textBaseline = 'top'; cx.font = '16px sans-serif';
      cx.fillText('🇧🇪', 0, 0);
      var d = cx.getImageData(0, 0, 20, 20).data;
      for (var i = 0; i < d.length; i += 4) {
        if (d[i + 3] > 16 && (Math.abs(d[i] - d[i + 1]) > 24 || Math.abs(d[i + 1] - d[i + 2]) > 24)) return true;
      }
      return false;
    } catch (e) { return true; }
  })();
  function flagCode(emoji) {
    var out = '';
    for (var i = 0; i < emoji.length;) {
      var c = emoji.codePointAt(i);
      if (c >= 0x1F1E6 && c <= 0x1F1FF) out += String.fromCharCode(65 + c - 0x1F1E6);
      else if (c >= 0xE0061 && c <= 0xE007A) out += String.fromCharCode(97 + c - 0xE0061);
      i += c > 0xFFFF ? 2 : 1;
    }
    var TAG = { gbeng: 'ANG', gbsct: 'ÉCO', gbwls: 'GAL' };
    return TAG[out] || out.toUpperCase() || '·';
  }
  function flagHTML(emoji) {
    return FLAG_OK ? emoji : '<span class="flag-chip">' + flagCode(emoji) + '</span>';
  }
  function clubInitials(club) {
    var words = club.replace(/-/g, ' ').split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
    return words.map(function (w) { return w.charAt(0); }).join('').slice(0, 3).toUpperCase();
  }
  function clubBadge(club) {
    var c = clubColors(club);
    return '<span class="club-badge" style="background:linear-gradient(135deg,' + c[0] + ' 55%,' + c[1] + ' 55%);color:' + c[2] + '">' + clubInitials(club) + '</span>';
  }
  // Maillot SVG — couleurs du club, l'âge en numéro ; mystère = gris avec « ? »
  function jerseySVG(p, mystery) {
    var c = mystery ? ['#c9bc9e', '#b0a184', '#f3ead8'] : clubColors(p[1]);
    var label = mystery ? '?' : String(ageOf(p));
    return '<svg viewBox="0 0 140 122" aria-hidden="true">' +
      '<path d="M38 16 L8 36 L22 58 L36 48 Z" fill="' + c[1] + '" stroke="#22251f" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M102 16 L132 36 L118 58 L104 48 Z" fill="' + c[1] + '" stroke="#22251f" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M38 16 L54 12 Q70 30 86 12 L102 16 L104 48 L102 116 L38 116 L36 48 Z" fill="' + c[0] + '" stroke="#22251f" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M54 12 Q70 30 86 12" fill="none" stroke="' + c[1] + '" stroke-width="5"/>' +
      '<text x="70" y="86" text-anchor="middle" font-family="Alfa Slab One, Rockwell, serif" font-size="38" fill="' + c[2] + '" stroke="#22251f" stroke-width="1.2" paint-order="stroke">' + label + '</text>' +
      '</svg>';
  }
  // Confettis de victoire (aucune dépendance, retirés tout seuls)
  function confetti(n) {
    var wrap = document.createElement('div');
    wrap.className = 'confetti';
    var colors = ['#c8342c', '#2e7d46', '#c9a227', '#f5d9a8', '#22251f'];
    for (var i = 0; i < (n || 70); i++) {
      var s = document.createElement('i');
      s.style.left = (Math.random() * 100) + '%';
      s.style.background = colors[i % colors.length];
      s.style.animationDelay = (Math.random() * 0.6) + 's';
      s.style.animationDuration = (1.6 + Math.random() * 1.4) + 's';
      s.style.transform = 'rotate(' + Math.floor(Math.random() * 360) + 'deg)';
      wrap.appendChild(s);
    }
    document.body.appendChild(wrap);
    setTimeout(function () { wrap.remove(); }, 3400);
  }

  // ── Stockage : refus jamais silencieux ──
  var storageOK = true;
  function load(k, fb) { try { var v = localStorage.getItem(k); return v === null ? fb : v; } catch (e) { storageOK = false; return fb; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) { storageOK = false; document.getElementById('storage-warn').hidden = false; } }
  function loadJSON(k, fb) { try { var v = load(k, null); return v === null ? fb : JSON.parse(v); } catch (e) { return fb; } }

  // ── Dates, hachage, aléatoire seedé ──
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function fnv(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return h >>> 0;
  }
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function daysBetween(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000); }

  var DAY = todayStr();
  var PUZZLE_NUM = daysBetween(EPOCH, DAY) + 1;
  var AGE_YEAR = new Date().getFullYear();
  function ageOf(p) { return AGE_YEAR - p[7]; }
  var ROUND_SECS = 120; // marathon CLASSÉ : temps par joueur (anti-triche : pas de réflexion infinie ; 120 s = réglé pour la saisie mobile)
  // Difficultés de l'entraînement libre. Le classé, lui, est identique pour
  // tout le monde (stars + 120 s) : un classement n'a de sens qu'à règles égales.
  var DIFFS = {
    facile:    { label: 'Facile',    tous: false, secs: null },
    moyen:     { label: 'Moyen',     tous: false, secs: 120 },
    difficile: { label: 'Difficile', tous: true,  secs: null },
    elite:     { label: 'Élite',     tous: true,  secs: 120 }
  };
  var diff = load('jm-diff', 'facile');
  if (!DIFFS[diff]) diff = 'facile';
  // 🃏 Jokers roguelite (entraînement libre UNIQUEMENT — le classé reste à règles égales).
  // À chaque nouvelle série : 3 jokers tirés au sort, on en choisit 1, il vaut pour toute la run.
  var JOKER_DEFS = {
    souffle:   { icon: '⏱️', nom: 'Souffle',        desc: '+45 s au chrono de chaque joueur' },
    loupe:     { icon: '🏟️', nom: 'La loupe',       desc: 'Le championnat du mystère est révélé' },
    etatcivil: { icon: '🎂', nom: 'État civil',     desc: 'L’âge exact du mystère est révélé' },
    septieme:  { icon: '🧤', nom: 'Le 7e essai',    desc: '7 essais au lieu de 6' },
    boussole:  { icon: '🧭', nom: 'La boussole',    desc: 'Le poste exact est révélé (pas juste la ligne)' },
    coeur:     { icon: '❤️', nom: 'Seconde chance', desc: 'Le premier raté ne termine pas la série' }
  };
  function fmtSecs(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

  function norm(s) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  // Noms normalis\u00e9s pr\u00e9calcul\u00e9s (4 000+ joueurs : indispensable pour une saisie fluide)
  var NORMS = DATA.map(function (p) { return norm(p[0]); });
  // Vivier des myst\u00e8res : les stars (tier 1). Le reste n'est que devinable.
  var STAR_IDX = [];
  for (var _i = 0; _i < DATA.length; _i++) if (DATA[_i][8] === 1) STAR_IDX.push(_i);
  function randomStar() { return STAR_IDX[Math.floor(Math.random() * STAR_IDX.length)]; }
  // \u2500\u2500 \ud83d\udc8e Raret\u00e9 (base EA) : p[9] = note officielle EA FC \u2500\u2500
  // 4 bandes de cartes. L'ALBUM = tous les joueurs assez cot\u00e9s pour \u00eatre un
  // myst\u00e8re jouable (avec les coups de pouce) ; en-dessous, on n'est que devinable.
  function noteOf(p) { return p[9] || 0; }
  var BANDS = {
    legende: { nom: 'L\u00c9GENDE', icon: '\ud83d\udc8e', adj: 'l\u00e9gendaire' },
    or:      { nom: 'OR',      icon: '\ud83d\udfe1', adj: 'r\u00e9put\u00e9' },
    argent:  { nom: 'ARGENT',  icon: '\u26aa', adj: 'confirm\u00e9' },
    bronze:  { nom: 'BRONZE',  icon: '\ud83d\udfe4', adj: 'confidentiel' }
  };
  // Album \u00e0 partir de 80 (v13) : 486 cartes, toutes reconnaissables \u2014 une carte
  // qu'on ne reconna\u00eet pas n'est pas une r\u00e9compense. Les 76-79 restent devinables
  // comme essais, ils sortent juste de la collection.
  var NOTE_LEGENDE = 87, NOTE_OR = 84, NOTE_ARGENT = 80, NOTE_ALBUM = 80;
  function bandOf(p) {
    var n = noteOf(p);
    return n >= NOTE_LEGENDE ? 'legende' : n >= NOTE_OR ? 'or' : n >= NOTE_ARGENT ? 'argent' : 'bronze';
  }
  var ALBUM_IDX = [], ALBUM_SET = {}, BAND_IDX = { legende: [], or: [], argent: [], bronze: [] };
  for (var _k = 0; _k < DATA.length; _k++) {
    if (noteOf(DATA[_k]) < NOTE_ALBUM) continue;
    ALBUM_IDX.push(_k);
    ALBUM_SET[DATA[_k][0]] = 1;
    BAND_IDX[bandOf(DATA[_k])].push(_k);
  }
  // Base sans notes (vieux data.js en cache) : on retombe sur les stars
  if (!ALBUM_IDX.length) {
    ALBUM_IDX = STAR_IDX.slice();
    ALBUM_IDX.forEach(function (i) { ALBUM_SET[DATA[i][0]] = 1; BAND_IDX.or.push(i); });
  }
  function randomAny() { return ALBUM_IDX[Math.floor(Math.random() * ALBUM_IDX.length)]; }
  function findPlayer(name) {
    var n = norm(name);
    var i = NORMS.indexOf(n);
    return i === -1 ? null : DATA[i];
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }

  // ── Éléments ──
  var el = {};
  ['puzzle-meta', 'tab-jour', 'tab-marathon', 'tab-duel', 'marathon-bar', 'mb-label', 'mb-serie', 'mb-best', 'btn-abandon',
   'diff-picker', 'podium-diff', 'btn-duel-expert', 'joker-draft', 'btn-theme',
   'start-hint', 'guess-zone', 'guess-input', 'btn-guess', 'suggestions', 'notice', 'chrono', 'tries', 'notes', 'board',
   'round-banner', 'hint', 'duel-intro', 'btn-duel-new', 'endcard', 'end-visual', 'end-verdict', 'end-player', 'end-desc', 'end-streak',
   'end-social', 'btn-again', 'btn-share', 'duel-share', 'duel-url', 'btn-copy-duel', 'btn-send-duel', 'wa-duel', 'copy-feedback', 'countdown',
   'stats', 's-played', 's-rate', 's-streak', 's-max', 'podium', 'podium-list',
   'classement', 'classement-list', 'classement-note', 'btn-refresh-classement',
   'pseudo-dialog', 'pseudo-input', 'btn-pseudo-ok', 'storage-warn', 'data-count',
   'dp-note', 'intro-dialog', 'btn-intro-go', 'btn-intro-rules',
   'intro-pseudo', 'intro-club', 'club-banner', 'club-dialog', 'club-select', 'btn-club-ok',
   'salon-zone', 'salon-boards', 'btn-salon-new', 'salon-dialog', 'salon-dlg-titre', 'salon-nom',
   'salon-pseudo', 'salon-num', 'salon-couleurs', 'salon-avatar', 'btn-salon-ok', 'btn-salon-annuler',
   'tab-coupe', 'coupe-intro', 'btn-coupe-new', 'coupe-palmares', 'coupe-bar', 'coupe-rounds', 'coupe-budget',
   'btn-coupe-abandon', 'btn-album', 'album-panel', 'album-grid', 'album-count', 'btn-album-close', 'alb-toggle',
   'end-note', 'end-album', 'pack-zone', 'btn-pack', 'pack-card'].forEach(function (id) {
    el[id] = document.getElementById(id);
  });
  el['data-count'].textContent = DATA.length.toLocaleString('fr-BE');
  el['puzzle-meta'].textContent =
    'N°' + PUZZLE_NUM + ' · ' + new Date(DAY + 'T12:00:00').toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' });

  // ── État JOUR ──
  var TARGET_JOUR = DATA[STAR_IDX[fnv('joueur-mystere:' + DAY) % STAR_IDX.length]];
  var jour = loadJSON('jm-' + DAY, { g: [], done: false, won: false });
  // Le chrono du jour démarre à la première ouverture du mystère (persisté : recharger ne le remet pas à zéro)
  if (!jour.done && !jour.t0) { jour.t0 = Date.now(); save('jm-' + DAY, JSON.stringify(jour)); }
  var statsJour = loadJSON('jm-stats', { played: 0, wins: 0, streak: 0, maxStreak: 0, lastWin: null });

  // ── État MARATHON ──
  // Marathon DU JOUR (classé) : même séquence pour tout le monde, une tentative par jour.
  // Séquence identique pour tout le monde (seed du jour), mais équilibrée par ligne
  // depuis le 29/08 : le mélange brut enchaînait les attaquants (44 % du vivier de stars).
  var mdayOrder = (function () {
    var rng = mulberry32(fnv('marathon:' + DAY));
    var idx = STAR_IDX.slice();
    for (var i = idx.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = idx[i]; idx[i] = idx[j]; idx[j] = tmp;
    }
    var buckets = { G: [], D: [], M: [], A: [] }, lines = ['A', 'M', 'D', 'G'];
    idx.forEach(function (i) { buckets[POS_LINE[DATA[i][6]]].push(i); });
    var out = [], prev = '';
    while (out.length < idx.length) {
      // Tirage seedé pondéré par le stock restant, ligne précédente exclue :
      // défenseurs et gardiens sont répartis sur toute la séquence, sans motif mécanique.
      var elig = lines.filter(function (l) { return buckets[l].length && l !== prev; });
      if (!elig.length) elig = [prev];
      var total = 0;
      elig.forEach(function (l) { total += buckets[l].length; });
      var r = rng() * total, pick = elig[0];
      for (var k = 0; k < elig.length; k++) { r -= buckets[elig[k]].length; if (r < 0) { pick = elig[k]; break; } }
      out.push(buckets[pick].shift());
      prev = pick;
    }
    return out;
  })();
  var mday = loadJSON('jm-mday-' + DAY, { serie: 0, g: [], done: false });
  // Entraînement libre (après le classé du jour) : aléatoire, illimité
  var run = loadJSON('jm-run', null);
  var podium = loadJSON('jm-podium', []);
  var recent = loadJSON('jm-recent', []);
  // Migration : l'ancien record unique devient le record « moyen » (mêmes règles)
  if (load('jm-mbest', null) !== null && load('jm-mbest-moyen', null) === null) {
    save('jm-mbest-moyen', load('jm-mbest', '0'));
  }

  function mdayTarget() { return DATA[mdayOrder[mday.serie % mdayOrder.length]]; }
  function ranked() { return !mday.done; } // le marathon est classé tant que la tentative du jour n'est pas finie
  // Le classé partage les règles du « moyen » : record et podium communs
  function diffKey(rankedFlag) { return rankedFlag ? 'moyen' : diff; }
  function getBest() { return parseInt(load('jm-mbest-' + diffKey(ranked()), '0'), 10) || 0; }
  function recordSerie(s, dk) {
    if (s <= 0) return false;
    podium.push({ s: s, d: DAY, k: dk });
    podium.sort(function (a, b) { return b.s - a.s; });
    podium = podium.slice(0, 40);
    save('jm-podium', JSON.stringify(podium));
    var key = 'jm-mbest-' + dk;
    var best = parseInt(load(key, '0'), 10) || 0;
    if (s >= best) { save(key, String(Math.max(s, best))); return true; }
    return false;
  }
  function timeLimit() {
    if (ranked()) return ROUND_SECS;
    var s = DIFFS[diff].secs;
    if (s && run && run.joker === 'souffle') s += 45;
    return s;
  }
  function maxTriesNow() {
    // Coupe : 6 essais max par tour, mais jamais plus que le budget restant du tournoi
    if (MODE === 'coupe') return coupe ? Math.max(1, Math.min(MAX_TRIES, COUPE_BUDGET - coupe.used)) : MAX_TRIES;
    return (MODE === 'marathon' && !ranked() && run && run.joker === 'septieme') ? 7 : MAX_TRIES;
  }
  var lastPracticeLine = '';
  function pickPracticeTarget() {
    // « toute la base » = toutes les cartes de l'album (cotées jouables) — jamais
    // les joueurs sous le plancher, indevinables même avec les coups de pouce
    var all = (DIFFS[diff].tous ? ALBUM_IDX : STAR_IDX).map(function (i) { return DATA[i]; });
    var pool = all.filter(function (p) { return recent.indexOf(p[0]) === -1; });
    if (!pool.length) { recent = []; pool = all; }
    // Variété : jamais deux cibles de la même ligne d'affilée quand c'est possible
    var varied = lastPracticeLine ? pool.filter(function (p) { return POS_LINE[p[6]] !== lastPracticeLine; }) : pool;
    if (varied.length) pool = varied;
    var p = pool[Math.floor(Math.random() * pool.length)];
    lastPracticeLine = POS_LINE[p[6]];
    recent.push(p[0]);
    if (recent.length > 40) recent = recent.slice(-40);
    save('jm-recent', JSON.stringify(recent));
    return p;
  }
  function newPracticeRun() { run = { target: pickPracticeTarget()[0], g: [], serie: 0 }; save('jm-run', JSON.stringify(run)); }

  // ── État DUEL ──
  var DUEL_KEY = 1337;
  function duelEncode(i) { return ((i + 100) ^ DUEL_KEY).toString(36); }
  function duelDecode(code) { var i = (parseInt(code, 36) ^ DUEL_KEY) - 100; return (i >= 0 && i < DATA.length) ? i : -1; }
  var duel = null; // { code, target, g, done, won, challenger: {name, score} | null, mine: bool }
  function parseDuelHash() {
    var m = location.hash.match(/^#d=([a-z0-9]+)(.*)$/);
    if (!m) return null;
    var i = duelDecode(m[1]);
    if (i < 0) return null;
    var rest = m[2] || '';
    var s = rest.match(/&s=(\d+)/), t = rest.match(/&t=(\d+)/), n = rest.match(/&n=([^&]*)/);
    return {
      code: m[1], idx: i,
      challengerScore: s ? parseInt(s[1], 10) : null,
      challengerSecs: t ? parseInt(t[1], 10) : null,
      challengerName: n ? decodeURIComponent(n[1]).slice(0, 20) : null
    };
  }
  var incomingDuel = parseDuelHash();

  // ── 🏆 État COUPE : tournoi à élimination directe, budget d'essais partagé ──
  // La partie a un ARC : on n'y « meurt » pas, on est éliminé à un stade, et toute
  // run — même perdue — se termine par une note sur 100. C'est ce qui donne envie
  // de relancer (« j'étais en demi ! »), là où la survie infinie finit toujours mal.
  var COUPE_BUDGET = 20; // pour les 5 tours : la vraie ressource du mode
  var COUPE_ROUNDS = [
    { label: '16es de finale', court: '16ES' },
    { label: '8es de finale', court: '8ES' },
    { label: 'quarts de finale', court: 'QUARTS' },
    { label: 'demi-finale', court: 'DEMI' },
    { label: 'finale', court: 'FINALE' }
  ];
  var COUPE_ELIM_TITRES = [
    'Sorti d’entrée, en 16es…',
    'Éliminé en 8es de finale',
    'Éliminé en quarts de finale',
    'Si proche… tombé en demi-finale',
    'Finaliste — battu sur le fil'
  ];
  var COUPE_ELIM_PTS = [10, 25, 40, 60, 75];
  var coupe = loadJSON('jm-coupe', null);
  var coupeStats = loadJSON('jm-coupe-stats', { runs: 0, trophees: 0, best: 0 });
  var album = loadJSON('jm-album', {}); // { nom du joueur: date de la 1re capture }
  var albGroup = load('jm-alb-group', 'champ');
  // Base regénérée entre deux visites : une cible disparue invaliderait la run.
  // Et une run d'avant la refonte v13 (courbe, budget, packs) repart de zéro.
  if (coupe && (coupe.v !== 13 || !coupe.targets || coupe.targets.some(function (n) { return !findPlayer(n); }))) coupe = null;
  function saveCoupe() { save('jm-coupe', JSON.stringify(coupe)); }
  function coupeTarget() { return findPlayer(coupe.targets[Math.min(coupe.round, 4)]); }
  function coupeRoundPhrase(i) { return (i >= 3 ? 'la ' : 'les ') + COUPE_ROUNDS[i].label; }
  // ⚔️ v13 : la Coupe MONTE vers la gloire. Tous les mystères viennent de
  // l'album (≥80) : chaque tour gagné colle une vignette. 16es = or connus,
  // 8es/quarts = argent, demi = tout l'argent avec des aides réduites (le test
  // passe par les aides, plus par l'obscurité), finale = boss 💎 légende que
  // tout le monde connaît — elle se gagne au budget restant, pas à l'érudition.
  var COUPE_TOUR_NOTES = [[84, 86], [82, 83], [80, 81], [80, 83], [87, 99]];
  var TOUR_IDX = COUPE_TOUR_NOTES.map(function (mm) {
    var out = [];
    for (var i = 0; i < DATA.length; i++) {
      var n = noteOf(DATA[i]);
      // Cibles stockées par NOM (les index bougent à chaque régénération de la
      // base) : on écarte du tirage tout nom non unique (homonymes).
      if (n >= mm[0] && n <= mm[1] && findPlayer(DATA[i][0]) === DATA[i]) out.push(i);
    }
    return out.length ? out : STAR_IDX.slice(); // vieux data.js sans notes : repli stars
  });
  var coupeRecent = loadJSON('jm-coupe-recent', []);
  function drawCoupeTarget(round, dejaPris) {
    var pool = TOUR_IDX[round].filter(function (i) { return dejaPris.indexOf(DATA[i][0]) === -1; });
    var frais = pool.filter(function (i) { return coupeRecent.indexOf(DATA[i][0]) === -1; });
    if (frais.length) pool = frais;
    return DATA[pool[Math.floor(Math.random() * pool.length)]][0];
  }
  function newCoupeRun() {
    var picks = [];
    for (var r = 0; r < 5; r++) picks.push(drawCoupeTarget(r, picks));
    coupeRecent = coupeRecent.concat(picks).slice(-60);
    save('jm-coupe-recent', JSON.stringify(coupeRecent));
    coupe = { v: 13, targets: picks, round: 0, used: 0, g: [], done: false, won: false };
    saveCoupe();
  }
  // 📦 Le PACK de fin de run — la vraie récompense (économie Ultimate Team,
  // sans doublons) : plus tu vas loin, meilleures sont les probabilités de
  // bande ; et dans une bande, chaque point de note divise la chance par ~1,7
  // (un 91 est ~8× plus rare qu'un 87 : Mbappé et Messi se méritent).
  // v13 : 3 bandes (l'album démarre à l'argent). Un pack argent se révèle en
  // « choix 1 parmi 3 » : c'est le joueur qui sait quelle carte lui fait envie.
  var PACK_P = [ // [argent, or, legende] — index = stade atteint (5 = champion)
    [0.90, 0.09, 0.01],
    [0.84, 0.13, 0.03],
    [0.75, 0.20, 0.05],
    [0.62, 0.30, 0.08],
    [0.48, 0.40, 0.12],
    [0.25, 0.50, 0.25]
  ];
  var PACK_BANDS = ['argent', 'or', 'legende'];
  var BAND_BASE = { argent: NOTE_ARGENT, or: NOTE_OR, legende: NOTE_LEGENDE };
  function packManquantes(band) {
    return BAND_IDX[band].filter(function (i) {
      return !album[DATA[i][0]] && findPlayer(DATA[i][0]) === DATA[i];
    });
  }
  function drawFromBand(bi, excl) {
    var pool = packManquantes(PACK_BANDS[bi]).filter(function (i) { return excl.indexOf(DATA[i][0]) === -1; });
    if (!pool.length) return null;
    var total = 0, w = pool.map(function (i) {
      var wi = Math.pow(1.7, -(noteOf(DATA[i]) - BAND_BASE[PACK_BANDS[bi]]));
      total += wi;
      return wi;
    });
    var rr = Math.random() * total;
    for (var k = 0; k < pool.length; k++) { rr -= w[k]; if (rr < 0) return DATA[pool[k]][0]; }
    return DATA[pool[pool.length - 1]][0];
  }
  // Renvoie { band, names } — 3 noms pour un pack argent (choix), 1 sinon.
  // minBi = pitié : 3 packs argent d'affilée → le 4e est or garanti.
  function drawPackNames(stade, minBi) {
    var p = PACK_P[Math.min(stade, 5)];
    var r = Math.random(), bi = 0;
    for (var i = 0; i < 3; i++) { r -= p[i]; if (r < 0) { bi = i; break; } }
    if (bi < minBi) bi = minBi;
    // bande épuisée → on monte (jamais de déclassement) ; haut plein → on redescend
    var ordre = [];
    for (var j = bi; j < 3; j++) ordre.push(j);
    for (var j2 = bi - 1; j2 >= 0; j2--) ordre.push(j2);
    for (var o = 0; o < ordre.length; o++) {
      var b = ordre[o];
      var n1 = drawFromBand(b, []);
      if (!n1) continue;
      if (b === 0) {
        var names = [n1];
        for (var c = 0; c < 2; c++) {
          var nm = drawFromBand(0, names);
          if (nm) names.push(nm);
        }
        return { band: 0, names: names };
      }
      return { band: b, names: [n1] };
    }
    return null; // album complet
  }
  // 📔 Album : tout joueur coté trouvé (tous modes) colle sa vignette
  function collectPlayer(p) {
    if (!p || !ALBUM_SET[p[0]] || album[p[0]]) return false;
    album[p[0]] = DAY;
    save('jm-album', JSON.stringify(album));
    return true;
  }
  function albumCount() {
    var n = 0;
    ALBUM_IDX.forEach(function (i) { if (album[DATA[i][0]]) n++; });
    return n;
  }
  function coupeNote() {
    // Champion : 85 + bonus d'essais économisés (5 essais parfaits → 100).
    if (coupe.won) return Math.min(100, 85 + (COUPE_BUDGET - coupe.used));
    return COUPE_ELIM_PTS[coupe.round];
  }
  function finalizeCoupe() {
    coupe.note = coupeNote();
    // Tiré UNE fois, persisté (pas de re-roll au rechargement). Pitié : après
    // 3 runs soldées par un pack argent, la bande or est garantie.
    var minBi = (coupeStats.dry || 0) >= 3 ? 1 : 0;
    var tirage = drawPackNames(coupe.won ? 5 : coupe.round, minBi);
    coupe.pack = null; coupe.packChoices = null; coupe.packRevealed = false;
    coupe.packOpened = !tirage; // album complet : rien à ouvrir
    if (tirage) {
      if (tirage.names.length > 1) coupe.packChoices = tirage.names;
      else coupe.pack = tirage.names[0];
      coupeStats.dry = tirage.band === 0 ? (coupeStats.dry || 0) + 1 : 0;
    }
    coupeStats.runs += 1;
    if (coupe.won) coupeStats.trophees += 1;
    coupeStats.best = Math.max(coupeStats.best || 0, coupe.note);
    save('jm-coupe-stats', JSON.stringify(coupeStats));
    saveCoupe();
  }
  function coupeBanner(msg, ms) {
    renderCoupeBar();
    el['round-banner'].textContent = msg;
    el['round-banner'].hidden = false;
    el['guess-zone'].style.display = 'none';
    setTimeout(function () {
      el['round-banner'].hidden = true;
      if (MODE === 'coupe' && coupe && !coupe.done) {
        el['guess-zone'].style.display = 'block';
        renderBoard(); renderStartHint(); renderHint();
        el['guess-input'].focus();
      }
    }, ms);
  }
  function coupeWin() {
    var t = coupeTarget();
    // v13 : le joueur deviné colle sa vignette — micro-récompense immédiate,
    // même si la run échoue ensuite (les mystères de Coupe sont tous ≥ album).
    var vignette = collectPlayer(t);
    coupe.used += coupe.g.length;
    coupe.g = [];
    if (coupe.round >= 4) { // 🏆 finale gagnée
      coupe.done = true; coupe.won = true;
      finalizeCoupe();
      renderCoupeBar();
      confetti(150);
      showEnd();
      return;
    }
    coupe.round += 1;
    if (COUPE_BUDGET - coupe.used <= 0) { coupe.sec = true; endCoupe(); return; } // à sec avant le tour suivant
    saveCoupe();
    confetti(30);
    coupeBanner('✅ C’était bien ' + t[0] + ' !' + (vignette ? ' 📔 +1 vignette !' : '') +
      ' 🎯 ' + (COUPE_BUDGET - coupe.used) +
      ' essais restants — direction ' + coupeRoundPhrase(coupe.round) + '…', 2300);
  }
  function endCoupe() {
    coupe.done = true; coupe.won = false;
    finalizeCoupe();
    renderCoupeBar();
    showEnd();
  }
  function renderCoupeBar() {
    var active = MODE === 'coupe' && coupe && !coupe.done;
    el['coupe-bar'].style.display = active ? 'block' : 'none';
    if (!active) return;
    el['coupe-rounds'].innerHTML = COUPE_ROUNDS.map(function (r, i) {
      var cls = i < coupe.round ? ' done' : (i === coupe.round ? ' cur' : '');
      return '<span class="cr-step' + cls + '">' + (i < coupe.round ? '✓ ' : '') + r.court + '</span>';
    }).join('<span class="cr-sep">›</span>');
    var rest = COUPE_BUDGET - coupe.used - coupe.g.length;
    el['coupe-budget'].innerHTML = '🎯 <b>' + rest + '</b> essai' + (rest > 1 ? 's' : '') + ' pour tout le tournoi';
  }
  // Un pack tiré mais pas encore ouvert bloque le retour à l'affiche : fermer
  // la page ne doit jamais faire perdre une carte.
  function packEnAttente() { return !!(coupe && coupe.done && (coupe.pack || coupe.packChoices) && !coupe.packOpened); }
  function renderCoupeIntro() {
    var visible = MODE === 'coupe' && (!coupe || coupe.done) && !packEnAttente();
    el['coupe-intro'].hidden = !visible;
    if (!visible) return;
    el['btn-album'].textContent = '📔 MON ALBUM · ' + albumCount() + '/' + ALBUM_IDX.length;
    el['coupe-palmares'].innerHTML = coupeStats.runs
      ? '🏆 <b>' + coupeStats.trophees + '</b> trophée' + (coupeStats.trophees > 1 ? 's' : '') +
        ' · meilleure note <b>' + coupeStats.best + '</b>/100 · ' + coupeStats.runs + ' coupe' + (coupeStats.runs > 1 ? 's' : '') + ' disputée' + (coupeStats.runs > 1 ? 's' : '')
      : 'Personne au palmarès — sois le premier champion.';
  }
  function startCoupeRun() {
    // Relancer sans avoir ouvert son pack : la carte est créditée silencieusement
    // (pour un pack au choix non tranché, la première des trois fait foi)
    if (packEnAttente()) collectPlayer(findPlayer(coupe.pack || coupe.packChoices[0]));
    newCoupeRun();
    el.endcard.hidden = true;
    el['guess-zone'].style.display = 'block';
    renderCoupeIntro(); renderCoupeBar();
    renderBoard(); renderStartHint(); renderHint();
    el['guess-input'].focus();
  }
  el['btn-coupe-new'].addEventListener('click', startCoupeRun);
  var coupeAbandonArme = false;
  el['btn-coupe-abandon'].addEventListener('click', function () {
    if (MODE !== 'coupe' || !coupe || coupe.done) return;
    if (!coupeAbandonArme) {
      coupeAbandonArme = true;
      el['btn-coupe-abandon'].textContent = 'Sûr ?';
      setTimeout(function () { coupeAbandonArme = false; el['btn-coupe-abandon'].textContent = 'Abandonner'; }, 2500);
      return;
    }
    coupeAbandonArme = false;
    el['btn-coupe-abandon'].textContent = 'Abandonner';
    endCoupe();
  });
  // 📔 Album Panini : une section par championnat (ou par pays), les stars
  // trouvées en vignette maillot, les manquantes en maillot gris « ? ».
  function stickerHTML(p) {
    var d = album[p[0]];
    var cls = 'alb-sticker r-' + bandOf(p) + (d ? '' : ' manq');
    var note = noteOf(p) ? '<span class="alb-cote">' + noteOf(p) + '</span>' : '';
    if (!d) return '<div class="' + cls + '">' + note + jerseySVG(p, true) + '<span class="an">???</span><span class="ac">à trouver</span></div>';
    return '<div class="' + cls + '">' + note + (d === DAY ? '<span class="alb-new">NOUVEAU</span>' : '') +
      jerseySVG(p) + '<span class="an">' + esc(p[0].split(' ').slice(-1)[0]) + '</span><span class="ac">' + esc(p[1]) + '</span></div>';
  }
  function renderAlbum() {
    el['album-count'].textContent = albumCount() + '/' + ALBUM_IDX.length;
    Array.prototype.forEach.call(el['alb-toggle'].children, function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.g === albGroup));
    });
    var secs = {};
    ALBUM_IDX.forEach(function (i) {
      var p = DATA[i];
      var k = albGroup === 'pays' ? p[3] : p[2];
      (secs[k] = secs[k] || []).push(p);
    });
    var keys = Object.keys(secs).sort(function (a, b) {
      return secs[b].length - secs[a].length || a.localeCompare(b, 'fr');
    });
    el['album-grid'].innerHTML = keys.map(function (k) {
      // Dans chaque section : les grosses cotes d'abord (les cases qui font envie)
      var ps = secs[k].slice().sort(function (a, b) { return noteOf(b) - noteOf(a) || (a[1] + a[0]).localeCompare(b[1] + b[0], 'fr'); });
      var have = ps.filter(function (p) { return album[p[0]]; }).length;
      var flag = albGroup === 'pays' ? ps[0][4] : (LEAGUE_FLAG[k] || '⚽');
      return '<section class="alb-sec"><h4>' + flagHTML(flag) + ' ' + esc(k) +
        ' <span>' + have + '/' + ps.length + '</span></h4><div class="alb-grid">' +
        ps.map(stickerHTML).join('') + '</div></section>';
    }).join('');
  }
  function openAlbum() {
    renderAlbum();
    el['album-panel'].hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeAlbum() {
    el['album-panel'].hidden = true;
    document.body.style.overflow = '';
  }
  // 📦 Ouverture du pack : secousse d'une seconde (suspense), puis révélation —
  // état posé en synchrone + setTimeout, jamais de rAF (piège d'artifact connu)
  function packCardHTML(p) {
    var b = bandOf(p), bd = BANDS[b];
    return '<div class="pack-carte r-' + b + '">' +
      '<span class="pc-band">' + bd.icon + ' ' + bd.nom + '</span>' +
      '<span class="pc-note">' + noteOf(p) + '</span>' +
      jerseySVG(p) +
      '<b>' + flagHTML(p[4]) + ' ' + esc(p[0]) + '</b>' +
      '<span class="pc-club">' + esc(p[1]) + ' · ' + esc(p[2]) + '</span></div>';
  }
  function renderPackZone() {
    var pending = MODE === 'coupe' && coupe && coupe.done && (coupe.pack || coupe.packChoices);
    el['pack-zone'].hidden = !pending;
    if (!pending) return;
    if (coupe.packOpened) {
      var p = findPlayer(coupe.pack);
      el['btn-pack'].hidden = true;
      el['pack-card'].innerHTML = packCardHTML(p) +
        '<div class="pc-new">✨ Nouvelle carte — album ' + albumCount() + '/' + ALBUM_IDX.length + '</div>';
      el['pack-card'].hidden = false;
    } else if (coupe.packChoices && coupe.packRevealed) {
      // ⚪ Pack argent révélé : 3 cartes face visible, on en GARDE une —
      // c'est le joueur qui sait quelle carte lui fait plaisir.
      el['btn-pack'].hidden = true;
      el['pack-card'].innerHTML =
        '<div class="pc-new">⚪ Pack argent — choisis <b>une</b> carte à garder :</div>' +
        '<div class="pack-choix">' + coupe.packChoices.map(function (nm, i) {
          return '<button type="button" class="pc-pick" data-i="' + i + '">' + packCardHTML(findPlayer(nm)) + '</button>';
        }).join('') + '</div>';
      el['pack-card'].hidden = false;
    } else {
      el['btn-pack'].hidden = false;
      el['btn-pack'].disabled = false;
      el['btn-pack'].classList.remove('shake');
      el['pack-card'].hidden = true;
    }
  }
  function packGarde(p) { // la carte gardée rejoint l'album, quel que soit le chemin
    coupe.pack = p[0];
    coupe.packOpened = true;
    collectPlayer(p);
    saveCoupe();
    var b = bandOf(p);
    confetti(b === 'legende' ? 170 : b === 'or' ? 90 : 40);
    renderPackZone();
    el['end-album'].textContent = '📔 Ouvrir mon album (' + albumCount() + '/' + ALBUM_IDX.length + ')';
  }
  el['btn-pack'].addEventListener('click', function () {
    if (!coupe || coupe.packOpened || !(coupe.pack || coupe.packChoices)) return;
    var run = coupe; // photo de la run : le timeout peut se déclencher en retard
    el['btn-pack'].disabled = true;
    el['btn-pack'].classList.add('shake');
    setTimeout(function () {
      // Onglet caché (timers throttlés) ou relance rapide : si une nouvelle
      // coupe a remplacé l'état, ce pack n'existe plus — ne rien faire.
      if (coupe !== run || coupe.packOpened) return;
      if (coupe.packChoices) { // argent : on révèle le choix, la carte n'est pas encore gardée
        coupe.packRevealed = true;
        saveCoupe();
        renderPackZone();
        return;
      }
      packGarde(findPlayer(coupe.pack));
    }, 1000);
  });
  el['pack-card'].addEventListener('click', function (e) {
    var b = e.target.closest('.pc-pick');
    if (!b || !coupe || !coupe.packChoices || coupe.packOpened) return;
    packGarde(findPlayer(coupe.packChoices[+b.dataset.i]));
  });
  el['btn-album'].addEventListener('click', openAlbum);
  el['end-album'].addEventListener('click', openAlbum);
  el['btn-album-close'].addEventListener('click', closeAlbum);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !el['album-panel'].hidden) closeAlbum(); });
  el['alb-toggle'].addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.dataset.g === albGroup) return;
    albGroup = b.dataset.g;
    save('jm-alb-group', albGroup);
    renderAlbum();
  });

  if (!storageOK) el['storage-warn'].hidden = false;

  // ── Thème : album crème (jour) ou stade en nocturne (nuit) ──
  var theme = load('jm-theme', 'jour');
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', theme === 'nuit' ? 'nuit' : 'jour');
    el['btn-theme'].textContent = theme === 'nuit' ? '☀️' : '🌙';
    el['btn-theme'].setAttribute('aria-label', theme === 'nuit' ? 'Passer au thème jour' : 'Passer au thème nocturne');
  }
  el['btn-theme'].addEventListener('click', function () {
    theme = theme === 'nuit' ? 'jour' : 'nuit';
    save('jm-theme', theme);
    applyTheme();
  });
  applyTheme();

  // ── Pseudo (pour le classement et les duels) ──
  var pseudo = load('jm-pseudo', '');
  var pseudoCb = null;
  function askPseudo(cb) {
    if (pseudo) { cb(pseudo); return; }
    pseudoCb = cb;
    el['pseudo-dialog'].hidden = false;
    el['pseudo-input'].focus();
  }
  el['btn-pseudo-ok'].addEventListener('click', function () {
    var v = el['pseudo-input'].value.replace(/[<>&"']/g, '').trim().slice(0, 20);
    if (!v) { el['pseudo-input'].focus(); return; }
    pseudo = v;
    save('jm-pseudo', pseudo);
    el['pseudo-dialog'].hidden = true;
    if (pseudoCb) { var cb = pseudoCb; pseudoCb = null; cb(pseudo); }
  });
  el['pseudo-input'].addEventListener('keydown', function (e) { if (e.key === 'Enter') el['btn-pseudo-ok'].click(); });

  // ── Club de cœur : vignette « prochain match » (API /api/prochain-match, Vercel) ──
  var favClub = load('jm-club', '');
  var CLUBS = (function () {
    var vus = {}, liste = [];
    DATA.forEach(function (p) { if (!vus[p[1]]) { vus[p[1]] = 1; liste.push(p[1]); } });
    return liste.sort(new Intl.Collator('fr').compare);
  })();
  function remplirSelectClubs(sel, vide) {
    sel.innerHTML = '';
    var o0 = document.createElement('option');
    o0.value = ''; o0.textContent = vide;
    sel.appendChild(o0);
    CLUBS.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c; o.textContent = c;
      if (c === favClub) o.selected = true;
      sel.appendChild(o);
    });
  }
  function fmtMatch(m) {
    var d = new Date(m.date);
    var quand = d.toLocaleDateString('fr-BE', { weekday: 'short', day: 'numeric', month: 'short' }) +
      ' · ' + d.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' });
    return quand + ' — ' + m.domicile + ' vs ' + m.exterieur + (m.competition ? ' (' + m.competition + ')' : '');
  }
  function renderClubBanner() {
    var b = el['club-banner'];
    if (!b) return;
    if (!favClub) {
      b.innerHTML = '⭐ <strong>Choisis ton club de cœur</strong> — son prochain match s’affichera ici.';
      b.hidden = false;
      return;
    }
    b.innerHTML = '⭐ <strong>' + esc(favClub) + '</strong> <span class="cb-match">⏳ prochain match…</span>';
    b.hidden = false;
    // Depuis l'app native ou un miroir, l'API vit sur le domaine ; en local elle est absente (repli)
    var apiBase = location.hostname === 'joueurmystere.com' ? '' : 'https://joueurmystere.com';
    fetch(apiBase + '/api/prochain-match?club=' + encodeURIComponent(favClub))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (m) {
        b.innerHTML = '⭐ <strong>' + esc(favClub) + '</strong>' +
          (m ? '<span class="cb-match">📅 ' + esc(fmtMatch(m)) + '</span>' : '');
      })
      .catch(function () {
        b.innerHTML = '⭐ <strong>' + esc(favClub) + '</strong>';
      });
  }
  el['club-banner'].addEventListener('click', function () {
    remplirSelectClubs(el['club-select'], '— Aucun club —');
    el['club-dialog'].hidden = false;
    el['club-select'].focus();
  });
  el['btn-club-ok'].addEventListener('click', function () {
    favClub = el['club-select'].value;
    save('jm-club', favClub);
    el['club-dialog'].hidden = true;
    renderClubBanner();
  });
  renderClubBanner();

  // ── Intro des nouveaux joueurs (une fois, en DOM — jamais de modal natif) ──
  (function introNouveau() {
    if (load('jm-intro-vue', null) || statsJour.played > 0 || jour.done || jour.g.length) return;
    remplirSelectClubs(el['intro-club'], '⭐ Ton club de cœur — optionnel');
    el['intro-dialog'].hidden = false;
    function fermer() {
      // Pseudo et club saisis à l'accueil : retenus pour le classement, les duels et la vignette match
      var v = el['intro-pseudo'].value.replace(/[<>&"']/g, '').trim().slice(0, 20);
      if (v) { pseudo = v; save('jm-pseudo', pseudo); }
      if (el['intro-club'].value) { favClub = el['intro-club'].value; save('jm-club', favClub); renderClubBanner(); }
      el['intro-dialog'].hidden = true; save('jm-intro-vue', '1');
    }
    el['btn-intro-go'].addEventListener('click', fermer);
    el['btn-intro-rules'].addEventListener('click', function () {
      fermer();
      var r = document.querySelector('details.rules');
      if (r) { r.open = true; r.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  })();

  // ── Classement en ligne (Supabase, optionnel) ──
  var LB = CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY ? {
    headers: { 'apikey': CFG.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + CFG.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    post: function (path, body) {
      return fetch(CFG.SUPABASE_URL + path, { method: 'POST', headers: this.headers, body: JSON.stringify(body) });
    }
  } : null;

  // ── Visite du jour (mesure d'audience : 1 ping par navigateur et par jour,
  // sans cookie ni donnée personnelle ; un lien `?src=tiktok` en bio attribue
  // la source, sinon on retient le domaine référent) ──
  (function pingVisite() {
    if (!LB || load('jm-visite-' + DAY, null)) return;
    var src = '';
    try { src = new URLSearchParams(location.search).get('src') || ''; } catch (e) {}
    if (!src) {
      try { if (document.referrer) src = new URL(document.referrer).hostname; } catch (e) {}
      if (src === location.hostname) src = '';
    }
    save('jm-visite-' + DAY, '1');
    LB.post('/rest/v1/visites', {
      day: DAY,
      source: src ? src.slice(0, 60) : null,
      mobile: !!(window.matchMedia && matchMedia('(pointer: coarse)').matches)
    }).catch(function () {});
  })();

  function submitDailyResult() {
    if (!LB || load('jm-sub-' + DAY, null)) return;
    save('jm-sub-' + DAY, '1');
    LB.post('/rest/v1/daily_results', { day: DAY, guesses: jour.won ? jour.g.length : 0 }).catch(function () {});
  }
  function fetchDailySocial() {
    if (!LB) return;
    LB.post('/rest/v1/rpc/get_daily_stats', { d: DAY }).then(function (r) { return r.json(); }).then(function (s) {
      if (s && s.plays > 1) {
        var pct = Math.round(100 * s.wins / s.plays);
        el['end-social'].textContent = '🌍 ' + pct + ' % des ' + s.plays + ' joueurs l’ont trouvé aujourd’hui' +
          (s.avg ? ' (' + Number(s.avg).toFixed(1) + ' essais en moyenne)' : '');
      }
    }).catch(function () {});
  }
  function submitMarathonScore(serie) {
    if (!LB || serie < 1 || load('jm-msub-' + DAY, null)) return;
    askPseudo(function (name) {
      save('jm-msub-' + DAY, '1');
      LB.post('/rest/v1/marathon_scores', { day: DAY, pseudo: name, serie: serie })
        .then(function () { refreshClassement(); }).catch(function () {});
    });
  }
  function refreshClassement() {
    if (!LB) return;
    el['classement-note'].textContent = '…';
    LB.post('/rest/v1/rpc/get_marathon_top', { d: DAY }).then(function (r) { return r.json(); }).then(function (rows) {
      if (!Array.isArray(rows)) throw new Error('bad');
      el['classement-list'].innerHTML = rows.length ? rows.map(function (r, i) {
        var me = pseudo && r.pseudo === pseudo;
        return '<li' + (me ? ' class="me"' : '') + '><span class="medal">' + (['🥇', '🥈', '🥉'][i] || (i + 1) + '.') + '</span>' +
          '<span>' + esc(r.pseudo) + '</span><span class="score">' + r.serie + '</span></li>';
      }).join('') : '<li><span>Personne n’a encore joué le marathon du jour — sois le premier !</span></li>';
      el['classement-note'].textContent = 'Marathon du jour · maj ' + new Date().toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' });
    }).catch(function () {
      el['classement-note'].textContent = 'Classement momentanément indisponible.';
    });
  }
  if (el['btn-refresh-classement']) el['btn-refresh-classement'].addEventListener('click', refreshClassement);
  if (LB) setInterval(function () {
    if (MODE === 'marathon' && document.visibilityState === 'visible') refreshClassement();
  }, 180000);

  // ── Salons privés : ligue asynchrone entre amis, appuyée sur le marathon classé ──
  // Identité par navigateur (uid) : deux « Karim » de salons différents ne se mélangent jamais.
  var UID = load('jm-uid', '');
  if (!UID) {
    UID = Array.from({ length: 16 }, function () { return '0123456789abcdef'[Math.floor(Math.random() * 16)]; }).join('');
    save('jm-uid', UID);
  }
  var MAILLOT_COULEURS = [
    ['#c8342c', '#971f19', '#fdfaf2'], ['#2456a8', '#173a75', '#fdfaf2'],
    ['#2c7a44', '#1c5530', '#fdfaf2'], ['#211e19', '#c9a227', '#f5d9a8'],
    ['#fdfaf2', '#c8342c', '#211e19'], ['#e2a91f', '#211e19', '#211e19'],
    ['#6a2c8f', '#471b62', '#fdfaf2'], ['#12a5b8', '#0c7180', '#fdfaf2']
  ];
  var avNum = parseInt(load('jm-maillot', '10'), 10) || 10;
  var avCol = parseInt(load('jm-couleur', '0'), 10) || 0;
  function avatarSVG(nom, num, cIdx) {
    var c = MAILLOT_COULEURS[cIdx % MAILLOT_COULEURS.length] || MAILLOT_COULEURS[0];
    var floc = esc(String(nom || '').toUpperCase().slice(0, 10));
    return '<svg viewBox="0 0 140 122" aria-hidden="true">' +
      '<path d="M38 16 L8 36 L22 58 L36 48 Z" fill="' + c[1] + '" stroke="#22251f" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M102 16 L132 36 L118 58 L104 48 Z" fill="' + c[1] + '" stroke="#22251f" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M38 16 L54 12 Q70 30 86 12 L102 16 L104 48 L102 116 L38 116 L36 48 Z" fill="' + c[0] + '" stroke="#22251f" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M54 12 Q70 30 86 12" fill="none" stroke="' + c[1] + '" stroke-width="5"/>' +
      '<text x="70" y="52" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="700" font-size="15" letter-spacing="1" fill="' + c[2] + '">' + floc + '</text>' +
      '<text x="70" y="98" text-anchor="middle" font-family="Alfa Slab One, Rockwell, serif" font-size="40" fill="' + c[2] + '" stroke="#22251f" stroke-width="1.2" paint-order="stroke">' + (num || '') + '</text>' +
      '</svg>';
  }
  var SALONS = loadJSON('jm-salons', []); // [{code, nom}]
  function rpc(fn, args) {
    return LB.post('/rest/v1/rpc/' + fn, args).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error(t.slice(0, 120)); });
      return r.json().catch(function () { return null; });
    });
  }
  function salonLien(code) { return SITE + '#s=' + code; }
  function salonMsg(s) {
    return '🏟️ Rejoins notre salon « ' + s.nom + ' » sur le Joueur Mystère — un marathon par jour, classement entre nous : ' + salonLien(s.code);
  }
  // Dialogue création / adhésion (en DOM, jamais de modal natif)
  var salonDlgMode = null; // 'creer' | {code}
  function majAvatarApercu() {
    el['salon-avatar'].innerHTML = avatarSVG(el['salon-pseudo'].value || pseudo || 'TOI', parseInt(el['salon-num'].value, 10) || avNum, avCol);
  }
  function ouvrirSalonDialog(mode, titre) {
    salonDlgMode = mode;
    el['salon-dlg-titre'].textContent = titre;
    el['salon-nom'].hidden = mode !== 'creer';
    el['salon-pseudo'].value = pseudo || '';
    el['salon-num'].value = avNum;
    el['salon-couleurs'].innerHTML = MAILLOT_COULEURS.map(function (c, i) {
      return '<button type="button" role="radio" aria-checked="' + (i === avCol) + '" aria-label="Couleur ' + (i + 1) + '" style="background:linear-gradient(160deg,' + c[0] + ' 55%,' + c[1] + ')"></button>';
    }).join('');
    [].forEach.call(el['salon-couleurs'].children, function (b, i) {
      b.addEventListener('click', function () {
        avCol = i;
        [].forEach.call(el['salon-couleurs'].children, function (x, j) { x.setAttribute('aria-checked', String(j === i)); });
        majAvatarApercu();
      });
    });
    majAvatarApercu();
    el['salon-dialog'].hidden = false;
    (mode === 'creer' ? el['salon-nom'] : el['salon-pseudo']).focus();
  }
  el['salon-pseudo'].addEventListener('input', majAvatarApercu);
  el['salon-num'].addEventListener('input', majAvatarApercu);
  el['btn-salon-annuler'].addEventListener('click', function () { el['salon-dialog'].hidden = true; });
  el['btn-salon-ok'].addEventListener('click', function () {
    var p = el['salon-pseudo'].value.replace(/[<>&"']/g, '').trim().slice(0, 20);
    if (!p) { el['salon-pseudo'].focus(); return; }
    var n = Math.min(99, Math.max(1, parseInt(el['salon-num'].value, 10) || 10));
    pseudo = p; save('jm-pseudo', p);
    avNum = n; save('jm-maillot', String(n)); save('jm-couleur', String(avCol));
    var boutOK = el['btn-salon-ok'];
    boutOK.disabled = true;
    var fini = function () { boutOK.disabled = false; el['salon-dialog'].hidden = true; renderSalons(); };
    if (salonDlgMode === 'creer') {
      var nomS = el['salon-nom'].value.replace(/[<>&"']/g, '').trim().slice(0, 30);
      if (!nomS) { el['salon-nom'].focus(); boutOK.disabled = false; return; }
      rpc('salon_creer', { p_nom: nomS, p_uid: UID, p_pseudo: p, p_maillot: n, p_couleur: avCol })
        .then(function (code) {
          SALONS.push({ code: code, nom: nomS }); save('jm-salons', JSON.stringify(SALONS));
          publierScoreSalons();
          fini();
        })
        .catch(function () { boutOK.disabled = false; el['copy-feedback'].textContent = ''; alerteSalon('Création impossible — réessaie dans un instant.'); });
    } else {
      var code = salonDlgMode.code;
      rpc('salon_rejoindre', { p_code: code, p_uid: UID, p_pseudo: p, p_maillot: n, p_couleur: avCol })
        .then(function (nomS) {
          if (!SALONS.some(function (s) { return s.code === code; })) {
            SALONS.push({ code: code, nom: nomS }); save('jm-salons', JSON.stringify(SALONS));
          }
          publierScoreSalons();
          fini();
        })
        .catch(function () { boutOK.disabled = false; alerteSalon('Salon introuvable — vérifie le lien.'); });
    }
  });
  function alerteSalon(msg) {
    var z = el['salon-boards'];
    z.insertAdjacentHTML('afterbegin', '<p class="sb-alerte" style="color:var(--red-deep);font-weight:700;font-size:13px;margin-top:8px">' + esc(msg) + '</p>');
    setTimeout(function () { var a = z.querySelector('.sb-alerte'); if (a) a.remove(); }, 4000);
  }
  // Publie la série classée du jour dans tous mes salons (y compris si on rejoint après avoir joué)
  function publierScoreSalons() {
    if (!LB || !SALONS.length || !mday.done) return;
    SALONS.forEach(function (s) {
      rpc('salon_score', { p_code: s.code, p_uid: UID, p_day: DAY, p_serie: mday.serie || 0 }).catch(function () {});
    });
  }
  function renderSalons() {
    if (!LB) { el['salon-zone'].hidden = true; return; }
    var z = el['salon-boards'];
    if (!SALONS.length) { z.innerHTML = ''; return; }
    z.innerHTML = SALONS.map(function (s) { return '<div class="salon-board" data-code="' + esc(s.code) + '"><h4>🏟️ ' + esc(s.nom) + '</h4><p class="sb-code">…</p></div>'; }).join('');
    SALONS.forEach(function (s) {
      rpc('get_salon', { p_code: s.code, p_day: DAY }).then(function (d) {
        var b = z.querySelector('[data-code="' + s.code + '"]');
        if (!b || !d || !d.nom) return;
        var rows = (d.membres || []).map(function (m, i) {
          var moi = m.pseudo === pseudo;
          return '<li' + (moi ? ' class="me"' : '') + '>' +
            '<span class="medal">' + (['🥇', '🥈', '🥉'][i] || (i + 1) + '.') + '</span>' +
            '<span class="sb-avatar">' + avatarSVG('', m.maillot, m.couleur) + '</span>' +
            '<span class="sb-nom">' + esc(m.pseudo) + '</span>' +
            '<span class="sb-jour">' + (m.jour == null ? 'pas encore joué' : 'auj. : ' + m.jour) + '</span>' +
            '<span class="sb-total">' + m.total + '</span></li>';
        }).join('');
        b.innerHTML = '<h4>🏟️ ' + esc(d.nom) + '</h4>' +
          '<p class="sb-code">CODE ' + esc(s.code) + ' · total des séries du marathon classé</p>' +
          '<ol>' + rows + '</ol>' +
          '<div class="sb-lien"><input readonly value="' + salonLien(s.code) + '" aria-label="Lien du salon">' +
          '<button type="button" class="sb-copier">📋</button>' +
          '<a href="https://wa.me/?text=' + encodeURIComponent(salonMsg(s)) + '" target="_blank" rel="noopener">🟢 WhatsApp</a></div>' +
          '<div class="sb-actions"><button type="button" class="sb-refresh">↻ Actualiser</button>' +
          '<button type="button" class="sb-quitter">Quitter ce salon</button></div>';
        b.querySelector('.sb-lien input').addEventListener('focus', function () { this.select(); });
        b.querySelector('.sb-copier').addEventListener('click', function () { copyToClipboard(salonMsg(s), '✓ Lien du salon copié !'); });
        b.querySelector('.sb-refresh').addEventListener('click', renderSalons);
        b.querySelector('.sb-quitter').addEventListener('click', function () {
          SALONS = SALONS.filter(function (x) { return x.code !== s.code; });
          save('jm-salons', JSON.stringify(SALONS));
          renderSalons();
        });
      }).catch(function () {});
    });
  }
  el['btn-salon-new'].addEventListener('click', function () { ouvrirSalonDialog('creer', '🏟️ Nouveau salon'); });
  renderSalons();
  // Arrivée par lien de salon : #s=CODE → proposer de rejoindre
  // (désactivé en v14 — les salons appartiennent au mode Entre amis, en sommeil)
  (function salonDepuisLien() {
    return;
    var m = location.hash.match(/^#s=([A-Z0-9]{6})$/i);
    if (!m || !LB) return;
    var code = m[1].toUpperCase();
    if (SALONS.some(function (s) { return s.code === code; })) return;
    ouvrirSalonDialog({ code: code }, '🏟️ Rejoindre le salon ' + code);
  })();

  // ── Mode courant ──
  var MODE = 'jour';
  var marathonOver = false;
  var endedRun = null; // photo de la série marathon terminée {serie, target, ranked}

  function target() {
    if (MODE === 'jour') return TARGET_JOUR;
    if (MODE === 'duel') return duel ? duel.target : TARGET_JOUR;
    if (MODE === 'coupe') return coupe ? coupeTarget() : TARGET_JOUR;
    return ranked() ? mdayTarget() : findPlayer(run.target);
  }
  function guesses() {
    if (MODE === 'jour') return jour.g;
    if (MODE === 'duel') return duel ? duel.g : [];
    if (MODE === 'coupe') return coupe ? coupe.g : [];
    return ranked() ? mday.g : run.g;
  }
  function isDone() {
    if (MODE === 'jour') return jour.done;
    if (MODE === 'duel') return !duel || duel.done;
    if (MODE === 'coupe') return !coupe || coupe.done;
    return marathonOver;
  }
  function serieActuelle() { return ranked() ? mday.serie : (run ? run.serie : 0); }

  // ── Rendu ──
  function cellHTML(cls, big, sub) {
    return '<div class="cell ' + cls + '"><span class="big">' + big + '</span>' + (sub ? '<span class="sub">' + sub + '</span>' : '') + '</div>';
  }
  function marksFor(p, t) {
    var da = ageOf(t) - ageOf(p);
    return {
      nat: p[3] === t[3] ? 'ok' : (p[5] === t[5] ? 'close' : ''),
      lg: p[2] === t[2] ? 'ok' : '',
      club: p[1] === t[1] ? 'ok' : (p[2] === t[2] ? 'close' : ''),
      pos: p[6] === t[6] ? 'ok' : (POS_LINE[p[6]] === POS_LINE[t[6]] ? 'close' : ''),
      age: da === 0 ? 'ok' : (Math.abs(da) <= 2 ? 'close' : ''),
      arrow: da === 0 ? '' : (da > 0 ? ' ↑' : ' ↓')
    };
  }
  function renderGuess(p, t, animate) {
    var m = marksFor(p, t);
    var row = document.createElement('div');
    row.className = 'guess-line' + (animate ? ' reveal' : '');
    row.innerHTML =
      cellHTML('name-cell' + (p[0] === t[0] ? ' ok' : ''), esc(p[0].split(' ').slice(-1)[0]), esc(p[0].split(' ').slice(0, -1).join(' '))) +
      cellHTML(m.nat, flagHTML(p[4]), esc(p[3])) +
      cellHTML(m.lg, flagHTML(LEAGUE_FLAG[p[2]] || '⚽'), esc(p[2])) +
      '<div class="cell club-cell ' + m.club + '">' + clubBadge(p[1]) + '<span class="sub">' + p[1] + '</span></div>' +
      '<div class="cell duo">' +
        '<span class="tag ' + m.pos + '" title="' + POS_LABEL[p[6]] + '">' + p[6] + '</span>' +
        '<span class="tag ' + m.age + '">' + ageOf(p) + m.arrow + '</span>' +
      '</div>';
    el.board.appendChild(row);
    return m;
  }
  function guessEmojis(m) {
    function e(c) { return c === 'ok' ? '🟩' : (c === 'close' ? '🟨' : '⬜'); }
    return e(m.nat) + e(m.lg) + e(m.club) + e(m.pos) + e(m.age);
  }

  function renderTries() {
    el.tries.innerHTML = '';
    for (var i = 0; i < maxTriesNow(); i++) {
      var d = document.createElement('div');
      d.className = 'try-dot' + (i < guesses().length ? ' used' : '');
      el.tries.appendChild(d);
    }
  }
  function clearBoard() {
    Array.prototype.slice.call(el.board.querySelectorAll('.guess-line')).forEach(function (r) { r.remove(); });
  }
  function renderBoard() {
    clearBoard();
    var t = target();
    guesses().forEach(function (name) {
      var p = findPlayer(name);
      if (p) renderGuess(p, t, false);
    });
    renderTries();
  }
  // ── 🔎 L'enquête : la déduction faite à la place du joueur ──
  // Rien que du PROUVÉ par les essais (aucune triche) : sous la pression du chrono,
  // relire 5 lignes de cases colorées coûte cher — ici tout est déjà distillé.
  var LINE_WORD = { G: 'Gardien', D: 'Défenseur', M: 'Milieu', A: 'Attaquant' };
  function noteChip(cls, label, valueHTML) {
    return '<div class="note-chip' + (cls ? ' ' + cls : '') + '"><span class="nk">' + label + '</span><span class="nv">' + valueHTML + '</span></div>';
  }
  function struckList(items, cap) {
    var shown = items.slice(0, cap);
    var more = items.length - shown.length;
    if (!shown.length) return '';
    return '<span class="nx">✗ ' + shown.join(' ✗ ') + (more > 0 ? ' +' + more : '') + '</span>';
  }
  function renderNotes() {
    var gs = guesses();
    if (!gs.length || isDone() || (MODE === 'duel' && !duel)) { el.notes.hidden = true; return; }
    var t = target();
    var d = { nation: null, confed: null, natX: [], confX: [], league: null, lgX: [], club: null, clubX: [], pos: null, posX: [], min: 15, max: 45 };
    gs.forEach(function (name) {
      var p = findPlayer(name); if (!p) return;
      if (p[3] === t[3]) { d.nation = p[3]; d.confed = p[5]; }
      else {
        if (d.natX.indexOf(p[4]) === -1) d.natX.push(p[4]);
        if (p[5] === t[5]) d.confed = p[5];
        else if (d.confX.indexOf(p[5]) === -1) d.confX.push(p[5]);
      }
      if (p[2] === t[2]) d.league = p[2]; else if (d.lgX.indexOf(p[2]) === -1) d.lgX.push(p[2]);
      if (p[1] === t[1]) d.club = p[1]; else if (d.clubX.indexOf(p[1]) === -1) d.clubX.push(p[1]);
      if (p[6] === t[6]) d.pos = p[6];
      else if (POS_LINE[p[6]] === POS_LINE[t[6]] && d.posX.indexOf(p[6]) === -1) d.posX.push(p[6]);
      // Fourchette d'âge : ↑/↓ borne un côté ; 🟨 (±2 ans) borne les deux
      var a = ageOf(p), da = ageOf(t) - a;
      if (da === 0) { d.min = a; d.max = a; }
      else if (da > 0) { d.min = Math.max(d.min, a + (da <= 2 ? 1 : 3)); if (da <= 2) d.max = Math.min(d.max, a + 2); }
      else { d.max = Math.min(d.max, a - (-da <= 2 ? 1 : 3)); if (-da <= 2) d.min = Math.max(d.min, a - 2); }
    });
    var html = '<span class="note-title">Enquête</span>';
    // Nation : confirmée > confédération connue > éliminations
    if (d.nation) html += noteChip('note-ok', 'Nation', flagHTML(t[4]) + ' ' + esc(d.nation));
    else if (d.confed) html += noteChip('note-mid', 'Nation', esc(d.confed) + ' ✓ ' + struckList(d.natX.map(flagHTML), 3));
    else html += noteChip('', 'Nation', (d.confX.length ? '≠ ' + d.confX.map(esc).join(', ') + ' ' : '') + struckList(d.natX.map(flagHTML), 3));
    // Championnat
    if (d.league) html += noteChip('note-ok', 'Champ.', flagHTML(LEAGUE_FLAG[d.league] || '⚽') + ' ' + esc(d.league));
    else html += noteChip('', 'Champ.', struckList(d.lgX.map(function (l) { return flagHTML(LEAGUE_FLAG[l] || '⚽'); }), 4) || '—');
    // Club
    if (d.club) html += noteChip('note-ok', 'Club', clubBadge(d.club) + ' ' + esc(d.club));
    else html += noteChip('', 'Club', struckList(d.clubX.map(clubBadge), 3) || '—');
    // Poste : la ligne est donnée dès le départ, on affine avec les postes éliminés
    if (d.pos) html += noteChip('note-ok', 'Poste', esc(POS_LABEL[d.pos]));
    else html += noteChip('', 'Poste', esc(LINE_WORD[POS_LINE[t[6]]]) + ' ' + struckList(d.posX.map(esc), 3));
    // Âge
    if (d.min === d.max) html += noteChip('note-ok', 'Âge', d.min + ' ans');
    else if (d.min > 15 && d.max < 45) html += noteChip('note-mid', 'Âge', d.min + '–' + d.max + ' ans');
    else if (d.min > 15) html += noteChip('', 'Âge', '≥ ' + d.min + ' ans');
    else if (d.max < 45) html += noteChip('', 'Âge', '≤ ' + d.max + ' ans');
    else html += noteChip('', 'Âge', '—');
    el.notes.innerHTML = html;
    el.notes.hidden = false;
  }

  function renderStartHint() {
    if (MODE === 'duel' && !duel) { el['start-hint'].style.display = 'none'; return; }
    var t = target();
    var jk = (MODE === 'marathon' && !ranked() && run) ? run.joker : null;
    var extra = '';
    if (jk === 'loupe') extra = '🃏 Joker : il joue en <strong>' + esc(t[2]) + '</strong>.';
    else if (jk === 'etatcivil') extra = '🃏 Joker : il a <strong>' + ageOf(t) + ' ans</strong>.';
    else if (jk === 'boussole') extra = '🃏 Joker : il est <strong>' + POS_LABEL[t[6]] + '</strong>.';
    // Défi reçu : annoncer l'adversaire et le score à battre dès l'arrivée,
    // pas seulement au verdict — c'est le crochet qui lance la partie.
    var defi = '';
    if (MODE === 'duel' && duel && duel.challenger && !duel.done) {
      var advN = duel.challenger.name ? esc(duel.challenger.name) : 'Ton adversaire';
      defi = '⚔️ <strong>' + advN + ' te défie !</strong> Son score : <strong>' +
        (duel.challenger.score > 0 ? duel.challenger.score + '/' + MAX_TRIES : 'raté (X/' + MAX_TRIES + ')') + '</strong>' +
        (duel.challenger.secs != null ? ' en ' + fmtSecs(duel.challenger.secs) : '') + ' — à toi.<br>';
    }
    // La Coupe annonce la BANDE de l'adversaire (💎/🟡/⚪) — le frisson de la
    // rareté sans dévoiler la note chiffrée (retirée en v13 : méta-info froide
    // qui spoile). Les aides offertes d'office s'affichent dès le départ.
    var rarete = '';
    if (MODE === 'coupe' && noteOf(t)) {
      var bd0 = BANDS[bandOf(t)];
      rarete = '<span class="band-chip band-' + bandOf(t) + '">' + bd0.icon + ' Adversaire <strong>' + bd0.adj + '</strong></span><br>';
    }
    var a0 = aidesFor(t), offert = [];
    if (a0.champ === 0) offert.push('🏟️ il joue en <strong>' + esc(t[2]) + '</strong>');
    if (a0.club === 0) offert.push('👕 au <strong>' + esc(t[1]) + '</strong>');
    el['start-hint'].innerHTML = '<span class="mini-jersey">' + jerseySVG(t, true) + '</span>' +
      '<span>' + defi + rarete + '🧭 Indice de départ : le mystère est <strong>' + LINE_PHRASE[POS_LINE[t[6]]] + '</strong>.' +
      (offert.length ? '<br>' + offert.join(' · ') + '.' : '') +
      (extra ? '<br>' + extra : '') + '</span>';
    el['start-hint'].style.display = isDone() ? 'none' : 'flex';
  }
  // Grille d'aides : plus le mystère est obscur (note basse), plus le jeu aide.
  // Champ/club à 0 = offert dès le départ (affiché dans l'indice de départ).
  // Les stars gardent le régime sec. Règle v13 : TOUT mystère doit finir par
  // converger (init puis pendu partout) — la ressource décide jusqu'où on va,
  // jamais la connaissance pure.
  function aides(t) {
    var n = noteOf(t);
    if (t[8] === 1 || !n || n >= 84) return { champ: Infinity, club: Infinity, init: 4, pendu: 6 };
    if (n >= 80) return { champ: 2, club: 4, init: 4, pendu: 6 };
    return { champ: 1, club: 3, init: 3, pendu: 5 };
  }
  // En Coupe (v13), les aides dépendent du TOUR, pas de la note : la demi pioche
  // dans le même vivier que 8es/quarts mais aide moins — c'est ça, son cran de
  // difficulté. La finale (💎 connue de tous) se joue quasi à sec.
  var AIDES_COUPE = [
    { champ: Infinity, club: Infinity, init: 3, pendu: 5 }, // 16es · or 84-86
    { champ: 2, club: Infinity, init: 3, pendu: 5 },        // 8es · argent 82-83
    { champ: 1, club: 3, init: 3, pendu: 5 },               // quarts · argent 80-81
    { champ: 2, club: 4, init: 4, pendu: 6 },               // demi · tout l'argent, aides réduites
    { champ: Infinity, club: Infinity, init: 4, pendu: 6 }  // finale · légende 87+
  ];
  function aidesFor(t) {
    if (MODE === 'coupe' && coupe && !coupe.done) return AIDES_COUPE[Math.min(coupe.round, 4)];
    return aides(t);
  }
  // Pendu progressif : moitié du nom au seuil, puis une lettre de plus par
  // essai raté — aucun tour n'est jamais un mur.
  function pendu(nom, extra) {
    var mots = nom.split(' ');
    var vus = mots.map(function (w) { return Math.ceil(w.length / 2); });
    var e = extra || 0;
    while (e > 0) {
      var i = -1;
      for (var j = 0; j < mots.length; j++) if (vus[j] < mots[j].length && (i === -1 || vus[i] > vus[j])) i = j;
      if (i === -1) break; // tout est révélé
      vus[i]++; e--;
    }
    return mots.map(function (w, j) {
      return w.slice(0, vus[j]) + '·'.repeat(Math.max(0, w.length - vus[j]));
    }).join(' ');
  }
  function renderHint() {
    var show = [];
    if (!isDone() && !(MODE === 'duel' && !duel)) {
      var t = target();
      var n = guesses().length;
      var a = aidesFor(t);
      if (a.champ > 0 && n >= a.champ) show.push('🏟️ Coup de pouce : il joue en ' + t[2] + '.');
      if (a.club > 0 && n >= a.club) show.push('👕 Son club : ' + t[1] + '.');
      if (n >= a.init) {
        var initials = t[0].split(' ').map(function (w) { return w.charAt(0) + '.'; }).join(' ');
        show.push('🕵️ Ses initiales : « ' + initials + ' »');
      }
      if (n >= a.pendu) show.push('🔤 Son nom : « ' + pendu(t[0], n - a.pendu) + ' »');
    }
    if (show.length) { el.hint.textContent = show.join('  ·  '); el.hint.hidden = false; }
    else el.hint.hidden = true;
    renderNotes(); // l'enquête suit le même cycle de vie que l'indice
  }
  function renderStatsJour() {
    el['s-played'].textContent = statsJour.played;
    el['s-rate'].textContent = statsJour.played ? Math.round(100 * statsJour.wins / statsJour.played) + '%' : '0%';
    el['s-streak'].textContent = statsJour.streak;
    el['s-max'].textContent = statsJour.maxStreak;
  }
  function renderPodium() {
    var dk = diffKey(ranked());
    el['podium-diff'].textContent = '(' + DIFFS[dk].label.toLowerCase() + ')';
    var rows = podium.filter(function (r) { return (r.k || 'moyen') === dk; }).slice(0, 5);
    el['podium-list'].innerHTML = rows.map(function (r, i) {
      var medal = ['🥇', '🥈', '🥉', '4.', '5.'][i];
      var date = new Date(r.d + 'T12:00:00').toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' });
      return '<li><span class="medal">' + medal + '</span><span class="score">' + r.s + ' joueur' + (r.s > 1 ? 's' : '') + '</span><span>' + date + '</span></li>';
    }).join('') || '<li><span>Aucune série terminée — lance-toi !</span></li>';
  }
  function renderDiffPicker() {
    // Toujours visible en marathon : pendant la tentative classée, les 4 difficultés
    // restent affichées mais verrouillées (sinon un nouveau joueur ignore qu'elles existent).
    var visible = MODE === 'marathon';
    el['diff-picker'].hidden = !visible;
    if (!visible) return;
    var locked = ranked();
    el['diff-picker'].classList.toggle('locked', locked);
    el['dp-note'].hidden = !locked;
    Array.prototype.forEach.call(el['diff-picker'].querySelectorAll('.diff-chip'), function (b) {
      b.disabled = locked;
      b.setAttribute('aria-pressed', !locked && b.dataset.d === diff);
    });
  }
  function renderMarathonBar() {
    el['mb-label'].textContent = ranked() ? '🏆 Marathon du jour (classé)' : '🎲 Libre · ' + DIFFS[diff].label;
    el['mb-serie'].textContent = serieActuelle();
    el['mb-best'].textContent = getBest();
    renderDiffPicker();
  }
  // Changer de difficulté : la série d'entraînement en cours est enregistrée
  // silencieusement (si > 0) puis une nouvelle run démarre dans le bon vivier.
  function setDiff(k) {
    if (!DIFFS[k] || k === diff || ranked()) return;
    if (!marathonOver && run && run.serie > 0) recordSerie(run.serie, diff);
    diff = k;
    save('jm-diff', k);
    marathonOver = false;
    endedRun = null;
    newPracticeRun();
    renderMarathonBar();
    renderPodium();
    hideEnd();
    renderBoard();
    renderStartHint();
    renderHint();
    if (renderDraft()) return; // nouvelle série = nouveau draft de jokers
    armMarathonDeadline(true);
    el['guess-input'].focus();
  }
  el['diff-picker'].addEventListener('click', function (e) {
    var b = e.target.closest('.diff-chip');
    if (b) setDiff(b.dataset.d);
  });

  // ── 🃏 Draft de joker : au début de chaque série libre, 3 cartes, un choix ──
  function draftPending() {
    return MODE === 'marathon' && !ranked() && !marathonOver && run &&
      !run.joker && run.serie === 0 && run.g.length === 0;
  }
  function draw3() {
    var keys = Object.keys(JOKER_DEFS).filter(function (k) {
      return k !== 'souffle' || DIFFS[diff].secs; // sans chrono, « Souffle » ne sert à rien
    });
    for (var i = keys.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = keys[i]; keys[i] = keys[j]; keys[j] = t;
    }
    return keys.slice(0, 3);
  }
  function renderDraft() {
    if (!draftPending()) { el['joker-draft'].hidden = true; return false; }
    // Le tirage est persisté : recharger la page ne re-mélange pas les cartes
    if (!run.draft || run.draft.length !== 3) { run.draft = draw3(); saveMarathonState(); }
    if (run.deadline) { delete run.deadline; saveMarathonState(); } // le chrono attend le choix
    el['joker-draft'].innerHTML = '<div class="jd-title">🃏 Choisis ton joker pour cette série</div>' +
      run.draft.map(function (k) {
        var d = JOKER_DEFS[k];
        return '<button class="joker-card" data-j="' + k + '"><span class="ji">' + d.icon +
          '</span><b>' + d.nom + '</b><span class="jd">' + d.desc + '</span></button>';
      }).join('');
    el['joker-draft'].hidden = false;
    el['guess-zone'].style.display = 'none';
    el['start-hint'].style.display = 'none';
    el.chrono.hidden = true;
    el.hint.hidden = true;
    el.notes.hidden = true;
    return true;
  }
  el['joker-draft'].addEventListener('click', function (e) {
    var b = e.target.closest('.joker-card');
    if (!b || !run || run.joker) return;
    run.joker = b.dataset.j;
    delete run.draft;
    run.lifeUsed = false;
    saveMarathonState();
    el['joker-draft'].hidden = true;
    el['guess-zone'].style.display = 'block';
    armMarathonDeadline(true);
    renderMarathonBar();
    renderBoard(); renderStartHint(); renderHint();
    el['guess-input'].focus();
  });

  // ── Fin de partie ──
  var countdownTimer = null;
  function tickCountdown() {
    var now = new Date();
    var mid = new Date(now); mid.setHours(24, 0, 0, 0);
    var s = Math.max(0, Math.floor((mid - now) / 1000));
    el.countdown.textContent = '⏳ Nouveau mystère et nouveau marathon classé dans ' +
      String(Math.floor(s / 3600)).padStart(2, '0') + ':' +
      String(Math.floor((s % 3600) / 60)).padStart(2, '0') + ':' +
      String(s % 60).padStart(2, '0');
  }
  function startCountdown() {
    el.countdown.style.display = 'block';
    tickCountdown();
    if (!countdownTimer) countdownTimer = setInterval(tickCountdown, 1000);
  }

  // ── Chrono de jeu (jour/duel : chronomètre ; marathon : compte à rebours) ──
  function tickAppChrono() {
    var c = el.chrono;
    if (MODE === 'jour') {
      c.classList.remove('low', 'mara');
      if (jour.done) {
        c.hidden = jour.secs == null;
        if (jour.secs != null) c.textContent = '⏱ ' + fmtSecs(jour.secs);
      } else if (jour.t0) {
        c.hidden = false;
        c.textContent = '⏱ ' + fmtSecs((Date.now() - jour.t0) / 1000);
      } else c.hidden = true;
    } else if (MODE === 'duel') {
      c.classList.remove('low', 'mara');
      if (!duel) { c.hidden = true; return; }
      if (duel.done) {
        c.hidden = duel.secs == null;
        if (duel.secs != null) c.textContent = '⏱ ' + fmtSecs(duel.secs);
      } else {
        c.hidden = false;
        c.textContent = '⏱ ' + fmtSecs((Date.now() - (duel.t0 || Date.now())) / 1000);
      }
    } else if (MODE === 'coupe') {
      c.classList.remove('low', 'mara');
      c.hidden = true; // la Coupe se joue sans chrono : la ressource, c'est le budget d'essais
    } else {
      var st = marathonState();
      var lim = timeLimit();
      if (marathonOver || !st || !lim || !st.deadline) { c.hidden = true; return; }
      var rem = (st.deadline - Date.now()) / 1000;
      if (rem <= 0) {
        if (el['round-banner'].hidden) { c.hidden = true; endMarathon(true); }
        return;
      }
      c.hidden = false;
      c.textContent = '⏳ ' + fmtSecs(rem);
      c.classList.add('mara');
      c.style.setProperty('--t', Math.min(1, rem / lim)); // le fond de la pastille = barre de temps
      c.classList.toggle('low', rem <= 15);
    }
  }

  function showEnd() {
    var t;
    if (MODE === 'marathon' && endedRun) t = findPlayer(endedRun.target);
    else t = target();
    el['guess-zone'].style.display = 'none';
    el['start-hint'].style.display = 'none';
    el.hint.hidden = true;
    el.notes.hidden = true;
    el['copy-feedback'].textContent = '';
    el['end-social'].textContent = '';
    el['duel-share'].hidden = true;
    el['btn-share'].hidden = false;
    el['end-visual'].innerHTML = jerseySVG(t);
    el['end-player'].innerHTML = flagHTML(t[4]) + ' ' + esc(t[0]);
    el['end-desc'].textContent = POS_LABEL[t[6]] + ' · ' + t[1] + ' (' + t[2] + ') · ' + ageOf(t) + ' ans' +
      (noteOf(t) ? ' · note ' + noteOf(t) : '');
    el.countdown.style.display = 'none';
    el['btn-again'].hidden = true;
    el['end-note'].hidden = true;
    el['end-album'].hidden = true;
    el['pack-zone'].hidden = true;

    if (MODE === 'jour') {
      el['end-verdict'].textContent = jour.won ? 'Trouvé en ' + jour.g.length + '/' + MAX_TRIES + ' !' : 'Raté… c’était :';
      var chunks = [];
      if (jour.won && statsJour.streak > 1) chunks.push('🔥 Série de ' + statsJour.streak + ' jours');
      if (jour.won && jour.secs != null) chunks.push('⏱ ' + fmtSecs(jour.secs));
      el['end-streak'].textContent = chunks.length ? chunks.join(' · ') : (jour.won ? '' : 'Reviens demain pour te rattraper !');
      startCountdown();
      fetchDailySocial();
    } else if (MODE === 'marathon') {
      var s = endedRun ? endedRun.serie : 0;
      el['end-verdict'].textContent = endedRun && endedRun.timeout ? '⏱ Temps écoulé — le dernier était :' : 'Série terminée — le dernier était :';
      el['end-streak'].textContent = (s > 0
        ? '🏁 ' + s + ' joueur' + (s > 1 ? 's' : '') + ' d’affilée' + (endedRun && endedRun.best ? ' — record perso !' : '')
        : 'Zéro. Ça arrive aux meilleurs.') + (endedRun && endedRun.ranked && LB ? ' · score envoyé au classement du jour' : '');
      el['btn-again'].hidden = false;
      el['btn-again'].textContent = endedRun && endedRun.ranked ? 'ENTRAÎNEMENT LIBRE' : 'REJOUER';
      if (endedRun && endedRun.ranked) startCountdown();
    } else if (MODE === 'coupe') {
      if (coupe.won) el['end-verdict'].textContent = '🏆 CHAMPION DE LA COUPE !';
      else if (coupe.sec) el['end-verdict'].textContent = 'À sec ! Forfait en ' + COUPE_ROUNDS[coupe.round].label + ' — le mystère était :';
      else el['end-verdict'].textContent = COUPE_ELIM_TITRES[coupe.round] + ' — le mystère était :';
      el['end-note'].innerHTML = 'Note du parcours <b>' + coupe.note + '</b>/100' +
        (coupeStats.runs > 1 && coupe.note >= coupeStats.best ? ' · record perso !' : '');
      el['end-note'].hidden = false;
      el['end-streak'].textContent = coupeStats.trophees > 0
        ? '🏆 Palmarès : ' + coupeStats.trophees + ' trophée' + (coupeStats.trophees > 1 ? 's' : '')
        : 'Le trophée se mérite — retente ta chance !';
      renderPackZone();
      el['end-album'].textContent = '📔 Ouvrir mon album (' + albumCount() + '/' + ALBUM_IDX.length + ')';
      el['end-album'].hidden = false;
      el['btn-again'].hidden = false;
      el['btn-again'].textContent = 'NOUVELLE COUPE';
    } else { // duel
      var mine = duel.won ? duel.g.length : 0;
      if (duel.challenger) {
        var adv = duel.challenger.name || 'Ton adversaire';
        var theirs = duel.challenger.score;
        var myT = duel.secs, thT = duel.challenger.secs;
        var verdict = !duel.won && !theirs ? 'Double zéro — personne ne le trouve !' :
          !theirs ? 'Victoire ! ' + adv + ' ne l’avait pas trouvé.' :
          !duel.won ? adv + ' gagne (' + theirs + '/6) — tu ne l’as pas trouvé.' :
          mine < theirs ? 'Victoire ' + mine + '/6 contre ' + theirs + '/6 !' :
          mine > theirs ? adv + ' gagne : ' + theirs + '/6 contre ' + mine + '/6.' :
          (myT != null && thT != null && myT !== thT
            ? (myT < thT ? 'Victoire au chrono ! ' + mine + '/6 partout, mais ' + fmtSecs(myT) + ' contre ' + fmtSecs(thT) + '.'
                         : adv + ' gagne au chrono : ' + fmtSecs(thT) + ' contre ' + fmtSecs(myT) + ' (' + mine + '/6 partout).')
            : 'Égalité parfaite : ' + mine + '/6 partout.');
        el['end-verdict'].textContent = '⚔️ ' + verdict;
        el['end-streak'].textContent = '';
      } else {
        el['end-verdict'].textContent = duel.won ? 'Trouvé en ' + mine + '/' + MAX_TRIES + ' ! Maintenant, défie quelqu’un.' : 'Raté… mais tu peux quand même défier quelqu’un.';
        el['end-streak'].textContent = '';
      }
      el['duel-url'].value = duelLink();
      el['wa-duel'].href = 'https://wa.me/?text=' + encodeURIComponent(duelShareMsg());
      el['duel-share'].hidden = false;
      el['btn-share'].hidden = true;
      el['btn-again'].hidden = false;
      el['btn-again'].textContent = 'NOUVEAU DUEL';
    }
    el.endcard.hidden = false;
  }
  function hideEnd() {
    el.endcard.hidden = true;
    el['guess-zone'].style.display = 'block';
  }

  // ── Logique JOUR ──
  function finishJour(won) {
    jour.done = true; jour.won = won;
    if (jour.t0) jour.secs = Math.round((Date.now() - jour.t0) / 1000);
    save('jm-' + DAY, JSON.stringify(jour));
    if (won) { confetti(90); collectPlayer(TARGET_JOUR); }
    statsJour.played += 1;
    if (won) {
      var consecutive = statsJour.lastWin && daysBetween(statsJour.lastWin, DAY) === 1;
      statsJour.streak = consecutive ? statsJour.streak + 1 : 1;
      statsJour.maxStreak = Math.max(statsJour.maxStreak, statsJour.streak);
      statsJour.wins += 1;
      statsJour.lastWin = DAY;
    } else statsJour.streak = 0;
    save('jm-stats', JSON.stringify(statsJour));
    renderStatsJour();
    submitDailyResult();
    showEnd();
  }

  // ── Logique MARATHON ──
  // Compte à rebours par joueur : la deadline est ABSOLUE et persistée — fermer
  // l'onglet ou recharger ne l'arrête pas (sinon le chrono ne servirait à rien).
  function marathonState() { return ranked() ? mday : run; }
  function saveMarathonState() {
    if (ranked()) save('jm-mday-' + DAY, JSON.stringify(mday));
    else if (run) save('jm-run', JSON.stringify(run));
  }
  function armMarathonDeadline(force, graceMs) {
    var st = marathonState();
    if (!st) return;
    var lim = timeLimit();
    if (!lim) { // difficulté sans chrono : on purge toute deadline résiduelle
      if (st.deadline) { delete st.deadline; saveMarathonState(); }
      return;
    }
    if (force || !st.deadline) {
      st.deadline = Date.now() + lim * 1000 + (graceMs || 0);
      saveMarathonState();
    }
  }
  function marathonExpired() {
    if (!timeLimit()) return false;
    var st = marathonState();
    return !!(st && st.deadline && Date.now() > st.deadline);
  }
  function nextRoundBanner(msg, graceMs) {
    armMarathonDeadline(true, graceMs);
    renderMarathonBar();
    el['round-banner'].textContent = msg;
    el['round-banner'].hidden = false;
    el['guess-zone'].style.display = 'none';
    setTimeout(function () {
      el['round-banner'].hidden = true;
      if (MODE === 'marathon' && !marathonOver) {
        el['guess-zone'].style.display = 'block';
        renderBoard();
        renderStartHint();
        renderHint();
        el['guess-input'].focus();
      }
    }, graceMs);
  }
  function endMarathon(timedOut, force) {
    // ❤️ Seconde chance (joker) : le premier raté du libre est pardonné —
    // on révèle le joueur, on passe au suivant, la série continue.
    // `force` = abandon volontaire : pas de pardon.
    if (!force && !ranked() && run && run.joker === 'coeur' && !run.lifeUsed) {
      run.lifeUsed = true;
      var missed = findPlayer(run.target);
      run.target = pickPracticeTarget()[0];
      run.g = [];
      saveMarathonState();
      nextRoundBanner('❤️ Seconde chance ! C’était ' + missed[0] + ' — la série continue…', 2300);
      return;
    }
    marathonOver = true;
    var wasRanked = ranked();
    var s = wasRanked ? mday.serie : run.serie;
    var tName = wasRanked ? mdayTarget()[0] : run.target;
    endedRun = { serie: s, target: tName, ranked: wasRanked, timeout: !!timedOut };
    endedRun.best = recordSerie(s, diffKey(wasRanked));
    if (wasRanked) {
      mday.done = true;
      save('jm-mday-' + DAY, JSON.stringify(mday));
      submitMarathonScore(s);
      publierScoreSalons(); // les salons reçoivent aussi les séries de 0 — avoir joué compte
    }
    newPracticeRun();
    renderPodium();
    renderMarathonBar();
    showEnd();
  }
  function marathonWin() {
    var t = target();
    collectPlayer(t); // v13 : tout joueur deviné colle sa vignette (tous modes)
    if (ranked()) { mday.serie += 1; mday.g = []; }
    else { run.serie += 1; run.target = pickPracticeTarget()[0]; run.g = []; }
    saveMarathonState();
    confetti(26);
    var s = serieActuelle();
    var bk = 'jm-mbest-' + diffKey(ranked());
    if (s > (parseInt(load(bk, '0'), 10) || 0)) save(bk, String(s));
    nextRoundBanner('✅ C’était bien ' + t[0] + ' ! Série : ' + s + ' — joueur suivant…', 1600);
  }

  // ── Logique DUEL ──
  // fresh = toujours repartir de zéro (nouveau duel choisi ici) ; sinon on reprend
  // la sauvegarde — utile quand on rouvre un lien de défi déjà commencé.
  function startDuel(idx, challenger, fresh) {
    var code = duelEncode(idx);
    var saved = fresh ? null : loadJSON('jm-duel-' + code, null);
    duel = saved && saved.code === code ? saved : { code: code, targetName: DATA[idx][0], g: [], done: false, won: false, t0: Date.now() };
    if (!duel.done && !duel.t0) duel.t0 = Date.now();
    duel.target = findPlayer(duel.targetName);
    duel.challenger = challenger || duel.challenger || null;
    el['duel-intro'].hidden = true;
  }
  function saveDuel() {
    var copy = { code: duel.code, targetName: duel.targetName, g: duel.g, done: duel.done, won: duel.won, challenger: duel.challenger, t0: duel.t0, secs: duel.secs };
    save('jm-duel-' + duel.code, JSON.stringify(copy));
  }
  function finishDuel(won) {
    duel.done = true; duel.won = won;
    if (duel.secs == null && duel.t0) duel.secs = Math.round((Date.now() - duel.t0) / 1000);
    saveDuel();
    if (won) { confetti(90); collectPlayer(duel.target); }
    showEnd();
  }
  function duelLink() {
    return SITE + '#d=' + duel.code + '&s=' + (duel.won ? duel.g.length : 0) +
      (duel.secs != null ? '&t=' + duel.secs : '') +
      (pseudo ? '&n=' + encodeURIComponent(pseudo) : '');
  }
  function duelShareMsg() {
    return '⚔️ Je te défie sur un Joueur Mystère ! ' +
      (duel.won ? 'Je l’ai trouvé en ' + duel.g.length + '/6' + (duel.secs != null ? ' (⏱ ' + fmtSecs(duel.secs) + ')' : '') + '.' : 'Moi je ne l’ai pas eu…') +
      ' À toi : ' + duelLink();
  }
  var lastDuelExpert = false; // pour que « NOUVEAU DUEL » relance le même type
  function launchDuel(expert) {
    lastDuelExpert = !!expert;
    startDuel(expert ? randomAny() : randomStar(), null, true);
    hideEnd();
    renderBoard(); renderStartHint(); renderHint();
    el['guess-input'].focus();
  }
  el['btn-duel-new'].addEventListener('click', function () { launchDuel(false); });
  el['btn-duel-expert'].addEventListener('click', function () { launchDuel(true); });
  el['duel-url'].addEventListener('focus', function () { this.select(); });
  el['btn-copy-duel'].addEventListener('click', function () {
    el['duel-url'].select();
    copyToClipboard(duelShareMsg(), '✓ Lien copié ! Envoie-le à ta victime.');
  });
  el['btn-send-duel'].hidden = !navigator.share;
  el['btn-send-duel'].addEventListener('click', function () {
    navigator.share({ text: duelShareMsg() }).then(function () { el['copy-feedback'].textContent = '✓ Défi envoyé !'; }, function () {});
  });

  // ── Verdict d'un essai ──
  function submitGuess(p) {
    if (isDone() || !p || el['round-banner'].hidden === false) return;
    if (MODE === 'duel' && !duel) return;
    var done = guesses().map(norm);
    if (done.indexOf(norm(p[0])) !== -1) { el.notice.textContent = 'Déjà essayé !'; return; }
    el.notice.textContent = '';
    el['guess-input'].value = '';
    el.suggestions.hidden = true;

    var t = target();
    guesses().push(p[0]);
    if (MODE === 'jour') save('jm-' + DAY, JSON.stringify(jour));
    else if (MODE === 'duel') saveDuel();
    else if (MODE === 'coupe') saveCoupe();
    else if (ranked()) save('jm-mday-' + DAY, JSON.stringify(mday));
    else save('jm-run', JSON.stringify(run));

    renderGuess(p, t, true);
    renderTries();
    if (MODE === 'coupe') renderCoupeBar(); // le budget du tournoi vient de baisser

    var win = p[0] === t[0];
    var out = guesses().length >= maxTriesNow() && !win;
    setTimeout(function () {
      if (MODE === 'jour') {
        if (win) finishJour(true); else if (out) finishJour(false); else renderHint();
      } else if (MODE === 'duel') {
        if (win) finishDuel(true); else if (out) finishDuel(false); else renderHint();
      } else if (MODE === 'coupe') {
        if (win) coupeWin(); else if (out) endCoupe(); else renderHint();
      } else {
        if (win) marathonWin(); else if (out) endMarathon(); else renderHint();
      }
    }, 700);
  }

  // ── Partage ──
  function shareText() {
    if (MODE === 'jour') {
      var grid = jour.g.map(function (name) {
        var p = findPlayer(name);
        return p ? guessEmojis(marksFor(p, TARGET_JOUR)) : '';
      }).filter(Boolean);
      var head = '⚽ Joueur Mystère n°' + PUZZLE_NUM + ' — ' + (jour.won ? jour.g.length : 'X') + '/' + MAX_TRIES;
      if (jour.won && jour.secs != null) head += ' · ⏱ ' + fmtSecs(jour.secs);
      if (jour.won && statsJour.streak > 1) head += ' 🔥' + statsJour.streak;
      return [head].concat(grid).concat(['À toi de jouer : ' + SITE]).join('\n');
    }
    if (MODE === 'duel') {
      return '⚔️ Je te défie sur un Joueur Mystère ! À toi : ' + duelLink();
    }
    if (MODE === 'coupe' && coupe && coupe.done) {
      return '⚽ Joueur Mystère — La Coupe 🏆\n' +
        (coupe.won ? 'CHAMPION ! Note ' + coupe.note + '/100' : COUPE_ELIM_TITRES[coupe.round] + ' · note ' + coupe.note + '/100') +
        '\nFais mieux : ' + SITE;
    }
    var s = endedRun ? endedRun.serie : serieActuelle();
    var lbl = endedRun && endedRun.ranked ? 'Marathon du jour n°' + PUZZLE_NUM : 'Marathon (entraînement)';
    return '⚽ Joueur Mystère — ' + lbl + '\n🏁 ' + s + ' joueur' + (s > 1 ? 's' : '') + ' d’affilée\nBats ma série : ' + SITE;
  }
  function legacyCopy(txt) {
    try {
      var ta = document.createElement('textarea');
      ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var done = document.execCommand('copy');
      document.body.removeChild(ta);
      return done;
    } catch (e) { return false; }
  }
  function copyToClipboard(txt, okMsg) {
    var fb = el['copy-feedback'];
    function ok() { fb.textContent = okMsg || '✓ Copié !'; }
    function ko() { fb.textContent = 'Copie bloquée — sélectionne : ' + txt.replace(/\n/g, ' · '); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(ok, function () { legacyCopy(txt) ? ok() : ko(); });
    } else { legacyCopy(txt) ? ok() : ko(); }
  }
  el['btn-share'].addEventListener('click', function () {
    var txt = shareText();
    if (navigator.share) {
      navigator.share({ text: txt }).then(function () { el['copy-feedback'].textContent = '✓ Partagé !'; },
        function () { copyToClipboard(txt, '✓ Copié ! Colle ça sur X ou dans le groupe.'); });
    } else copyToClipboard(txt, '✓ Copié ! Colle ça sur X ou dans le groupe.');
  });

  // ── Saisie + suggestions ──
  var activeSug = -1, currentSugs = [];
  function refreshSugs() {
    var q = norm(el['guess-input'].value);
    activeSug = -1;
    if (q.length < 2) { el.suggestions.hidden = true; currentSugs = []; return; }
    // Anti-triche : on ne cherche que sur le NOM du joueur — taper un club ou un
    // pays ne liste plus rien (sinon la recherche servait d'outil de déduction).
    var done = guesses().map(norm);
    currentSugs = [];
    for (var i = 0; i < DATA.length && currentSugs.length < 6; i++) {
      var n = NORMS[i];
      if (n.indexOf(q) === -1 && !(ALIASES[n] && ALIASES[n].indexOf(q) !== -1)) continue;
      if (done.indexOf(n) !== -1) continue;
      currentSugs.push(DATA[i]);
    }
    if (!currentSugs.length) { el.suggestions.hidden = true; return; }
    el.suggestions.innerHTML = currentSugs.map(function (p, i) {
      return '<div class="sug" data-i="' + i + '">' + clubBadge(p[1]) +
        '<span class="sug-name">' + flagHTML(p[4]) + ' ' + esc(p[0]) + '</span><small>' + esc(p[1]) + '</small></div>';
    }).join('');
    el.suggestions.hidden = false;
  }
  el['guess-input'].addEventListener('input', refreshSugs);
  el['guess-input'].addEventListener('keydown', function (e) {
    if (el.suggestions.hidden) { if (e.key === 'Enter') e.preventDefault(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      activeSug = (activeSug + (e.key === 'ArrowDown' ? 1 : -1) + currentSugs.length) % currentSugs.length;
      Array.prototype.forEach.call(el.suggestions.children, function (c, i) { c.classList.toggle('active', i === activeSug); });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submitGuess(currentSugs[activeSug === -1 ? 0 : activeSug]);
    } else if (e.key === 'Escape') el.suggestions.hidden = true;
  });
  el.suggestions.addEventListener('pointerdown', function (e) {
    var s = e.target.closest('.sug');
    if (s) submitGuess(currentSugs[parseInt(s.dataset.i, 10)]);
  });
  el['btn-guess'].addEventListener('click', function () {
    var p = findPlayer(el['guess-input'].value) || currentSugs[0];
    if (p) submitGuess(p);
    else if (el['guess-input'].value.trim()) el.notice.textContent = 'Joueur inconnu au bataillon — choisis dans la liste.';
  });
  document.addEventListener('pointerdown', function (e) {
    if (!e.target.closest('#guess-zone')) el.suggestions.hidden = true;
  });

  // ── Changement de mode ──
  function setMode(m) {
    MODE = m;
    ['jour', 'coupe', 'marathon', 'duel'].forEach(function (x) {
      el['tab-' + x].setAttribute('aria-selected', x === m);
    });
    renderCoupeBar();
    renderCoupeIntro();
    el['marathon-bar'].style.display = m === 'marathon' ? 'flex' : 'none';
    if (m !== 'marathon') el['diff-picker'].hidden = true;
    el.stats.style.display = m === 'jour' ? 'flex' : 'none';
    el.podium.hidden = m !== 'marathon';
    el.classement.hidden = m !== 'marathon' || !LB;
    el['duel-intro'].hidden = m !== 'duel' || !!duel;
    el['round-banner'].hidden = true;
    el.notice.textContent = '';
    el['copy-feedback'].textContent = '';

    if (m === 'marathon') {
      marathonOver = false;
      endedRun = null;
      if (!ranked() && !run) newPracticeRun();
      if (!draftPending()) { // pendant le draft, le chrono attend le choix du joker
        armMarathonDeadline(false);
        if (marathonExpired()) endMarathon(true); // le temps a tourné pendant l'absence : la série tombe
      }
      renderMarathonBar();
      renderPodium();
      if (LB) refreshClassement();
    }
    if (m === 'duel' && !duel) {
      el['guess-zone'].style.display = 'none';
      el.endcard.hidden = true;
      clearBoard(); renderTries();
      el['start-hint'].style.display = 'none';
      el.hint.hidden = true;
      el.notes.hidden = true;
      return;
    }
    if (m === 'coupe' && (!coupe || coupe.done) && !packEnAttente()) {
      // Pas de run en cours : l'affiche de la Coupe (palmarès + album) tient la scène
      el['guess-zone'].style.display = 'none';
      el.endcard.hidden = true;
      clearBoard();
      el.tries.innerHTML = '';
      el['start-hint'].style.display = 'none';
      el.hint.hidden = true;
      el.notes.hidden = true;
      return;
    }
    if (isDone()) showEnd(); else hideEnd();
    renderBoard();
    renderStartHint();
    renderHint();
    if (m === 'marathon') renderDraft(); // le draft, s'il est dû, recouvre la zone de jeu
  }
  el['tab-jour'].addEventListener('click', function () { setMode('jour'); });
  el['tab-coupe'].addEventListener('click', function () { setMode('coupe'); });
  el['tab-marathon'].addEventListener('click', function () { setMode('marathon'); });
  el['tab-duel'].addEventListener('click', function () { setMode('duel'); });

  // ── Boutons marathon ──
  el['btn-again'].addEventListener('click', function () {
    if (MODE === 'duel') {
      launchDuel(lastDuelExpert);
      return;
    }
    if (MODE === 'coupe') {
      startCoupeRun();
      return;
    }
    marathonOver = false;
    endedRun = null;
    renderMarathonBar();
    hideEnd();
    renderBoard(); renderStartHint(); renderHint();
    if (renderDraft()) return; // nouvelle série = nouveau draft de jokers
    armMarathonDeadline(true);
    el['guess-input'].focus();
  });
  var abandonArmed = false;
  el['btn-abandon'].addEventListener('click', function () {
    if (MODE !== 'marathon' || marathonOver) return;
    if (!abandonArmed) {
      abandonArmed = true;
      el['btn-abandon'].textContent = 'Sûr ?';
      setTimeout(function () { abandonArmed = false; el['btn-abandon'].textContent = 'Abandonner'; }, 2500);
      return;
    }
    abandonArmed = false;
    el['btn-abandon'].textContent = 'Abandonner';
    endMarathon(false, true); // abandon volontaire : la seconde chance ne joue pas
  });

  // ── Démarrage : rendu synchrone ──
  // v14 (recentrage) : la Coupe est le SEUL mode visible — Jour, Marathon et
  // Duel sont en sommeil (code conservé, onglets masqués, liens #d= ignorés).
  // Pour les réactiver : ré-afficher #modes dans index.html et restaurer ici
  // l'aiguillage incomingDuel → setMode('duel').
  setMode('coupe');
  renderStatsJour();
  var appChronoTimer = setInterval(tickAppChrono, 500);
  tickAppChrono();

  // ── PWA ──
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () { /* hors ligne indisponible, le jeu marche quand même */ });
  }
})();
