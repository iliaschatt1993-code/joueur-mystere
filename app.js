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

  function norm(s) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function findPlayer(name) {
    var n = norm(name);
    for (var i = 0; i < DATA.length; i++) if (norm(DATA[i][0]) === n) return DATA[i];
    return null;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }

  // ── Éléments ──
  var el = {};
  ['puzzle-meta', 'tab-jour', 'tab-marathon', 'tab-duel', 'marathon-bar', 'mb-label', 'mb-serie', 'mb-best', 'btn-abandon',
   'start-hint', 'guess-zone', 'guess-input', 'btn-guess', 'suggestions', 'notice', 'tries', 'board',
   'round-banner', 'hint', 'duel-intro', 'btn-duel-new', 'endcard', 'end-verdict', 'end-player', 'end-desc', 'end-streak',
   'end-social', 'btn-again', 'btn-share', 'btn-duel-link', 'copy-feedback', 'countdown',
   'stats', 's-played', 's-rate', 's-streak', 's-max', 'podium', 'podium-list',
   'classement', 'classement-list', 'classement-note', 'btn-refresh-classement',
   'pseudo-dialog', 'pseudo-input', 'btn-pseudo-ok', 'storage-warn', 'data-count'].forEach(function (id) {
    el[id] = document.getElementById(id);
  });
  el['data-count'].textContent = DATA.length;
  el['puzzle-meta'].textContent =
    'N°' + PUZZLE_NUM + ' · ' + new Date(DAY + 'T12:00:00').toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' });

  // ── État JOUR ──
  var TARGET_JOUR = DATA[fnv('joueur-mystere:' + DAY) % DATA.length];
  var jour = loadJSON('jm-' + DAY, { g: [], done: false, won: false });
  var statsJour = loadJSON('jm-stats', { played: 0, wins: 0, streak: 0, maxStreak: 0, lastWin: null });

  // ── État MARATHON ──
  // Marathon DU JOUR (classé) : même séquence pour tout le monde, une tentative par jour.
  var mdayOrder = (function () {
    var rng = mulberry32(fnv('marathon:' + DAY));
    var idx = DATA.map(function (_, i) { return i; });
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

  function mdayTarget() { return DATA[mdayOrder[mday.serie % DATA.length]]; }
  function ranked() { return !mday.done; } // le marathon est classé tant que la tentative du jour n'est pas finie
  function pickPracticeTarget() {
    var pool = DATA.filter(function (p) { return recent.indexOf(p[0]) === -1; });
    if (!pool.length) { recent = []; pool = DATA; }
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
    var m = location.hash.match(/^#d=([a-z0-9]+)(?:&s=(\d+))?(?:&n=([^&]*))?/);
    if (!m) return null;
    var i = duelDecode(m[1]);
    if (i < 0) return null;
    return { code: m[1], idx: i, challengerScore: m[2] ? parseInt(m[2], 10) : null, challengerName: m[3] ? decodeURIComponent(m[3]).slice(0, 20) : null };
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
      cellHTML('name-cell' + (p[0] === t[0] ? ' ok' : ''), p[0].split(' ').slice(-1)[0], p[0].split(' ').slice(0, -1).join(' ')) +
      cellHTML(m.nat, p[4], p[3]) +
      cellHTML(m.lg, LEAGUE_FLAG[p[2]] || '⚽', p[2]) +
      '<div class="cell ' + m.club + '"><span style="font-size:13px">' + p[1] + '</span></div>' +
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
    el['start-hint'].innerHTML = '🧭 Indice de départ : le mystère est <strong>' + LINE_PHRASE[POS_LINE[t[6]]] + '</strong>.';
    el['start-hint'].style.display = isDone() ? 'none' : 'block';
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

  function showEnd() {
    var t;
    if (MODE === 'marathon' && endedRun) t = findPlayer(endedRun.target);
    else t = target();
    el['guess-zone'].style.display = 'none';
    el['start-hint'].style.display = 'none';
    el.hint.hidden = true;
    el['copy-feedback'].textContent = '';
    el['end-social'].textContent = '';
    el['btn-duel-link'].hidden = true;
    el['end-player'].textContent = t[4] + ' ' + t[0];
    el['end-desc'].textContent = POS_LABEL[t[6]] + ' · ' + t[1] + ' (' + t[2] + ') · ' + ageOf(t) + ' ans';
    el.countdown.style.display = 'none';
    el['btn-again'].hidden = true;

    if (MODE === 'jour') {
      el['end-verdict'].textContent = jour.won ? 'Trouvé en ' + jour.g.length + '/' + MAX_TRIES + ' !' : 'Raté… c’était :';
      el['end-streak'].textContent = jour.won && statsJour.streak > 1 ? '🔥 Série de ' + statsJour.streak + ' jours'
        : (jour.won ? '' : 'Reviens demain pour te rattraper !');
      startCountdown();
      fetchDailySocial();
    } else if (MODE === 'marathon') {
      var s = endedRun ? endedRun.serie : 0;
      el['end-verdict'].textContent = 'Série terminée — le dernier était :';
      el['end-streak'].textContent = (s > 0
        ? '🏁 ' + s + ' joueur' + (s > 1 ? 's' : '') + ' d’affilée' + (s >= mBest && s > 0 ? ' — record perso !' : '')
        : 'Zéro. Ça arrive aux meilleurs.') + (endedRun && endedRun.ranked && LB ? ' · score envoyé au classement du jour' : '');
      el['btn-again'].hidden = false;
      el['btn-again'].textContent = endedRun && endedRun.ranked ? 'ENTRAÎNEMENT LIBRE' : 'REJOUER';
      if (endedRun && endedRun.ranked) startCountdown();
    } else { // duel
      var mine = duel.won ? duel.g.length : 0;
      if (duel.challenger) {
        var theirs = duel.challenger.score;
        var verdict = !duel.won && !theirs ? 'Double zéro — personne ne le trouve !' :
          !theirs ? 'Victoire ! ' + (duel.challenger.name || 'Ton adversaire') + ' ne l’avait pas trouvé.' :
          !duel.won ? (duel.challenger.name || 'Ton adversaire') + ' gagne (' + theirs + '/6) — tu ne l’as pas trouvé.' :
          mine < theirs ? 'Victoire ' + mine + '/6 contre ' + theirs + '/6 !' :
          mine > theirs ? (duel.challenger.name || 'Ton adversaire') + ' gagne : ' + theirs + '/6 contre ' + mine + '/6.' :
          'Égalité parfaite : ' + mine + '/6 partout.';
        el['end-verdict'].textContent = '⚔️ ' + verdict;
        el['end-streak'].textContent = '';
      } else {
        el['end-verdict'].textContent = duel.won ? 'Trouvé en ' + mine + '/' + MAX_TRIES + ' ! Maintenant, défie quelqu’un.' : 'Raté… mais tu peux quand même défier quelqu’un.';
        el['end-streak'].textContent = '';
      }
      el['btn-duel-link'].hidden = false;
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
    save('jm-' + DAY, JSON.stringify(jour));
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
  function endMarathon() {
    marathonOver = true;
    var wasRanked = ranked();
    var s = wasRanked ? mday.serie : run.serie;
    var tName = wasRanked ? mdayTarget()[0] : run.target;
    endedRun = { serie: s, target: tName, ranked: wasRanked };
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
    if (ranked()) { mday.serie += 1; mday.g = []; save('jm-mday-' + DAY, JSON.stringify(mday)); }
    else { run.serie += 1; run.target = pickPracticeTarget()[0]; run.g = []; save('jm-run', JSON.stringify(run)); }
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
  function startDuel(idx, challenger) {
    var code = duelEncode(idx);
    var saved = loadJSON('jm-duel-' + code, null);
    duel = saved && saved.code === code ? saved : { code: code, targetName: DATA[idx][0], g: [], done: false, won: false };
    duel.target = findPlayer(duel.targetName);
    duel.challenger = challenger || duel.challenger || null;
    el['duel-intro'].hidden = true;
  }
  function saveDuel() {
    var copy = { code: duel.code, targetName: duel.targetName, g: duel.g, done: duel.done, won: duel.won, challenger: duel.challenger };
    save('jm-duel-' + duel.code, JSON.stringify(copy));
  }
  function finishDuel(won) {
    duel.done = true; duel.won = won;
    saveDuel();
    showEnd();
  }
  function duelLink() {
    return SITE + '#d=' + duel.code + '&s=' + (duel.won ? duel.g.length : 0) + (pseudo ? '&n=' + encodeURIComponent(pseudo) : '');
  }
  el['btn-duel-new'].addEventListener('click', function () {
    startDuel(Math.floor(Math.random() * DATA.length), null);
    hideEnd();
    renderBoard(); renderStartHint(); renderHint();
    el['guess-input'].focus();
  });
  el['btn-duel-link'].addEventListener('click', function () {
    askPseudo(function () {
      copyToClipboard('⚔️ Je te défie sur un Joueur Mystère ! ' + (duel.won ? 'Trouvé en ' + duel.g.length + '/6.' : 'Moi je ne l’ai pas eu…') + ' À toi : ' + duelLink(),
        '✓ Lien de défi copié ! Envoie-le à ta victime.');
    });
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
    var done = guesses().map(norm);
    currentSugs = DATA.filter(function (p) {
      if (done.indexOf(norm(p[0])) !== -1) return false;
      var n = norm(p[0]);
      return n.indexOf(q) !== -1 || norm(p[1]).indexOf(q) !== -1 || norm(p[3]).indexOf(q) !== -1 ||
        (ALIASES[n] && ALIASES[n].indexOf(q) !== -1);
    }).slice(0, 6);
    if (!currentSugs.length) { el.suggestions.hidden = true; return; }
    el.suggestions.innerHTML = currentSugs.map(function (p, i) {
      return '<div class="sug" data-i="' + i + '">' + p[4] + ' ' + p[0] + '<small>' + p[1] + '</small></div>';
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
      startDuel(Math.floor(Math.random() * DATA.length), null);
      hideEnd(); renderBoard(); renderStartHint(); renderHint();
      el['guess-input'].focus();
      return;
    }
    marathonOver = false;
    endedRun = null;
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
      ? { name: incomingDuel.challengerName, score: incomingDuel.challengerScore } : null);
    setMode('duel');
  } else {
    setMode('jour');
  }
  renderStatsJour();

  // ── PWA ──
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () { /* hors ligne indisponible, le jeu marche quand même */ });
  }
})();
