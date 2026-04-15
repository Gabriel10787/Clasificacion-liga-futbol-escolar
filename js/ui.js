function escapeHTML(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function setView(viewName) {
  window.appState.currentView = viewName;

  document.querySelectorAll(".view").forEach(view => {
    view.classList.remove("active");
  });

  const activeView = document.getElementById(`view-${viewName}`);
  if (activeView) activeView.classList.add("active");

  const titles = {
    home: "Liga de Fútbol Escolar CEIP El Vetón",
    manage: "",
    fixtures: "Calendario",
    standings: "Clasificación"
  };

  document.getElementById("page-title").textContent = titles[viewName] || "Liga de Fútbol Escolar CEIP El Vetón";
  document.getElementById("tournament-name").textContent = viewName === "home" ? "" : escapeHTML(window.appState.tournamentName);

  const btnBack = document.getElementById("btn-back");
  btnBack.classList.toggle("hidden", viewName === "home");

  const btnSettings = document.getElementById("btn-settings");
  btnSettings.classList.toggle("hidden", viewName === "manage");
}

function renderAll() {
  renderHome();
  renderManage();
  renderFixtures();
  renderStandings();
  setView(window.appState.currentView);
}

function renderHome() {
  const { matchDays, standings, teams, maxTeams } = window.appState;

  // ── Jornada activa: primera que tenga partidos pendientes; si todas jugadas → última ──
  const activeJornadaIdx = (() => {
    if (matchDays.length === 0) return 0;
    if (window._homeJornadaIdx !== undefined && window._homeJornadaIdx >= 0 && window._homeJornadaIdx < matchDays.length) {
      return window._homeJornadaIdx;
    }
    const first = matchDays.findIndex(d => d.matches.some(m => !m.played));
    return first === -1 ? matchDays.length - 1 : first;
  })();
  window._homeJornadaIdx = matchDays.length > 0 ? activeJornadaIdx : 0;

  // ── Bloque jornada ──────────────────────────────────────────────────────────
  let jornadaHtml = "";
  if (matchDays.length === 0) {
    jornadaHtml = `<p class="small-text center-text">Genera el calendario desde Ajustes ⚙ para ver las jornadas.</p>`;
  } else {
    const idx = activeJornadaIdx;
    const day = matchDays[idx];
    const allPlayed = day.matches.every(m => m.played);
    jornadaHtml = `
      <div class="jornada-nav">
        <button class="btn-jornada-nav" onclick="homeJornadaPrev()" ${idx === 0 ? "disabled" : ""}>&#8249;</button>
        <div class="jornada-nav-center">
          <span class="jornada-nav-title">Jornada ${day.day}</span>
          ${allPlayed ? `<span class="jornada-badge-done">Completada ✓</span>` : ""}
        </div>
        <button class="btn-jornada-nav" onclick="homeJornadaNext()" ${idx === matchDays.length - 1 ? "disabled" : ""}>&#8250;</button>
      </div>
      ${(day.date || day.time) ? `` : ""}
      <div class="jornada-matches-list">
        ${day.matches.map(match => `
          <div class="home-match-row ${match.played ? "match-played" : "match-pending"}">
            ${(match.date || match.time) ? `
              <div class="home-match-dt">
                ${match.date ? `<span>&#128197; ${formatDate(match.date)}</span>` : ""}
                ${match.time ? `<span>&#9200; ${match.time}</span>` : ""}
              </div>
            ` : ""}
            <span class="home-team home-team-left">${escapeHTML(match.homeTeamName)}</span>
            <div class="home-result-col">
              ${match.played
                ? `<span class="home-score">${match.homeGoals} &ndash; ${match.awayGoals}</span>`
                : `<div class="home-inputs">
                     <input id="home-${day.day}-${match.id}" class="input input-goals" type="number" min="0" placeholder="0" />
                     <span class="score-sep">-</span>
                     <input id="away-${day.day}-${match.id}" class="input input-goals" type="number" min="0" placeholder="0" />
                   </div>`
              }
            </div>
            <span class="home-team home-team-right">${escapeHTML(match.awayTeamName)}</span>
            <div class="home-match-action">
              ${match.played
                ? `<button class="btn-editar" onclick="clearMatchResult(${day.day}, ${match.id})">&#9998; Editar resultado</button>`
                : `<button class="btn-finalizar" onclick="saveMatchResult(${day.day}, ${match.id})">&#9989; Partido finalizado</button>`
              }
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  const standingsHtml = "";

  document.getElementById("view-home").innerHTML = `
    <div class="home-nav-bar">
      <button class="home-nav-btn" onclick="renderFixtures(); setView('fixtures'); saveState();">
        <span class="home-nav-icon">&#128197;</span>
        <span class="home-nav-label">Calendario</span>
      </button>
      <button class="home-nav-btn home-nav-btn-center" onclick="scrollToJornada()">
        <span class="home-nav-icon">&#9971;</span>
        <span class="home-nav-label">Jornada</span>
      </button>
      <button class="home-nav-btn" onclick="renderStandings(); setView('standings'); saveState();">
        <span class="home-nav-icon">&#127942;</span>
        <span class="home-nav-label">Clasificación</span>
      </button>
    </div>

    <div class="card home-jornada-card" id="jornada-section">
      ${jornadaHtml}
    </div>

    ${standingsHtml}
  `;
}

function renderManage() {
  const { maxTeams, teams, matchDays } = window.appState;
  const teamsNeeded = maxTeams - teams.length;
  const allTeamsAdded = maxTeams > 0 && teams.length >= maxTeams;

  // ── Bloque selector número de equipos ──────────────────────────────────────
  let teamCountHtml = "";
  if (maxTeams === 0) {
    teamCountHtml = `
      <div class="card team-count-card">
        <h2>¿Cuántos equipos participan?</h2>
        <p class="small-text">Elige el número de equipos del torneo antes de añadirlos.</p>
        <div class="count-picker">
          ${[4,5,6,7,8,9,10,12].map(n => `
            <button class="btn-count" onclick="setMaxTeams(${n})">${n}</button>
          `).join("")}
        </div>
      </div>
    `;
  } else {
    // Barra de progreso de equipos añadidos
    const pct = Math.round((teams.length / maxTeams) * 100);
    const teamsHtml = teams.map((team, idx) => `
      <div class="item" id="team-item-${team.id}">
        <div class="item-header">
          <strong class="team-display-name">${escapeHTML(team.name)}</strong>
          <div class="item-actions">
            <button class="btn-secondary btn-sm" onclick="startRenameTeam('${team.id}')">✏ Renombrar</button>
            ${matchDays.length === 0
              ? `<button class="btn-danger btn-sm" onclick="deleteTeam('${team.id}')">Eliminar</button>`
              : ""}
          </div>
        </div>
        <div class="rename-row hidden" id="rename-row-${team.id}">
          <input class="input input-rename" type="text" maxlength="30"
            placeholder="Nuevo nombre" id="rename-input-${team.id}"
            onkeydown="if(event.key==='Enter') renameTeam('${team.id}'); if(event.key==='Escape') cancelRename('${team.id}');" />
          <button class="btn-primary btn-sm" onclick="renameTeam('${team.id}')">Guardar</button>
          <button class="btn-sm btn-cancel" onclick="cancelRename('${team.id}')">✕</button>
        </div>
      </div>
    `).join("");

    teamCountHtml = `
      <div class="card">
        <div class="card-title-row">
          <h2>Equipos</h2>
          <span class="badge badge-count">${teams.length}/${maxTeams}</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width:${pct}%"></div>
        </div>
        ${!allTeamsAdded ? `
          <div class="row mt-12">
            <input id="team-name-input" class="input" type="text"
              placeholder="Nombre del equipo ${teams.length + 1}" maxlength="30"
              onkeydown="if(event.key==='Enter') addTeam()" />
            <button class="btn-primary" onclick="addTeam()">Añadir</button>
          </div>
          <p class="small-text mt-8">Faltan <strong>${teamsNeeded}</strong> equipo${teamsNeeded !== 1 ? "s" : ""} por añadir.</p>
        ` : `
          <p class="small-text mt-8 text-success">&#10003; Todos los equipos añadidos.</p>
        `}
        <div class="list mt-12">
          ${teamsHtml || '<p class="small-text">No hay equipos todavía.</p>'}
        </div>
        ${matchDays.length === 0 ? `
          <button class="btn-link-danger" onclick="resetMaxTeams()">Cambiar número de equipos</button>
        ` : ""}
      </div>
    `;
  }

  // ── Bloque calendario ───────────────────────────────────────────────────────
  let calendarHtml = "";
  if (maxTeams > 0) {
    const canGenerate = allTeamsAdded && matchDays.length === 0;
    const totalRounds = teams.length % 2 === 0 ? teams.length - 1 : teams.length;
    calendarHtml = `
      <div class="card">
        <h2>Calendario</h2>
        <div class="row">
          <button class="btn-primary" onclick="createSchedule()" ${!canGenerate ? "disabled" : ""}>
            ${matchDays.length > 0 ? "&#10003; Calendario generado" : "Generar jornadas"}
          </button>
          <button class="btn-danger" onclick="resetSchedule()" ${matchDays.length === 0 ? "disabled" : ""}>
            Borrar jornadas
          </button>
        </div>
        ${!allTeamsAdded
          ? `<p class="small-text mt-12">Añade todos los equipos para generar el calendario.</p>`
          : matchDays.length > 0
            ? `<p class="small-text mt-12">&#10003; ${matchDays.length} jornadas generadas (${totalRounds} rondas liga).</p>`
            : `<p class="small-text mt-12">Pulsa "Generar jornadas" para crear el calendario.</p>`
        }
      </div>
    `;
  }

  document.getElementById("view-manage").innerHTML = `
    ${teamCountHtml}

    ${calendarHtml}

    <div class="card settings-section">
      <h2>Ajustes</h2>
      <button class="btn-danger btn-block" onclick="resetAllData()">&#128465; Borrar todos los datos</button>
    </div>
  `;
}

function renderFixtures() {
  let content = "";

  if (window.appState.matchDays.length === 0) {
    content = `
      <div class="card">
        <p class="small-text center">No hay jornadas generadas. Ve a <strong>Ajustes</strong> ⚙️ para crear el calendario.</p>
      </div>
    `;
  } else {
    window.appState.matchDays.forEach(day => {
      content += `
        <div class="card fixture-card">
          <div class="fixture-card-header">
            <h3 class="fixture-jornada-title">Jornada ${day.day}</h3>
          </div>
          <div class="list">
            ${day.matches.map(match => {
              const dateVal = match.date || "";
              const timeVal = match.time || "";
              return `
              <div class="item fixture-item">
                <div class="fixture-match-datetime no-print">
                  <label class="fixture-dt-label">
                    &#128197;
                    <input class="input fixture-date-input" type="date" value="${dateVal}"
                      onchange="saveMatchDate(${day.day}, ${match.id}, this.value)" />
                  </label>
                  <label class="fixture-dt-label">
                    &#9200;
                    <input class="input fixture-time-input" type="time" value="${timeVal}"
                      onchange="saveMatchTime(${day.day}, ${match.id}, this.value)" />
                  </label>
                  <div class="fixture-teams">
                    <span class="fixture-team-name">${escapeHTML(match.homeTeamName)}</span>
                    <span class="fixture-score">
                      ${match.played
                        ? `<strong>${match.homeGoals} - ${match.awayGoals}</strong>`
                        : `<span class="fixture-score-blank">__ - __</span>`
                      }
                    </span>
                    <span class="fixture-team-name">${escapeHTML(match.awayTeamName)}</span>
                  </div>
                </div>
                <div class="fixture-match-row-print">
                  <div class="fixture-match-datetime-print">
                    <span>${dateVal ? formatDate(dateVal) : "___/___/______"}</span>
                    <span>${timeVal || "__:__"}</span>
                  </div>
                  <div class="fixture-teams">
                    <span class="fixture-team-name">${escapeHTML(match.homeTeamName)}</span>
                    <span class="fixture-score">
                      ${match.played
                        ? `<strong>${match.homeGoals} - ${match.awayGoals}</strong>`
                        : `<span class="fixture-score-blank">__ - __</span>`
                      }
                    </span>
                    <span class="fixture-team-name">${escapeHTML(match.awayTeamName)}</span>
                  </div>
                </div>
              </div>
            `}).join("")}
          </div>
        </div>
      `;
    });
  }

  const printHeader = `
    <div class="print-calendar-header">
      <img src="assets/logo.png" alt="Logo Liga" />
      <div class="print-calendar-header-text">
        <h2>Calendario de Partidos</h2>
        <p>${escapeHTML(window.appState.tournamentName)}</p>
      </div>
    </div>
  `;

  const printBtn = window.appState.matchDays.length > 0 ? `
    <div class="print-btn-wrap no-print">
      <button class="btn-primary btn-print" onclick="window.print()">
        &#128438; Imprimir calendario
      </button>
    </div>
  ` : "";

  document.getElementById("view-fixtures").innerHTML = printBtn + printHeader + content;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function renderStandings() {
  const rows = window.appState.standings.map(row => `
    <tr>
      <td>${row.position}</td>
      <td class="td-team">${escapeHTML(row.teamName)}</td>
      <td class="td-pts">${row.points}</td>
      <td>${row.played}</td>
      <td>${row.won}</td>
      <td>${row.drawn}</td>
      <td>${row.lost}</td>
      <td>${row.goalsFor}</td>
      <td>${row.goalsAgainst}</td>
      <td>${row.goalDiff}</td>
    </tr>
  `).join("");

  document.getElementById("view-standings").innerHTML = `
    <div class="no-print center mt-12" style="margin-bottom:10px;">
      <button class="btn-primary btn-print" onclick="window.print()">&#128424; Imprimir clasificación</button>
    </div>
    <div class="card">
      <div class="standings-header">
        <img src="assets/logo.png" alt="Logo Liga" />
        <div class="standings-title">
          <h2>Clasificación</h2>
          <p>${escapeHTML(window.appState.tournamentName)}</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Equipo</th>
              <th class="th-pts">Pts</th>
              <th>PJ</th>
              <th>G</th>
              <th>E</th>
              <th>P</th>
              <th>GF</th>
              <th>GC</th>
              <th>DG</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="10" class="center small-text">Sin datos todavía</td></tr>`}
          </tbody>
        </table>
      </div>
      <p class="small-text mt-12">Desempate: puntos &rarr; enfrentamiento directo &rarr; dif. goles &rarr; goles a favor.</p>
    </div>
  `;
}