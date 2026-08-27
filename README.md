# ⚽ Le Joueur Mystère

**Le Wordle du foot, en français.** Un footballeur caché chaque jour — le même pour tout le monde — et 6 essais pour le trouver. Chaque essai compare **nation, championnat, club, poste et âge** avec le joueur mystère. Et quand le mystère du jour est tombé : le **mode Marathon**, des mystères en boucle jusqu'au premier raté.

**👉 Jouer : [iliaschatt1993-code.github.io/joueur-mystere](https://iliaschatt1993-code.github.io/joueur-mystere/)**

## Fonctionnalités

- 🟩 🟨 ⬜ Indices croisés façon Wordle (🟨 = même confédération, même championnat, même ligne de jeu, ou âge à 2 ans près)
- ⚽ **Postes fins** : gardien, défenseur central, latéraux, milieu défensif/central/offensif, ailiers, avant-centre
- ☀️ **Le jour** : un mystère quotidien, identique pour tous, avec statistiques et série de victoires
- 🏆 **Marathon du jour** : la même séquence de mystères pour tout le monde, une tentative classée par jour — puis entraînement libre à volonté
- ⚔️ **Duel** : un lien-défi à envoyer à un pote, même joueur pour les deux, verdict comparé
- 🌍 **Classement mondial du jour** et % de réussite (optionnels — s'activent quand un backend Supabase est configuré dans `config.js`)
- 🧭 La ligne du joueur est donnée dès le départ, ses initiales après 4 essais manqués
- 📲 Installable (PWA), jouable hors ligne — sans backend configuré, rien ne quitte ton navigateur
- 📤 Partage du résultat en grille d'emojis, sans spoiler

## Données

~256 joueurs très connus (Big 5 européen, Pro League 🇧🇪, Saudi Pro League, MLS…), effectifs **saison 2026-27** (mercato d'été 2026 inclus, mis à jour le 27/08/2026). La base vit dans [`data.js`](data.js) entre les marqueurs `/*JM-DATA*/` — les corrections sont bienvenues via issue ou PR.

## Tech

Zéro dépendance, zéro backend, zéro tracking : HTML/CSS/JS vanilla, un `data.js`, un service worker. Le mystère du jour est déterministe (hachage FNV de la date), donc identique pour tout le monde sans serveur.

---

*Fait avec [Claude Code](https://claude.com/claude-code).*
