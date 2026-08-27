# ⚽ Le Joueur Mystère

**Le Wordle du foot, en français.** Un footballeur caché chaque jour — le même pour tout le monde — et 6 essais pour le trouver. Chaque essai compare **nation, championnat, club, poste et âge** avec le joueur mystère. Et quand le mystère du jour est tombé : le **mode Marathon**, des mystères en boucle, 90 secondes par joueur.

**👉 Jouer : [iliaschatt1993-code.github.io/joueur-mystere](https://iliaschatt1993-code.github.io/joueur-mystere/)**

## Fonctionnalités

- 🟩 🟨 ⬜ Indices croisés façon Wordle (🟨 = même confédération, même championnat, même ligne de jeu, ou âge à 2 ans près)
- 🎽 **Visuel** : badge monogramme aux couleurs de chaque club, maillot du club à la révélation (l'âge en numéro), confettis de victoire
- ⏱ **Chrono partout** : chronomètre au jour et en duel, **compte à rebours de 90 s par joueur** au marathon — fini la réflexion infinie (et la triche sur Google)
- 🔎 **Anti-triche** : la recherche ne répond qu'aux noms de joueurs — taper un club ou un pays ne liste plus les candidats possibles
- ☀️ **Le jour** : un mystère quotidien, identique pour tous, avec statistiques et série de victoires
- 🏆 **Marathon du jour** : la même séquence pour tout le monde, une tentative classée par jour — puis entraînement libre à volonté
- ⚔️ **Duel** : un lien-défi **affiché en clair** (copier / WhatsApp / partage natif), même joueur pour les deux ; à égalité d'essais, le plus rapide gagne
- 🌍 **Classement mondial du jour** et % de réussite (optionnels — s'activent quand un backend Supabase est configuré dans `config.js`)
- 🧭 La ligne du joueur est donnée dès le départ, ses initiales après 4 essais manqués
- 🏳️ Drapeaux : émojis, avec repli automatique en écusson texte sur les plateformes qui ne les affichent pas (Windows/Opera)
- 📲 Installable (PWA), jouable hors ligne — sans backend configuré, rien ne quitte ton navigateur

## Données

**~4 700 joueurs devinables** (effectifs complets 2026-27 de 8 ligues via [football-data.org](https://www.football-data.org/) : Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Eredivisie, Liga Portugal, Brasileirão), dont **256 « stars » qui servent de vivier aux mystères** — on ne te demandera jamais de deviner le 3ᵉ gardien de l'Excelsior, mais tu peux le proposer.

`data.js` est généré par `build_data.py` (clé API dans le `.env` racine, cache dans `build-cache/`) :

```bash
python3 build_data.py            # télécharge + régénère
python3 build_data.py --offline  # régénère depuis le cache
```

## Tech

Zéro dépendance côté jeu, zéro tracking : HTML/CSS/JS vanilla, un `data.js` généré, un service worker. Le mystère du jour est déterministe (hachage FNV de la date), donc identique pour tout le monde sans serveur.

---

*Fait avec [Claude Code](https://claude.com/claude-code).*
