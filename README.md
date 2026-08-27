# ⚽ Le Joueur Mystère

**Le Wordle du foot, en français.** Un footballeur caché chaque jour — le même pour tout le monde — et 6 essais pour le trouver. Chaque essai compare **nation, championnat, club, poste et âge** avec le joueur mystère. Et quand le mystère du jour est tombé : le **mode Marathon**, des mystères en boucle jusqu'au premier raté.

**👉 Jouer : [iliaschatt1993-code.github.io/joueur-mystere](https://iliaschatt1993-code.github.io/joueur-mystere/)**

## Fonctionnalités

- 🟩 🟨 ⬜ Indices croisés façon Wordle (🟨 = même confédération, même championnat, ou âge à 2 ans près)
- ☀️ **Le jour** : un mystère quotidien, identique pour tous, avec statistiques et série de victoires
- 🔁 **Marathon** : enchaîne les mystères, ta série grimpe jusqu'au premier raté — podium local des meilleures séries
- 🧭 Le poste du joueur est donné dès le départ, ses initiales après 4 essais manqués
- 📲 Installable (PWA), jouable hors ligne, aucune donnée collectée — tout reste dans ton navigateur
- 📤 Partage du résultat en grille d'emojis, sans spoiler

## Données

~256 joueurs très connus (Big 5 européen, Pro League 🇧🇪, Saudi Pro League, MLS…), effectifs **saison 2026-27** (mercato d'été 2026 inclus, mis à jour le 27/08/2026). La base vit dans [`data.js`](data.js) entre les marqueurs `/*JM-DATA*/` — les corrections sont bienvenues via issue ou PR.

## Tech

Zéro dépendance, zéro backend, zéro tracking : HTML/CSS/JS vanilla, un `data.js`, un service worker. Le mystère du jour est déterministe (hachage FNV de la date), donc identique pour tout le monde sans serveur.

---

*Fait avec [Claude Code](https://claude.com/claude-code).*
