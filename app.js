(function () {
  'use strict';

  var DATA = window.JM_DATA;
  var SITE = 'https://iliaschatt1993-code.github.io/joueur-mystere/';
  var MAX_TRIES = 6;
  var EPOCH = '2026-08-27'; // n°1 du mode jour

  var LEAGUE_FLAG = {
    'Premier League': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'La Liga': '🇪🇸', 'Serie A': '🇮🇹', 'Bundesliga': '🇩🇪', 'Ligue 1': '🇫🇷',
    'Pro League': '🇧🇪', 'Saudi Pro League': '🇸🇦', 'MLS': '🇺🇸', 'Liga Portugal': '🇵🇹', 'Eredivisie': '🇳🇱',
    'Süper Lig': '🇹🇷', 'Brasileirão': '🇧🇷', 'Primera División ARG': '🇦🇷'
  };
  var POS_LABEL = { G: 'Gardien', D: 'Défenseur', M: 'Milieu', A: 'Attaquant' };
  var POS_PHRASE = { G: 'un gardien', D: 'un défenseur', M: 'un milieu', A: 'un attaquant' };
  var ALIASES = { 'cristiano ronaldo': 'cr7', 'kevin de bruyne': 'kdb' };

  // ── Stockage : refus jamais silencieux ──
  var storageOK = true;
  function load(k, fb) { try { var v = localStorage.getItem(k); return v === null ? fb : v; } catch (e) { storageOK = false; return fb; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) { storageOK = false; document.getElementById('storage-warn').hidden = false; } }
  function loadJSON(k, fb) { try { var v = load(k, null); return v === null ? fb : JSON.parse(v); } catch (e) { return fb; } }

  // ── Dates & hachage (mystère du jour identique pour tous) ──
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function fnv(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return h >>> 0;
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

  // ── Éléments ──
  var el = {};
  ['puzzle-meta', 'tab-jour', 'tab-marathon', 'marathon-bar', 'mb-serie', 'mb-best', 'btn-abandon',
   'start-hint', 'guess-zone', 'guess-input', 'btn-guess', 'suggestions', 'notice', 'tries', 'board',
   'round-banner', 'hint', 'endcard', 'end-verdict', 'end-player', 'end-desc', 'end-streak',
   'btn-again', 'btn-share', 'copy-feedback', 'countdown', 'stats', 's-played', 's-rate', 's-streak',
   's-max', 'podium', 'podium-list', 'storage-warn', 'data-count'].forEach(function (id) {
    el[id] = document.getElementById(id);
  });
  el['data-count'].textContent = DATA.length;

  // ── État du mode JOUR ──
  var TARGET_JOUR = DATA[fnv('joueur-mystere:' + DAY) % DATA.length];
  var jour = loadJSON('jm-' + DAY, { g: [], done: false, won: false });
  var statsJour = loadJSON('jm-stats', { played: 0, wins: 0, streak: 0, maxStreak: 0, lastWin: null });

  // ── État du mode MARATHON ──
  // run : { target: nom, g: [noms], serie: n } — persiste pour reprendre après fermeture
  var run = loadJSON('jm-run', null);
  var mBest = parseInt(load('jm-mbest', '0'), 10) || 0;
  var podium = loadJSON('jm-podium', []); // [{s: série, d: 'AAAA-MM-JJ'}]
  var recent = loadJSON('jm-recent', []); // derniers mystères marathon, pour éviter les répétitions

  function pickMarathonTarget() {
    var pool = DATA.filter(function (p) { return recent.indexOf(p[0]) === -1; });
    if (!pool.length) { recent = []; pool = DATA; }
    var p = pool[Math.floor(Math.random() * pool.length)];
    recent.push(p[0]);
    if (recent.length > 40) recent = recent.slice(-40);
    save('jm-recent', JSON.stringify(recent));
    return p;
  }
  function newRun() {
    run = { target: pickMarathonTarget()[0], g: [], serie: 0 };
    save('jm-run', JSON.stringify(run));
  }
  function nextRound() {
    run.target = pickMarathonTarget()[0];
    run.g = [];
    save('jm-run', JSON.stringify(run));
  }

  if (!storageOK) el['storage-warn'].hidden = false;

  // ── Mode courant + accès générique ──
  var MODE = 'jour';
  var marathonOver = false; // vrai uniquement entre la fin d'une série et le clic REJOUER
  var endedRun = null;      // photo de la série terminée (le run persistant est déjà réinitialisé)

  function target() { return MODE === 'jour' ? TARGET_JOUR : findPlayer(run.target); }
  function guesses() { return MODE === 'jour' ? jour.g : run.g; }
  function isDone() { return MODE === 'jour' ? jour.done : marathonOver; }

  // ── Rendu ──
  el['puzzle-meta'].textContent =
    'N°' + PUZZLE_NUM + ' · ' + new Date(DAY + 'T12:00:00').toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' });

  function cellHTML(cls, big, sub) {
    return '<div class="cell ' + cls + '"><span class="big">' + big + '</span>' + (sub ? '<span class="sub">' + sub + '</span>' : '') + '</div>';
  }
  function marksFor(p, t) {
    var da = ageOf(t) - ageOf(p);
    return {
      nat: p[3] === t[3] ? 'ok' : (p[5] === t[5] ? 'close' : ''),
      lg: p[2] === t[2] ? 'ok' : '',
      club: p[1] === t[1] ? 'ok' : (p[2] === t[2] ? 'close' : ''),
      pos: p[6] === t[6] ? 'ok' : '',
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
        '<span class="tag ' + m.pos + '">' + POS_LABEL[p[6]].charAt(0) + '</span>' +
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
    var t = target();
    el['start-hint'].innerHTML = '🧭 Indice de départ : le mystère est <strong>' + POS_PHRASE[t[6]] + '</strong>.';
    el['start-hint'].style.display = isDone() ? 'none' : 'block';
  }
  function renderHint() {
    if (!isDone() && guesses().length >= 4) {
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
    el['mb-serie'].textContent = run ? run.serie : 0;
    el['mb-best'].textContent = mBest;
  }

  // ── Fin de partie ──
  var countdownTimer = null;
  function tickCountdown() {
    var now = new Date();
    var mid = new Date(now); mid.setHours(24, 0, 0, 0);
    var s = Math.max(0, Math.floor((mid - now) / 1000));
    el.countdown.textContent = '⏳ Prochain mystère du jour dans ' +
      String(Math.floor(s / 3600)).padStart(2, '0') + ':' +
      String(Math.floor((s % 3600) / 60)).padStart(2, '0') + ':' +
      String(s % 60).padStart(2, '0');
  }

  function showEnd() {
    var t = (MODE === 'marathon' && endedRun) ? findPlayer(endedRun.target) : target();
    el['guess-zone'].style.display = 'none';
    el['start-hint'].style.display = 'none';
    el.hint.hidden = true;
    el['copy-feedback'].textContent = '';
    el['end-player'].textContent = t[4] + ' ' + t[0];
    el['end-desc'].textContent = POS_LABEL[t[6]] + ' · ' + t[1] + ' (' + t[2] + ') · ' + ageOf(t) + ' ans';

    if (MODE === 'jour') {
      el['end-verdict'].textContent = jour.won ? 'Trouvé en ' + jour.g.length + '/' + MAX_TRIES + ' !' : 'Raté… c’était :';
      el['end-streak'].textContent = jour.won && statsJour.streak > 1 ? '🔥 Série de ' + statsJour.streak + ' jours'
        : (jour.won ? '' : 'Reviens demain pour te rattraper !');
      el['btn-again'].hidden = true;
      el.countdown.style.display = 'block';
      tickCountdown();
      if (!countdownTimer) countdownTimer = setInterval(tickCountdown, 1000);
    } else {
      var s = endedRun ? endedRun.serie : 0;
      el['end-verdict'].textContent = 'Série terminée — le dernier était :';
      el['end-streak'].textContent = s > 0
        ? '🏁 ' + s + ' joueur' + (s > 1 ? 's' : '') + ' trouvé' + (s > 1 ? 's' : '') + ' d’affilée' + (s >= mBest && s > 0 ? ' — record !' : '')
        : 'Zéro. Ça arrive aux meilleurs.';
      el['btn-again'].hidden = false;
      el.countdown.style.display = 'none';
    }
    el.endcard.hidden = false;
  }
  function hideEnd() {
    el.endcard.hidden = true;
    el['guess-zone'].style.display = 'block';
  }

  // ── Logique de jeu ──
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
    showEnd();
  }

  function endMarathon() {
    marathonOver = true;
    endedRun = { serie: run.serie, target: run.target };
    if (run.serie > 0) {
      podium.push({ s: run.serie, d: DAY });
      podium.sort(function (a, b) { return b.s - a.s; });
      podium = podium.slice(0, 5);
      save('jm-podium', JSON.stringify(podium));
    }
    if (run.serie > mBest) { mBest = run.serie; save('jm-mbest', String(mBest)); }
    newRun(); // la prochaine série est prête, même si la page se ferme ici
    renderPodium();
    renderMarathonBar();
    showEnd();
  }

  function marathonWin() {
    var t = target();
    run.serie += 1;
    if (run.serie > mBest) { mBest = run.serie; save('jm-mbest', String(mBest)); }
    renderMarathonBar();
    el['round-banner'].textContent = '✅ C’était bien ' + t[0] + ' ! Série : ' + run.serie + ' — joueur suivant…';
    el['round-banner'].hidden = false;
    el['guess-zone'].style.display = 'none';
    setTimeout(function () {
      el['round-banner'].hidden = true;
      nextRound();
      if (MODE === 'marathon') {
        el['guess-zone'].style.display = 'block';
        renderBoard();
        renderStartHint();
        renderHint();
        el['guess-input'].focus();
      }
    }, 1600);
  }

  function submitGuess(p) {
    if (isDone() || !p || el['round-banner'].hidden === false) return;
    var done = guesses().map(norm);
    if (done.indexOf(norm(p[0])) !== -1) { el.notice.textContent = 'Déjà essayé !'; return; }
    el.notice.textContent = '';
    el['guess-input'].value = '';
    el.suggestions.hidden = true;

    var t = target();
    guesses().push(p[0]);
    if (MODE === 'jour') save('jm-' + DAY, JSON.stringify(jour));
    else save('jm-run', JSON.stringify(run));

    renderGuess(p, t, true);
    renderTries();

    var win = p[0] === t[0];
    var out = guesses().length >= MAX_TRIES && !win;
    // Laisse l'animation de révélation se jouer avant le verdict
    setTimeout(function () {
      if (MODE === 'jour') {
        if (win) finishJour(true);
        else if (out) finishJour(false);
        else renderHint();
      } else {
        if (win) marathonWin();
        else if (out) endMarathon();
        else renderHint();
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
    var s = endedRun ? endedRun.serie : run.serie;
    return '⚽ Joueur Mystère — mode Marathon\n🏁 ' + s + ' joueur' + (s > 1 ? 's' : '') +
      ' trouvé' + (s > 1 ? 's' : '') + ' d’affilée\nBats ma série : ' + SITE;
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
  el['btn-share'].addEventListener('click', function () {
    var txt = shareText();
    var fb = el['copy-feedback'];
    function ok() { fb.textContent = '✓ Copié ! Colle ça sur X ou dans le groupe.'; }
    function ko() { fb.textContent = 'Copie bloquée — sélectionne : ' + txt.replace(/\n/g, ' · '); }
    if (navigator.share) {
      navigator.share({ text: txt }).then(function () { fb.textContent = '✓ Partagé !'; }, function () {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, function () { legacyCopy(txt) ? ok() : ko(); });
        else legacyCopy(txt) ? ok() : ko();
      });
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(ok, function () { legacyCopy(txt) ? ok() : ko(); });
    } else { legacyCopy(txt) ? ok() : ko(); }
  });

  // ── Saisie + suggestions (nom, club ou pays) ──
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
    el['tab-jour'].setAttribute('aria-selected', m === 'jour');
    el['tab-marathon'].setAttribute('aria-selected', m === 'marathon');
    el['marathon-bar'].style.display = m === 'marathon' ? 'flex' : 'none';
    el.stats.style.display = m === 'jour' ? 'flex' : 'none';
    el.podium.hidden = m !== 'marathon';
    el['round-banner'].hidden = true;
    el.notice.textContent = '';
    el['copy-feedback'].textContent = '';

    if (m === 'marathon') {
      if (!run) newRun();
      marathonOver = false;
      renderMarathonBar();
      renderPodium();
    }
    if (isDone()) { showEnd(); } else { hideEnd(); }
    renderBoard();
    renderStartHint();
    renderHint();
  }
  el['tab-jour'].addEventListener('click', function () { setMode('jour'); });
  el['tab-marathon'].addEventListener('click', function () { setMode('marathon'); });

  // ── Boutons marathon ──
  el['btn-again'].addEventListener('click', function () {
    // endMarathon a déjà préparé la série suivante
    marathonOver = false;
    endedRun = null;
    renderMarathonBar();
    hideEnd();
    renderBoard();
    renderStartHint();
    renderHint();
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

  // ── Démarrage : rendu synchrone, sans dépendre d'aucune animation ──
  setMode('jour');
  renderStatsJour();

  // ── PWA : enregistrement silencieux du service worker ──
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () { /* hors ligne indisponible, le jeu marche quand même */ });
  }
})();
