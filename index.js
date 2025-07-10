// --- Data ---
let games = JSON.parse(localStorage.getItem("gameList") || "[]");
let completedGames = JSON.parse(localStorage.getItem("completedGames") || "[]");
let lastPickedIndex = -1;

// --- Save/Load ---
function saveGames() {
  localStorage.setItem("gameList", JSON.stringify(games));
}
function saveCompletedGames() {
  localStorage.setItem("completedGames", JSON.stringify(completedGames));
}

// --- Render Active Games ---
function renderGames() {
  const list = document.getElementById("gameList");
  list.innerHTML = "";

  games.forEach((game, index) => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    let html = `
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-start gap-2">
        <div class="flex-fill" id="gameDisplay-${index}">
          <strong>${game.title}</strong> (${game.platform}) — <em>${game.mode}</em><br />
          <small>Time played: ${game.time} hrs</small>
        </div>
        <div class="btn-group mt-2 mt-md-0">
          <button class="btn btn-sm btn-outline-secondary" title="Edit" onclick="editGame(${index})">✏️</button>
          <button class="btn btn-sm btn-success" title="Mark as Completed" onclick="markCompleted(${index})">✅</button>
          <button class="btn btn-sm btn-danger" title="Delete" onclick="deleteGame(${index})">🗑</button>
        </div>
      </div>
    `;
    if (game.cover) {
      html = `
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-start gap-2">
          <div class="flex-fill" id="gameDisplay-${index}">
            <img src="${game.cover}" alt="Cover" class="game-cover-img" />
            <strong>${game.title}</strong> (${game.platform}) — <em>${game.mode}</em><br />
            <small>Time played: ${game.time} hrs</small>
          </div>
          <div class="btn-group mt-2 mt-md-0">
            <button class="btn btn-sm btn-outline-secondary" title="Edit" onclick="editGame(${index})">✏️</button>
            <button class="btn btn-sm btn-success" title="Mark as Completed" onclick="markCompleted(${index})">✅</button>
            <button class="btn btn-sm btn-danger" title="Delete" onclick="deleteGame(${index})">🗑</button>
          </div>
        </div>
      `;
    }
    li.innerHTML = html;
    list.appendChild(li);
  });
}

// --- Render Completed Games ---
function renderCompletedGames() {
  const list = document.getElementById("finishedGameList");
  list.innerHTML = "";

  completedGames.forEach((game, index) => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.innerHTML = `
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-start gap-2">
        <div>
          ${game.cover ? `<img src="${game.cover}" alt="Cover" class="game-cover-img" />` : ""}
          <strong>${game.title}</strong> (${game.platform}) — <em>${game.mode}</em>
          <br><small>Time played: ${game.time} hrs</small>
          ${game.rating ? `<br><span>Rating: ${'⭐'.repeat(game.rating)}</span>` : ""}
          ${game.notes ? `<br><span>Notes: ${game.notes}</span>` : ""}
        </div>
        <div class="btn-group mt-2 mt-md-0">
          <button class="btn btn-sm btn-outline-secondary" title="Restore" onclick="unmarkCompleted(${index})">🔄 Restore</button>
          <button class="btn btn-sm btn-outline-primary" title="Add/Edit Notes" onclick="editCompletedNotes(${index})">📝 Notes</button>
        </div>
      </div>
    `;
    list.appendChild(li);
  });
}

// --- Add/Edit/Delete/Complete ---
function editGame(index) {
  const game = games[index];
  const container = document.getElementById(`gameDisplay-${index}`);

  container.innerHTML = `
    <input type="text" class="form-control form-control-sm mb-1" id="editTitle-${index}" value="${game.title}" disabled />
    <input type="text" class="form-control form-control-sm mb-1" id="editPlatform-${index}" value="${game.platform}" />
    <select class="form-select form-select-sm mb-1" id="editMode-${index}">
      <option value="Singleplayer" ${game.mode === "Singleplayer" ? "selected" : ""}>Singleplayer</option>
      <option value="Multiplayer" ${game.mode === "Multiplayer" ? "selected" : ""}>Multiplayer</option>
    </select>
    <input type="number" min="0" class="form-control form-control-sm mb-1" id="editTime-${index}" value="${game.time}" />
    <div class="btn-group mt-1">
      <button class="btn btn-sm btn-success" onclick="saveGame(${index})">✅</button>
      <button class="btn btn-sm btn-secondary" onclick="renderGames()">❌</button>
    </div>
  `;
}

function saveGame(index) {
  const platform = document.getElementById(`editPlatform-${index}`).value.trim();
  const mode = document.getElementById(`editMode-${index}`).value;
  const time = parseInt(document.getElementById(`editTime-${index}`).value) || 0;

  games[index].platform = platform;
  games[index].mode = mode;
  games[index].time = time;
  saveGames();
  renderGames();
}

function deleteGame(index) {
  const skipConfirmation = localStorage.getItem("skipDeleteConfirmation") === "true";
  if (!skipConfirmation) {
    const confirmationWrapper = document.createElement("div");
    confirmationWrapper.innerHTML = `
      <div class="custom-modal-bg" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                  display: flex; align-items: center;
                  justify-content: center; z-index: 9999;">
        <div class="custom-modal-content" style="padding: 20px; max-width: 300px; text-align: center;">
          <p>Are you sure you want to delete this game?</p>
          <div class="form-check mb-2">
            <input type="checkbox" class="form-check-input" id="dontAskDelete" />
            <label class="form-check-label" for="dontAskDelete">Don’t ask again</label>
          </div>
          <button class="btn btn-danger btn-sm me-2" id="confirmDelete">Yes, delete</button>
          <button class="btn btn-secondary btn-sm" id="cancelDelete">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(confirmationWrapper);

    document.getElementById("confirmDelete").onclick = () => {
      if (document.getElementById("dontAskDelete").checked) {
        localStorage.setItem("skipDeleteConfirmation", "true");
      }
      games.splice(index, 1);
      saveGames();
      renderGames();
      document.body.removeChild(confirmationWrapper);
    };
    document.getElementById("cancelDelete").onclick = () => {
      document.body.removeChild(confirmationWrapper);
    };
  } else {
    games.splice(index, 1);
    saveGames();
    renderGames();
  }
}

function markCompleted(index) {
  const game = games[index];
  const rating = prompt(
    `How would you rate "${game.title}"?\nEnter a number from 1 (worst) to 5 (best):`
  );
  if (rating === null) return;
  const ratingNum = Math.max(1, Math.min(5, parseInt(rating, 10))) || 1;

  const notes = prompt(`Any notes for "${game.title}"? (optional)`, "");
  completedGames.push({
    ...game,
    rating: ratingNum,
    notes: notes ? notes.trim() : ""
  });
  games.splice(index, 1);
  saveGames();
  saveCompletedGames();
  renderGames();
  renderCompletedGames();
}

function unmarkCompleted(index) {
  const game = completedGames[index];
  if (!game) {
    alert("Game not found.");
    return;
  }
  if (confirm(`Move "${game.title}" back to your active game list?`)) {
    games.push(game);
    completedGames.splice(index, 1);
    saveGames();
    saveCompletedGames();
    renderGames();
    renderCompletedGames();
  }
}

// --- Pick Game Logic ---
function filterGames() {
  const onlySP = document.getElementById("onlySP").checked;
  const onlyMP = document.getElementById("onlyMP").checked;
  return games.filter((g) => {
    if (onlySP && g.mode !== "Singleplayer") return false;
    if (onlyMP && g.mode !== "Multiplayer") return false;
    return true;
  });
}

function pickGame() {
  const filtered = filterGames();
  if (filtered.length === 0) {
    document.getElementById("pickedGame").innerText = "No games match the selected filters.";
    return;
  }
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * filtered.length);
  } while (
    document.getElementById("excludeLast").checked &&
    filtered.length > 1 &&
    games.indexOf(filtered[newIndex]) === lastPickedIndex
  );
  const picked = filtered[newIndex];
  lastPickedIndex = games.indexOf(picked);
  document.getElementById("pickedGame").innerText = `🎮 ${picked.title} (${picked.platform}) — ${picked.mode}`;
}

function pickTwoGames() {
  const filtered = filterGames();
  if (filtered.length === 0) {
    document.getElementById("pickedGame").innerText = "No games match the selected filters.";
    return;
  }
  let options = [...filtered];
  if (document.getElementById("excludeLast").checked && filtered.length > 1) {
    options = options.filter((g) => games.indexOf(g) !== lastPickedIndex);
  }
  const picks = [];
  while (picks.length < 2 && options.length > 0) {
    const randIndex = Math.floor(Math.random() * options.length);
    picks.push(options[randIndex]);
    options.splice(randIndex, 1);
  }
  document.getElementById("pickedGame").innerText = picks
    .map((g) => `🎮 ${g.title} (${g.platform}) — ${g.mode}`)
    .join("\n");
}

// --- Theme ---
function applyTheme(theme) {
  const body = document.body;
  if (theme === "dark") {
    body.classList.remove("bg-light", "text-dark");
    body.classList.add("bg-dark", "text-light");
    document.getElementById("themeSwitch").checked = true;
  } else {
    body.classList.remove("bg-dark", "text-light");
    body.classList.add("bg-light", "text-dark");
    document.getElementById("themeSwitch").checked = false;
  }
}

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  renderGames();
  renderCompletedGames();

  document.getElementById("addGameForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const title = document.getElementById("gameTitle").value.trim();
    const platform = document.getElementById("gamePlatform").value.trim();
    const mode = document.getElementById("gameMode").value;
    const time = parseInt(document.getElementById("gameTime").value) || 0;

    if (!title || !platform || !mode) {
      alert("Please fill in all fields!");
      return;
    }

    const fileInput = document.getElementById('gameCover');
    const file = fileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        addGame({ cover: evt.target.result }); // Pass base64 string
      };
      reader.readAsDataURL(file);
    } else {
      addGame({ cover: "" });
    }
  });

  document.getElementById("excludeLast").checked = false;
  document.getElementById("onlySP").checked = false;
  document.getElementById("onlyMP").checked = false;

  // Theme
  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);
  document.getElementById("themeSwitch").addEventListener("change", function () {
    const theme = this.checked ? "dark" : "light";
    localStorage.setItem("theme", theme);
    applyTheme(theme);
  });
});
// Adding cover image for the game 
function addGame(extraFields) {
  const title = document.getElementById("gameTitle").value.trim();
  const platform = document.getElementById("gamePlatform").value.trim();
  const mode = document.getElementById("gameMode").value;
  const time = parseInt(document.getElementById("gameTime").value) || 0;

  const game = {
    title,
    platform,
    mode,
    time,
    ...extraFields // cover image
  };
  games.push(game);
  saveGames();
  renderGames();
}

function editCompletedNotes(index) {
  const game = completedGames[index];
  const currentNotes = game.notes || "";
  const notes = prompt(`Add or edit notes for "${game.title}":`, currentNotes);
  if (notes !== null) {
    completedGames[index].notes = notes.trim();
    saveCompletedGames();
    renderCompletedGames();
  }
}

function renderStats() {
  const statsBox = document.getElementById("statsBox");
  const totalGames = games.length + completedGames.length;
  const activeGames = games.length;
  const completed = completedGames.length;
  const totalHours = [...games, ...completedGames].reduce((sum, g) => sum + (parseInt(g.time) || 0), 0);

  // Favorite platform
  const allPlatforms = [...games, ...completedGames].map(g => g.platform);
  const platformCounts = {};
  allPlatforms.forEach(p => { platformCounts[p] = (platformCounts[p] || 0) + 1; });
  const favoritePlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  statsBox.innerHTML = `
    <ul class="mb-0">
      <li>Total games: ${totalGames}</li>
      <li>Active games: ${activeGames}</li>
      <li>Completed games: ${completed}</li>
      <li>Total hours played: ${totalHours} hrs</li>
      <li>Favorite platform: ${favoritePlatform}</li>
    </ul>
  `;
}

// --- Picked Game ---
function copyPickedGameSummary() {
  const pickedGame = window.lastPickedGame;
  if (!pickedGame) return alert("No game picked yet!");
  const summary = formatGameSummary(pickedGame);
  navigator.clipboard.writeText(summary);
  alert("Picked game summary copied to clipboard!");
}

function sharePickedGameImage() {
  const pickedGameBox = document.getElementById('pickedGame');
  if (!pickedGameBox.textContent.trim()) return alert("No game picked yet!");
  html2canvas(pickedGameBox, {backgroundColor: null}).then(canvas => {
    const link = document.createElement('a');
    link.download = 'picked-game.png';
    link.href = canvas.toDataURL();
    link.click();
  });
}

// --- Game List ---
function copyGameListSummary() {
  if (!games.length) return alert("No games in your list!");
  const summary = games.map(formatGameSummary).join('\n\n');
  navigator.clipboard.writeText(summary);
  alert("Game list copied to clipboard!");
}

function shareGameListImage() {
  const gameListBox = document.getElementById('gameList');
  if (!gameListBox.textContent.trim()) return alert("No games in your list!");
  html2canvas(gameListBox, {backgroundColor: null}).then(canvas => {
    const link = document.createElement('a');
    link.download = 'game-list.png';
    link.href = canvas.toDataURL();
    link.click();
  });
}

function copyCompletedListSummary() {
  if (!completedGames.length) return alert("No completed games!");
  const summary = completedGames.map(formatGameSummary).join('\n\n');
  navigator.clipboard.writeText(summary);
  alert("Completed games list copied to clipboard!");
}

function shareCompletedListImage() {
  const finishedList = document.getElementById('finishedGameList');
  if (!finishedList.textContent.trim()) return alert("No completed games!");
  html2canvas(finishedList, {backgroundColor: null}).then(canvas => {
    const link = document.createElement('a');
    link.download = 'completed-games.png';
    link.href = canvas.toDataURL();
    link.click();
  });
}

// --- Helper ---
function formatGameSummary(game) {
  return `🎮 ${game.title} (${game.platform})
Mode: ${game.mode}
Hours: ${game.time}
${game.rating ? 'Rating: ' + '⭐'.repeat(game.rating) : ''}
${game.notes ? 'Notes: ' + game.notes : ''}`.trim();
}

// Backup/Restore
function getAppState() {
  return {
    games,
    completedGames,
    lastPickedIndex,
    theme: localStorage.getItem('theme') || 'light',
    skipDeleteConfirmation: localStorage.getItem('skipDeleteConfirmation') === "true",
    // Add more fields here as you add features
  };
}

function setAppState(state) {
  games = state.games || [];
  completedGames = state.completedGames || [];
  lastPickedIndex = typeof state.lastPickedIndex === "number" ? state.lastPickedIndex : -1;
  if (state.theme) localStorage.setItem('theme', state.theme);
  if (typeof state.skipDeleteConfirmation === "boolean") {
    localStorage.setItem('skipDeleteConfirmation', state.skipDeleteConfirmation ? "true" : "false");
  }
  // Add more fields here as you add features
  saveGames();
  saveCompletedGames();
  renderGames();
  renderCompletedGames();
  renderStats && renderStats();
}

function exportAppState() {
  const state = getAppState();
  const blob = new Blob([JSON.stringify(state, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pick-me-a-game-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById('importBackupFile').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const state = JSON.parse(evt.target.result);
      setAppState(state);
      alert("Backup restored!");
    } catch (err) {
      alert("Invalid backup file.");
    }
  };
  reader.readAsText(file);
});

// Call renderStats() after every change:
renderStats();