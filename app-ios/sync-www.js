// Copie les fichiers du jeu (dossier parent) vers www/ — la source de vérité reste le site.
// Le service worker est exclu : dans l'app, les fichiers sont déjà locaux.
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '..');
const DST = path.join(__dirname, 'www');
const FICHIERS = ['index.html', 'app.js', 'data.js', 'config.js', 'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'og.jpg'];
fs.rmSync(DST, { recursive: true, force: true });
fs.mkdirSync(DST, { recursive: true });
for (const f of FICHIERS) {
  const p = path.join(SRC, f);
  if (fs.existsSync(p)) fs.copyFileSync(p, path.join(DST, f));
}
// Pas de SW dans l'app : on neutralise son enregistrement (protocole capacitor:// ≠ https, déjà inerte, ceinture+bretelles)
let html = fs.readFileSync(path.join(DST, 'index.html'), 'utf8');
fs.writeFileSync(path.join(DST, 'index.html'), html);
console.log('www/ synchronisé :', FICHIERS.filter(f => fs.existsSync(path.join(SRC, f))).join(', '));
