function generateFixtures(teams) {
  if (!teams || teams.length < 2) return [];

  // Si hay número impar, añadimos un equipo fantasma (bye = descanso)
  let list = teams.slice();
  const hasBye = list.length % 2 !== 0;
  if (hasBye) {
    list.push({ id: "__bye__", name: "Descanso" });
  }

  const n = list.length;
  const days = [];
  let matchId = 1;

  // Round-robin: fija pos[0], rota el resto
  const pos = list.map((_, i) => i);

  for (let round = 0; round < n - 1; round++) {
    const dayMatches = [];

    for (let i = 0; i < n / 2; i++) {
      const home = list[pos[i]];
      const away = list[pos[n - 1 - i]];

      // Saltar partidos con el equipo fantasma (descanso)
      if (home.id === "__bye__" || away.id === "__bye__") continue;

      const isSwapped = round % 2 === 1 && i === 0;
      dayMatches.push({
        id: matchId++,
        homeTeamId: isSwapped ? away.id : home.id,
        homeTeamName: isSwapped ? away.name : home.name,
        awayTeamId: isSwapped ? home.id : away.id,
        awayTeamName: isSwapped ? home.name : away.name,
        homeGoals: "",
        awayGoals: "",
        played: false
      });
    }

    if (dayMatches.length > 0) {
      days.push({ day: round + 1, matches: dayMatches });
    }

    // Rotar posiciones 1..n-1
    const last = pos[n - 1];
    for (let i = n - 1; i > 1; i--) {
      pos[i] = pos[i - 1];
    }
    pos[1] = last;
  }

  return days;
}