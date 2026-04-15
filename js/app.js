document.addEventListener("DOMContentLoaded", () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(err => {
      console.warn("Service Worker no registrado:", err);
    });
  }

  loadState();

  const validViews = ["home", "manage", "fixtures", "standings"];
  if (!validViews.includes(window.appState.currentView)) {
    window.appState.currentView = "home";
  }

  calculateStandings();
  renderAll();
});

function goBack() {
  renderHome();
  setView("home");
  saveState();
}

function homeJornadaPrev() {
  if (window._homeJornadaIdx > 0) {
    window._homeJornadaIdx--;
    renderHome();
  }
}

function homeJornadaNext() {
  if (window._homeJornadaIdx < window.appState.matchDays.length - 1) {
    window._homeJornadaIdx++;
    renderHome();
  }
}

function scrollToJornada() {
  const el = document.getElementById("jornada-section");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setMaxTeams(n) {
  window.appState.maxTeams = n;
  window.appState.teams = [];
  window.appState.matchDays = [];
  window.appState.standings = [];
  saveState();
  renderAll();
  // Poner foco en el input una vez renderizado
  setTimeout(() => {
    const el = document.getElementById("team-name-input");
    if (el) el.focus();
  }, 50);
}

function resetMaxTeams() {
  if (window.appState.matchDays.length > 0) {
    if (!confirm("⚠️ Atención\n\nSi pulsas Aceptar se eliminarán todos los equipos y el calendario generado.\n\n¿Deseas continuar?")) return;
  }
  window.appState.maxTeams = 0;
  window.appState.teams = [];
  window.appState.matchDays = [];
  window.appState.standings = [];
  saveState();
  renderAll();
}

function addTeam() {
  const input = document.getElementById("team-name-input");
  const name = input.value.trim();

  // Validar que tenga al menos una letra
  if (!/[a-zA-ZÀ-ÿ]/.test(name)) {
    alert("El nombre debe contener al menos una letra");
    return;
  }

  if (window.appState.teams.length >= window.appState.maxTeams) {
    alert(`Ya tienes los ${window.appState.maxTeams} equipos`);
    return;
  }

  const exists = window.appState.teams.some(
    team => team.name.toLowerCase() === name.toLowerCase()
  );

  if (exists) {
    alert("Ese equipo ya existe");
    return;
  }

  window.appState.teams.push({
    id: crypto.randomUUID(),
    name
  });

  input.value = "";
  calculateStandings();
  saveState();
  renderAll();

  // Foco al input si aún quedan equipos por añadir
  if (window.appState.teams.length < window.appState.maxTeams) {
    setTimeout(() => {
      const el = document.getElementById("team-name-input");
      if (el) el.focus();
    }, 50);
  }
}

function deleteTeam(teamId) {
  const team = window.appState.teams.find(t => t.id === teamId);
  const name = team ? team.name : "este equipo";
  if (!confirm(`⚠️ Atención\n\nSi pulsas Aceptar se eliminará el equipo "${name}" y se borrará el calendario generado.\n\n¿Deseas continuar?`)) return;
  window.appState.teams = window.appState.teams.filter(team => team.id !== teamId);
  window.appState.matchDays = [];
  calculateStandings();
  saveState();
  renderAll();
}

function startRenameTeam(teamId) {
  // Ocultar cualquier fila de renombrado abierta
  document.querySelectorAll(".rename-row").forEach(el => el.classList.add("hidden"));
  const row = document.getElementById("rename-row-" + teamId);
  const team = window.appState.teams.find(t => t.id === teamId);
  if (!row || !team) return;
  row.classList.remove("hidden");
  const input = document.getElementById("rename-input-" + teamId);
  input.value = team.name;
  input.focus();
  input.select();
}

function cancelRename(teamId) {
  const row = document.getElementById("rename-row-" + teamId);
  if (row) row.classList.add("hidden");
}

function renameTeam(teamId) {
  const input = document.getElementById("rename-input-" + teamId);
  const newName = input.value.trim();

  if (!/[a-zA-ZÀ-ÿ]/.test(newName)) {
    alert("El nombre debe contener al menos una letra");
    input.focus();
    return;
  }

  const duplicate = window.appState.teams.some(
    t => t.id !== teamId && t.name.toLowerCase() === newName.toLowerCase()
  );
  if (duplicate) {
    alert("Ya existe un equipo con ese nombre");
    input.focus();
    return;
  }

  const team = window.appState.teams.find(t => t.id === teamId);
  if (!team) return;

  const oldName = team.name;
  team.name = newName;

  // Actualizar nombre en jornadas ya generadas
  window.appState.matchDays.forEach(day => {
    day.matches.forEach(match => {
      if (match.homeTeamId === teamId) match.homeTeamName = newName;
      if (match.awayTeamId === teamId) match.awayTeamName = newName;
    });
  });

  calculateStandings();
  saveState();
  renderAll();
}

function createSchedule() {
  const { teams, maxTeams } = window.appState;
  if (teams.length < maxTeams) {
    alert(`⚠️ Faltan equipos por añadir (${teams.length}/${maxTeams}).

Añade todos los equipos antes de generar el calendario.`);
    return;
  }
  if (teams.length < 2) {
    alert("⚠️ Necesitas al menos 2 equipos para generar el calendario.");
    return;
  }

  window.appState.matchDays = generateFixtures(window.appState.teams);
  if (!window.appState.matchDays || window.appState.matchDays.length === 0) {
    alert("\u26a0\ufe0f No se pudo generar el calendario. Verifica que los equipos est\u00e9n correctamente a\u00f1adidos.");
    return;
  }
  window.appState.currentView = "fixtures";
  calculateStandings();
  saveState();
  renderAll();

  const totalJornadas = window.appState.matchDays.length;
  alert(`\u2705 \u00a1Calendario generado correctamente!\n\n${totalJornadas} jornadas creadas para ${teams.length} equipos.\n\nYa puedes ver los enfrentamientos en el Calendario.`);
}

function resetSchedule() {
  if (!confirm("⚠️ Atención\n\nSi pulsas Aceptar se eliminarán todas las jornadas y los resultados registrados.\n\n¿Deseas continuar?")) return;

  window.appState.matchDays = [];
  window._homeJornadaIdx = 0;
  calculateStandings();
  saveState();
  renderAll();
}

function saveMatchDate(dayNumber, matchId, value) {
  const day = window.appState.matchDays.find(d => d.day === dayNumber);
  if (!day) return;
  const match = day.matches.find(m => m.id === matchId);
  if (match) {
    match.date = value;
    saveState();
    renderHome();
  }
}

function saveMatchTime(dayNumber, matchId, value) {
  const day = window.appState.matchDays.find(d => d.day === dayNumber);
  if (!day) return;
  const match = day.matches.find(m => m.id === matchId);
  if (match) {
    match.time = value;
    saveState();
    renderHome();
  }
}

function saveMatchResult(dayNumber, matchId) {
  const homeInput = document.getElementById(`home-${dayNumber}-${matchId}`);
  const awayInput = document.getElementById(`away-${dayNumber}-${matchId}`);

  const homeGoals = homeInput.value;
  const awayGoals = awayInput.value;

  if (homeGoals === "" || awayGoals === "") {
    alert("⚠️ Introduce el resultado de ambos equipos antes de marcar el partido como finalizado.");
    return;
  }

  window.appState.matchDays.forEach(day => {
    if (day.day !== dayNumber) return;
    day.matches.forEach(match => {
      if (match.id !== matchId) return;
      match.homeGoals = homeGoals;
      match.awayGoals = awayGoals;
      match.played = true;
    });
  });

  // Auto-avanzar jornada si todos los partidos están jugados
  const currentDay = window.appState.matchDays.find(d => d.day === dayNumber);
  if (currentDay && currentDay.matches.every(m => m.played)) {
    const nextIdx = window.appState.matchDays.findIndex(d => d.day === dayNumber) + 1;
    if (nextIdx < window.appState.matchDays.length) {
      window._homeJornadaIdx = nextIdx;
    }
  }

  calculateStandings();
  saveState();
  renderAll();
}

function clearMatchResult(dayNumber, matchId) {
  window.appState.matchDays.forEach(day => {
    if (day.day !== dayNumber) return;
    day.matches.forEach(match => {
      if (match.id !== matchId) return;
      match.homeGoals = "";
      match.awayGoals = "";
      match.played = false;
    });
  });
  calculateStandings();
  saveState();
  renderAll();
}

function saveTournamentName() {
  const input = document.getElementById("tournament-name-input");
  const value = input.value.trim();

  if (!value) {
    alert("Introduce un nombre válido");
    return;
  }

  window.appState.tournamentName = value;
  saveState();
  renderAll();
}

function resetAllData() {
  if (!confirm("⚠️ Atención\n\nSi pulsas Aceptar se eliminarán TODOS los datos del torneo: equipos, jornadas, resultados y clasificación.\n\nEsta acción no se puede deshacer.\n\n¿Deseas continuar?")) return;

  clearState();

  window.appState = {
    currentView: "manage",
    tournamentName: "Liga Fútbol CEIP El Vetón",
    maxTeams: 0,
    teams: [],
    matchDays: [],
    standings: []
  };

  // Limpiar estado de navegación interna
  window._homeJornadaIdx = 0;

  saveState();
  renderAll();
}