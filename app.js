(function () {
  'use strict';

  var DATA = window.JM_DATA;
  var CFG = window.JM_CONFIG || {};
  var SITE = 'https://iliaschatt1993-code.github.io/joueur-mystere/';
  var MAX_TRIES = 6;
  var EPOCH = '2026-08-27'; // n°1 du mode jour

  var LEAGUE_FLAG = {
    'Premier League': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'La Liga': '🇪🇸', 'Serie A': '🇮🇹', 'Bundesliga': '🇩🇪', 'Ligue 1': '🇫🇷',
    'Pro League': '🇧🇪', 'Saudi Pro League': '🇸🇦', 'MLS': '🇺🇸', 'Liga Portugal': '🇵🇹', 'Eredivisie': '🇳🇱',
    'Süper Lig': '🇹🇷', 'Brasileirão': '🇧🇷', 'Primera División ARG': '🇦🇷'
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
  var ROUND_SECS = 90; // marathon : temps par joueur (anti-triche : pas de réflexion infinie)
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
  function findPlayer(name) {
    var n = norm(name);
    var i = NORMS.indexOf(n);
    return i === -1 ? null : DATA[i];
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }

  // ── Éléments ──
  var el = {};
  ['puzzle-meta', 'tab-jour', 'tab-marathon', 'tab-duel', 'marathon-bar', 'mb-label', 'mb-serie', 'mb-best', 'btn-abandon',
   'start-hint', 'guess-zone', 'guess-input', 'btn-guess', 'suggestions', 'notice', 'chrono', 'tries', 'board',
   'round-banner', 'hint', 'duel-intro', 'btn-duel-new', 'endcard', 'end-visual', 'end-verdict', 'end-player', 'end-desc', 'end-streak',
   'end-social', 'btn-again', 'btn-share', 'duel-share', 'duel-url', 'btn-copy-duel', 'btn-send-duel', 'wa-duel', 'copy-feedback', 'countdown',
   'stats', 's-played', 's-rate', 's-streak', 's-max', 'podium', 'podium-list',
   'classement', 'classement-list', 'classement-note', 'btn-refresh-classement',
   'pseudo-dialog', 'pseudo-input', 'btn-pseudo-ok', 'storage-warn', 'data-count'].forEach(function (id) {
    el[id] = document.getElementById(id);
  });
  el['data-count'].textContent = DATA.length.toLocaleString('fr-BE') + ' joueurs devinables · ' + STAR_IDX.length + ' mystères possibles';
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
  var mdayOrder = (function () {
    var rng = mulberry32(fnv('marathon:' + DAY));
    var idx = STAR_IDX.slice();
    for (var i = idx.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = idx[i]; idx[i] = idx[j]; idx[j] = tmp;
    }
    return idx;
  })();
  var mday = loadJSON('jm-mday-' + DAY, { serie: 0, g: [], done: false });
  // Entraînement libre (après le classé du jour) : aléatoire, illimité
  var run = loadJSON('jm-run', null);
  var mBest = parseInt(load('jm-mbest', '0'), 10) || 0;
  var podium = loadJSON('jm-podium', []);
  var recent = loadJSON('jm-recent', []);

  function mdayTarget() { return DATA[mdayOrder[mday.serie % mdayOrder.length]]; }
  function ranked() { return !mday.done; } // le marathon est classé tant que la tentative du jour n'est pas finie
  function pickPracticeTarget() {
    var stars = STAR_IDX.map(function (i) { return DATA[i]; });
    var pool = stars.filter(function (p) { return recent.indexOf(p[0]) === -1; });
    if (!pool.length) { recent = []; pool = stars; }
    var p = pool[Math.floor(Math.random() * pool.length)];
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

  if (!storageOK) el['storage-warn'].hidden = false;

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

  // ── Classement en ligne (Supabase, optionnel) ──
  var LB = CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY ? {
    headers: { 'apikey': CFG.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + CFG.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    post: function (path, body) {
      return fetch(CFG.SUPABASE_URL + path, { method: 'POST', headers: this.headers, body: JSON.stringify(body) });
    }
  } : null;

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

  // ── Mode courant ──
  var MODE = 'jour';
  var marathonOver = false;
  var endedRun = null; // photo de la série marathon terminée {serie, target, ranked}

  function target() {
    if (MODE === 'jour') return TARGET_JOUR;
    if (MODE === 'duel') return duel ? duel.target : TARGET_JOUR;
    return ranked() ? mdayTarget() : findPlayer(run.target);
  }
  function guesses() {
    if (MODE === 'jour') return jour.g;
    if (MODE === 'duel') return duel ? duel.g : [];
    return ranked() ? mday.g : run.g;
  }
  function isDone() {
    if (MODE === 'jour') return jour.done;
    if (MODE === 'duel') return !duel || duel.done;
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
    for (var i = 0; i < MAX_TRIES; i++) {
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
  function renderStartHint() {
    if (MODE === 'duel' && !duel) { el['start-hint'].style.display = 'none'; return; }
    var t = target();
    el['start-hint'].innerHTML = '<span class="mini-jersey">' + jerseySVG(t, true) + '</span>' +
      '<span>🧭 Indice de départ : le mystère est <strong>' + LINE_PHRASE[POS_LINE[t[6]]] + '</strong>.</span>';
    el['start-hint'].style.display = isDone() ? 'none' : 'flex';
  }
  function renderHint() {
    if (!isDone() && guesses().length >= 4 && !(MODE === 'duel' && !duel)) {
      var initials = target()[0].split(' ').map(function (w) { return w.charAt(0) + '.'; }).join(' ');
      el.hint.textContent = '🕵️ Indice : ses initiales sont « ' + initials + ' »';
      el.hint.hidden = false;
    } else el.hint.hidden = true;
  }
  function renderStatsJour() {
    el['s-played'].textContent = statsJour.played;
    el['s-rate'].textContent = statsJour.played ? Math.round(100 * statsJour.wins / statsJour.played) + '%' : '0%';
    el['s-streak'].textContent = statsJour.streak;
    el['s-max'].textContent = statsJour.maxStreak;
  }
  function renderPodium() {
    el['podium-list'].innerHTML = podium.slice(0, 5).map(function (r, i) {
      var medal = ['🥇', '🥈', '🥉', '4.', '5.'][i];
      var date = new Date(r.d + 'T12:00:00').toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' });
      return '<li><span class="medal">' + medal + '</span><span class="score">' + r.s + ' joueur' + (r.s > 1 ? 's' : '') + '</span><span>' + date + '</span></li>';
    }).join('') || '<li><span>Aucune série terminée — lance-toi !</span></li>';
  }
  function renderMarathonBar() {
    el['mb-label'].textContent = ranked() ? '🏆 Marathon du jour (classé)' : '🎲 Entraînement libre';
    el['mb-serie'].textContent = serieActuelle();
    el['mb-best'].textContent = mBest;
  }

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
      c.classList.remove('low');
      if (jour.done) {
        c.hidden = jour.secs == null;
        if (jour.secs != null) c.textContent = '⏱ ' + fmtSecs(jour.secs);
      } else if (jour.t0) {
        c.hidden = false;
        c.textContent = '⏱ ' + fmtSecs((Date.now() - jour.t0) / 1000);
      } else c.hidden = true;
    } else if (MODE === 'duel') {
      c.classList.remove('low');
      if (!duel) { c.hidden = true; return; }
      if (duel.done) {
        c.hidden = duel.secs == null;
        if (duel.secs != null) c.textContent = '⏱ ' + fmtSecs(duel.secs);
      } else {
        c.hidden = false;
        c.textContent = '⏱ ' + fmtSecs((Date.now() - (duel.t0 || Date.now())) / 1000);
      }
    } else {
      var st = marathonState();
      if (marathonOver || !st || !st.deadline) { c.hidden = true; return; }
      var rem = (st.deadline - Date.now()) / 1000;
      if (rem <= 0) {
        if (el['round-banner'].hidden) { c.hidden = true; endMarathon(true); }
        return;
      }
      c.hidden = false;
      c.textContent = '⏳ ' + fmtSecs(rem);
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
    el['copy-feedback'].textContent = '';
    el['end-social'].textContent = '';
    el['duel-share'].hidden = true;
    el['btn-share'].hidden = false;
    el['end-visual'].innerHTML = jerseySVG(t);
    el['end-player'].innerHTML = flagHTML(t[4]) + ' ' + esc(t[0]);
    el['end-desc'].textContent = POS_LABEL[t[6]] + ' · ' + t[1] + ' (' + t[2] + ') · ' + ageOf(t) + ' ans';
    el.countdown.style.display = 'none';
    el['btn-again'].hidden = true;

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
        ? '🏁 ' + s + ' joueur' + (s > 1 ? 's' : '') + ' d’affilée' + (s >= mBest && s > 0 ? ' — record perso !' : '')
        : 'Zéro. Ça arrive aux meilleurs.') + (endedRun && endedRun.ranked && LB ? ' · score envoyé au classement du jour' : '');
      el['btn-again'].hidden = false;
      el['btn-again'].textContent = endedRun && endedRun.ranked ? 'ENTRAÎNEMENT LIBRE' : 'REJOUER';
      if (endedRun && endedRun.ranked) startCountdown();
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
    if (won) confetti(90);
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
    if (force || !st.deadline) {
      st.deadline = Date.now() + ROUND_SECS * 1000 + (graceMs || 0);
      saveMarathonState();
    }
  }
  function marathonExpired() {
    var st = marathonState();
    return !!(st && st.deadline && Date.now() > st.deadline);
  }
  function endMarathon(timedOut) {
    marathonOver = true;
    var wasRanked = ranked();
    var s = wasRanked ? mday.serie : run.serie;
    var tName = wasRanked ? mdayTarget()[0] : run.target;
    endedRun = { serie: s, target: tName, ranked: wasRanked, timeout: !!timedOut };
    if (s > 0) {
      podium.push({ s: s, d: DAY });
      podium.sort(function (a, b) { return b.s - a.s; });
      podium = podium.slice(0, 5);
      save('jm-podium', JSON.stringify(podium));
    }
    if (s > mBest) { mBest = s; save('jm-mbest', String(mBest)); }
    if (wasRanked) {
      mday.done = true;
      save('jm-mday-' + DAY, JSON.stringify(mday));
      submitMarathonScore(s);
    }
    newPracticeRun();
    renderPodium();
    renderMarathonBar();
    showEnd();
  }
  function marathonWin() {
    var t = target();
    if (ranked()) { mday.serie += 1; mday.g = []; }
    else { run.serie += 1; run.target = pickPracticeTarget()[0]; run.g = []; }
    armMarathonDeadline(true, 1600); // nouveau joueur = nouveau compte à rebours (+ le temps de la bannière)
    confetti(26);
    var s = serieActuelle();
    if (s > mBest) { mBest = s; save('jm-mbest', String(mBest)); }
    renderMarathonBar();
    el['round-banner'].textContent = '✅ C’était bien ' + t[0] + ' ! Série : ' + s + ' — joueur suivant…';
    el['round-banner'].hidden = false;
    el['guess-zone'].style.display = 'none';
    setTimeout(function () {
      el['round-banner'].hidden = true;
      if (MODE === 'marathon') {
        el['guess-zone'].style.display = 'block';
        renderBoard();
        renderStartHint();
        renderHint();
        el['guess-input'].focus();
      }
    }, 1600);
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
    if (won) confetti(90);
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
  el['btn-duel-new'].addEventListener('click', function () {
    startDuel(randomStar(), null, true);
    hideEnd();
    renderBoard(); renderStartHint(); renderHint();
    el['guess-input'].focus();
  });
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
    else if (ranked()) save('jm-mday-' + DAY, JSON.stringify(mday));
    else save('jm-run', JSON.stringify(run));

    renderGuess(p, t, true);
    renderTries();

    var win = p[0] === t[0];
    var out = guesses().length >= MAX_TRIES && !win;
    setTimeout(function () {
      if (MODE === 'jour') {
        if (win) finishJour(true); else if (out) finishJour(false); else renderHint();
      } else if (MODE === 'duel') {
        if (win) finishDuel(true); else if (out) finishDuel(false); else renderHint();
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
    ['jour', 'marathon', 'duel'].forEach(function (x) {
      el['tab-' + x].setAttribute('aria-selected', x === m);
    });
    el['marathon-bar'].style.display = m === 'marathon' ? 'flex' : 'none';
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
      armMarathonDeadline(false);
      if (marathonExpired()) endMarathon(true); // le temps a tourné pendant l'absence : la série tombe
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
      return;
    }
    if (isDone()) showEnd(); else hideEnd();
    renderBoard();
    renderStartHint();
    renderHint();
  }
  el['tab-jour'].addEventListener('click', function () { setMode('jour'); });
  el['tab-marathon'].addEventListener('click', function () { setMode('marathon'); });
  el['tab-duel'].addEventListener('click', function () { setMode('duel'); });

  // ── Boutons marathon ──
  el['btn-again'].addEventListener('click', function () {
    if (MODE === 'duel') {
      startDuel(randomStar(), null, true);
      hideEnd(); renderBoard(); renderStartHint(); renderHint();
      el['guess-input'].focus();
      return;
    }
    marathonOver = false;
    endedRun = null;
    armMarathonDeadline(true);
    renderMarathonBar();
    hideEnd();
    renderBoard(); renderStartHint(); renderHint();
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
    endMarathon();
  });

  // ── Démarrage : rendu synchrone ──
  if (incomingDuel) {
    startDuel(incomingDuel.idx, incomingDuel.challengerScore !== null
      ? { name: incomingDuel.challengerName, score: incomingDuel.challengerScore, secs: incomingDuel.challengerSecs } : null);
    setMode('duel');
  } else {
    setMode('jour');
  }
  renderStatsJour();
  var appChronoTimer = setInterval(tickAppChrono, 500);
  tickAppChrono();

  // ── PWA ──
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () { /* hors ligne indisponible, le jeu marche quand même */ });
  }
})();
