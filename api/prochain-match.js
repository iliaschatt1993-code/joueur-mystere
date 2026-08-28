// Prochain match du club préféré — proxy football-data.org.
// La clé API reste côté serveur (env FOOTBALL_DATA_API_KEY) ; le cache edge (6 h)
// protège le quota gratuit (10 req/min) : une requête amont par club et par 6 h.
const clubs = require('./_clubs.json');

module.exports = async function (req, res) {
  const club = String(req.query.club || '').slice(0, 40);
  const id = clubs[club];
  // Données publiques : l'app iOS (origine capacitor://) et les miroirs doivent pouvoir lire
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
  if (!id) { res.status(404).json({ erreur: 'club inconnu' }); return; }
  try {
    const r = await fetch('https://api.football-data.org/v4/teams/' + id + '/matches?status=SCHEDULED&limit=1', {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY }
    });
    if (!r.ok) { res.status(502).json({ erreur: 'api ' + r.status }); return; }
    const d = await r.json();
    const m = (d.matches || [])[0];
    if (!m) { res.status(200).json(null); return; }
    res.status(200).json({
      date: m.utcDate,
      domicile: (m.homeTeam && (m.homeTeam.shortName || m.homeTeam.name)) || '?',
      exterieur: (m.awayTeam && (m.awayTeam.shortName || m.awayTeam.name)) || '?',
      competition: (m.competition && m.competition.name) || ''
    });
  } catch (e) {
    res.status(502).json({ erreur: 'reseau' });
  }
};
