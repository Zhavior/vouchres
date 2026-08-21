fetch("http://localhost:3000/api/nfl/touchdown-slate")
  .then(res => res.json())
  .then(data => {
    console.log("Total players:", data.totalPlayers);
    const teams = {};
    for (const p of data.players || []) {
      teams[p.team] = (teams[p.team] || 0) + 1;
    }
    console.log(teams);
  })
  .catch(console.error);
