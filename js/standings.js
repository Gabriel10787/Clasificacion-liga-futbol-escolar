function calculateStandings() {
  const teams = window.appState.teams;
  const matchDays = window.appState.matchDays;

  const table = teams.map(team => ({
    teamId: team.id,
    teamName: team.name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0
  }));

  const playedMatches = matchDays.flatMap(day => day.matches).filter(match => match.played);

  playedMatches.forEach(match => {
    const home = table.find(row => row.teamId === match.homeTeamId);
    const away = table.find(row => row.teamId === match.awayTeamId);

    const hg = Number(match.homeGoals);
    const ag = Number(match.awayGoals);

    home.played++;
    away.played++;

    home.goalsFor += hg;
    home.goalsAgainst += ag;
    away.goalsFor += ag;
    away.goalsAgainst += hg;

    home.goalDiff = home.goalsFor - home.goalsAgainst;
    away.goalDiff = away.goalsFor - away.goalsAgainst;

    if (hg > ag) {
      home.won++;
      away.lost++;
      home.points += 3;
    } else if (hg < ag) {
      away.won++;
      home.lost++;
      away.points += 3;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  });

  table.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;

    const head = getHeadToHead(a.teamId, b.teamId, playedMatches);
    if (head !== 0) return head;

    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

    return a.teamName.localeCompare(b.teamName);
  });

  window.appState.standings = table.map((row, index) => ({
    position: index + 1,
    ...row
  }));
}

function getHeadToHead(teamAId, teamBId, matches) {
  const match = matches.find(m =>
    (m.homeTeamId === teamAId && m.awayTeamId === teamBId) ||
    (m.homeTeamId === teamBId && m.awayTeamId === teamAId)
  );

  if (!match) return 0;

  let aGoals;
  let bGoals;

  if (match.homeTeamId === teamAId) {
    aGoals = Number(match.homeGoals);
    bGoals = Number(match.awayGoals);
  } else {
    aGoals = Number(match.awayGoals);
    bGoals = Number(match.homeGoals);
  }

  if (aGoals > bGoals) return -1;
  if (aGoals < bGoals) return 1;
  return 0;
}