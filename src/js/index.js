// --- Data ---
let games = JSON.parse(localStorage.getItem("gameList") || "[]");
let completedGames = JSON.parse(localStorage.getItem("completedGames") || "[]");
let lastPickedIndex = -1;

//achievements 
function buildAppState() {
  // Count completed today
  const today = new Date().toDateString();
  let completedToday = completedGames.filter(g =>
    g.completedAt && new Date(g.completedAt).toDateString() === today
  ).length;

  // Unique days used
  let days = JSON.parse(localStorage.getItem('daysUsed') || '[]');
  if (!days.includes(today)) {
    days.push(today);
    localStorage.setItem('daysUsed', JSON.stringify(days));
  }

  // For "exported", "imported", "picked", "shared", use window flags
  return {
    games,
    completed: completedGames,
    completedToday,
    exported: !!window._exported,
    imported: !!window._imported,
    picked: !!window._picked,
    shared: !!window._shared,
    darkMode: document.body.classList.contains('bg-dark'),
    daysUsed: days.length,
  };
}

// --- Save/Load ---
function saveGames() {
  localStorage.setItem("gameList", JSON.stringify(games));
}
function saveCompletedGames() {
  localStorage.setItem("completedGames", JSON.stringify(completedGames));
}

// --- Render Active Games ---
function renderGames() {
  const section = document.getElementById("yourGamesSection");
  const grid = document.getElementById("gameList");
  grid.innerHTML = "";

  if (games.length === 0) {
    section.style.display = "none";
    return;
  } else {
    section.style.display = "";
  }

  games.forEach((game, index) => {
    const card = document.createElement("div");
    card.className = "game-card";
    card.innerHTML = `
      <div class="game-card-inner">
        <div class="game-info" id="gameDisplay-${index}">
          <div class="game-title"><strong>${game.title}</strong></div>
          <div class="game-meta">${game.platform} – ${game.mode}</div>
          <div class="game-time">Time played: ${game.time} hrs</div>
        </div>
        <div class="game-cover-menu">
          <div class="cover-wrapper">
            ${game.cover && game.cover.trim() !== "" 
  ? `<img src="${game.cover}" alt="Cover" class="game-cover-img" />` 
  : `<img src="src/img/placeholder_cover.png" alt="No cover" class="game-cover-img" />`}
          </div>
          <div class="dropdown card-menu">
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="More actions">
              <i class="bi bi-three-dots-vertical"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><a class="dropdown-item" href="#" onclick="editGame(${index});return false;"><i class="bi bi-pencil"></i> Edit</a></li>
              <li><a class="dropdown-item" href="#" onclick="markCompleted(${index});return false;"><i class="bi bi-check2-circle"></i> Mark as Completed</a></li>
              <li><a class="dropdown-item text-danger" href="#" onclick="deleteGame(${index});return false;"><i class="bi bi-trash"></i> Delete</a></li>
            </ul>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// --- Render Completed Games ---
function renderCompletedGames() {
  const section = document.getElementById("completedGamesSection");
  const grid = document.getElementById("finishedGameList");
  grid.innerHTML = "";

  if (completedGames.length === 0) {
    section.style.display = "none";
    return;
  } else {
    section.style.display = "";
  }

  completedGames.forEach((game, index) => {
    const card = document.createElement("div");
    card.className = "game-card";
    card.innerHTML = `
      <div class="game-card-inner">
        <div class="game-info">
          <div class="game-title"><strong>${game.title}</strong></div>
          <div class="game-meta">${game.platform} – ${game.mode}</div>
          <div class="game-time">Time played: ${game.time} hrs</div>
          <div class="game-review">
            ${game.rating ? "★".repeat(game.rating) + "☆".repeat(5 - game.rating) : "No rating"}
          </div>
          <div class="game-notes">
            <div class="notes-label">Notes</div>
            <div class="notes-content">${game.notes ? game.notes.replace(/\n/g, "<br>") : "<span class='text-muted'>No notes</span>"}</div>
          </div>
        </div>
        <div class="game-cover-menu">
          <div class="cover-wrapper">
            ${game.cover && game.cover.trim() !== "" 
          ? `<img src="${game.cover}" alt="Cover" class="game-cover-img" />` 
          : `<img src="src/img/placeholder_cover.png" alt="No cover" class="game-cover-img" />`}
          </div>
        </div>
        <div class="dropdown card-menu">
          <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="More actions">
            <i class="bi bi-three-dots-vertical"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><a class="dropdown-item" href="#" onclick="editCompletedNotes(${index});return false;"><i class="bi bi-pencil"></i> Edit Notes</a></li>
            <li><a class="dropdown-item" href="#" onclick="unmarkCompleted(${index});return false;"><i class="bi bi-arrow-counterclockwise"></i> Restore</a></li>
            <li><a class="dropdown-item text-danger" href="#" onclick="deleteCompletedGame(${index});return false;"><i class="bi bi-trash"></i> Delete</a></li>
          </ul>
        </div>
      </div>
    `;
    grid.appendChild(card);
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
    <div class="mb-2">
      <label for="editCover-${index}" class="form-label mb-1">Game Cover Image (optional):</label>
      <input type="file" id="editCover-${index}" accept="image/*" class="form-control form-control-sm" />
      ${game.cover ? `<img src="${game.cover}" alt="Cover" class="game-cover-img mt-2" style="max-width:60px;display:block;" />` : ""}
    </div>
    <div class="btn-group mt-1">
      <button class="btn btn-sm btn-success" onclick="saveGame(${index})" title="Save">
        <i class="bi bi-check-circle-fill"></i>
      </button>
      <button class="btn btn-sm btn-secondary" onclick="renderGames()" title="Cancel">
        <i class="bi bi-x-circle-fill"></i>
      </button>
    </div>
  `;

  // Optional: Preview new cover before saving
  const coverInput = document.getElementById(`editCover-${index}`);
  coverInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        const img = container.querySelector('.game-cover-img');
        if (img) {
          img.src = evt.target.result;
        } else {
          const newImg = document.createElement('img');
          newImg.src = evt.target.result;
          newImg.className = 'game-cover-img mt-2';
          newImg.style.maxWidth = '60px';
          newImg.style.display = 'block';
          coverInput.parentNode.appendChild(newImg);
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

function deleteCompletedGame(index) {
  const confirmationWrapper = document.createElement("div");
  confirmationWrapper.innerHTML = `
    <div class="custom-modal-bg" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                display: flex; align-items: center;
                justify-content: center; z-index: 9999;">
      <div class="custom-modal-content" style="padding: 20px; max-width: 300px; text-align: center;">
        <p>Are you sure you want to delete this completed game?</p>
        <button class="btn btn-danger btn-sm me-2" id="confirmDeleteCompleted">Yes, delete</button>
        <button class="btn btn-secondary btn-sm" id="cancelDeleteCompleted">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(confirmationWrapper);

  document.getElementById("confirmDeleteCompleted").onclick = () => {
    completedGames.splice(index, 1);
    saveCompletedGames();
    renderCompletedGames();
    renderStats && renderStats();
    document.body.removeChild(confirmationWrapper);
  };
  document.getElementById("cancelDeleteCompleted").onclick = () => {
    document.body.removeChild(confirmationWrapper);
  };
}

function saveGame(index) {
  const platform = document.getElementById(`editPlatform-${index}`).value.trim();
  const mode = document.getElementById(`editMode-${index}`).value;
  const time = parseInt(document.getElementById(`editTime-${index}`).value) || 0;
  const coverInput = document.getElementById(`editCover-${index}`);
  const file = coverInput && coverInput.files[0];

  games[index].platform = platform;
  games[index].mode = mode;
  games[index].time = time;

  if (file) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      games[index].cover = evt.target.result;
      saveGames();
      renderGames();
    };
    reader.readAsDataURL(file);
  } else {
    saveGames();
    renderGames();
  }
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
  const modal = document.getElementById('completeModal');
  const ratingInput = document.getElementById('completeRating');
  const notesInput = document.getElementById('completeNotes');
  const confirmBtn = document.getElementById('confirmCompleteBtn');
  const cancelBtn = document.getElementById('cancelCompleteBtn');

  // Reset fields
  ratingInput.value = "5";
  notesInput.value = "";

  modal.classList.remove('d-none');

  // Confirm handler
  confirmBtn.onclick = () => {
    const ratingNum = parseInt(ratingInput.value, 10);
    const notes = notesInput.value.trim();
    completedGames.push({
      ...game,
      rating: ratingNum,
      notes,
      completedAt: Date.now()
    });
    games.splice(index, 1);
    saveGames();
    saveCompletedGames();
    renderGames();
    renderCompletedGames();
    renderStats();
    showAchievementPopup();
    checkAchievements(buildAppState());
    modal.classList.add('d-none');
  };

  // Cancel handler
  cancelBtn.onclick = () => {
    modal.classList.add('d-none');
  };
}

function unmarkCompleted(index) {
  const game = completedGames[index];
  if (!game) {
    alert("Game not found.");
    return;
  }

  // Create custom modal
  const confirmationWrapper = document.createElement("div");
  confirmationWrapper.innerHTML = `
    <div class="custom-modal-bg" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                display: flex; align-items: center;
                justify-content: center; z-index: 9999;">
      <div class="custom-modal-content" style="padding: 20px; max-width: 320px; text-align: center;">
        <p>Move "<strong>${game.title}</strong>" back to your active game list?</p>
        <button class="btn btn-success btn-sm me-2" id="confirmRestore">Restore</button>
        <button class="btn btn-secondary btn-sm" id="cancelRestore">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(confirmationWrapper);

  document.getElementById("confirmRestore").onclick = () => {
    games.push(game);
    completedGames.splice(index, 1);
    saveGames();
    saveCompletedGames();
    renderGames();
    renderCompletedGames();
    renderStats();
    document.body.removeChild(confirmationWrapper);
  };
  document.getElementById("cancelRestore").onclick = () => {
    document.body.removeChild(confirmationWrapper);
  };
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

  document.getElementById('pickedGameWrapper').classList.remove('d-none');

  window._picked = true;
  checkAchievements(buildAppState());
  window._picked = false;
  showRandomMessage();
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
    document.getElementById('pickedGameWrapper').classList.remove('d-none');
    showRandomMessage();
}

// --- Theme Dark / Light Mode ---
function applyTheme(theme) {
  const body = document.body;
  if (theme === "dark") {
    body.classList.remove("bg-light", "text-dark");
    body.classList.add("bg-dark", "text-light");
    themeSwitch.checked = true;
    updateThemeIcon(true);
  } else {
    body.classList.remove("bg-dark", "text-light");
    body.classList.add("bg-light", "text-dark");
    themeSwitch.checked = false;
    updateThemeIcon(false);
  }
  localStorage.setItem("theme", theme);
}

const themeSwitch = document.getElementById('themeSwitch');
const themeIcon = document.getElementById('themeIcon');

function updateThemeIcon(isDark) {
  if (isDark) {
    themeIcon.classList.remove('bi-sun');
    themeIcon.classList.add('bi-moon');
  } else {
    themeIcon.classList.remove('bi-moon');
    themeIcon.classList.add('bi-sun');
  }
}

themeSwitch.addEventListener('change', function() {
  updateThemeIcon(themeSwitch.checked);
});

// On load, set correct icon
document.addEventListener('DOMContentLoaded', function() {
  updateThemeIcon(themeSwitch.checked);
});

// -----------------------

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  checkAchievements(buildAppState()); // <-- Add this line FIRST

  renderGames();
  renderCompletedGames();
  renderStats();


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

    // Helper to actually add the game and reset form
    function doAddGame(cover) {
      addGame({
        title,
        platform,
        mode,
        time,
        cover: cover || "",
      });
      e.target.reset();
      document.getElementById('gamePlatform').selectedIndex = 0;
      document.getElementById('gameMode').selectedIndex = 0;
      showGameAddedConfirmation();
    }

    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        doAddGame(evt.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      doAddGame("");
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
    checkAchievements(buildAppState());
  });
  checkAchievements(buildAppState());
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
    addedAt: Date.now(), // <-- Add this line!
    ...extraFields // cover image
  };
  games.push(game);
  saveGames();
  renderGames();
  checkAchievements(buildAppState()); // <-- Add this line!
}

function editCompletedNotes(index) {
  const game = completedGames[index];
  const currentNotes = game.notes || "";

  // Create custom modal
  const modalWrapper = document.createElement("div");
  modalWrapper.innerHTML = `
    <div class="custom-modal-bg" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                display: flex; align-items: center;
                justify-content: center; z-index: 9999;">
      <div class="custom-modal-content" style="padding: 20px; max-width: 340px;">
        <h5>Edit Notes for "${game.title}"</h5>
        <textarea class="form-control mb-3" id="editNotesArea" rows="4" style="resize:vertical;">${currentNotes}</textarea>
        <div class="d-flex gap-2 justify-content-end">
          <button class="btn btn-success btn-sm" id="saveNotesBtn">Save</button>
          <button class="btn btn-secondary btn-sm" id="cancelNotesBtn">Cancel</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalWrapper);

  document.getElementById("saveNotesBtn").onclick = () => {
    const notes = document.getElementById("editNotesArea").value.trim();
    completedGames[index].notes = notes;
    saveCompletedGames();
    renderCompletedGames();
    document.body.removeChild(modalWrapper);
  };
  document.getElementById("cancelNotesBtn").onclick = () => {
    document.body.removeChild(modalWrapper);
  };
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

  // Achievements counter (hardcoded total to 25)
  let unlocked = [];
  if (window.getUnlockedAchievements) {
    unlocked = window.getUnlockedAchievements();
  }
  const unlockedCount = unlocked.length;

  statsBox.innerHTML = `
    <ul class="mb-0">
      <li>Total games: ${totalGames}</li>
      <li>Active games: ${activeGames}</li>
      <li>Completed games: ${completed}</li>
      <li>Total hours played: ${totalHours} hrs</li>
      <li>Favorite platform: ${favoritePlatform}</li>
      <li>Achievements unlocked: ${unlockedCount} of 25</li>
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

  window._shared = true;
  checkAchievements(buildAppState());
  window._shared = false;
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
    unlockedAchievements: JSON.parse(localStorage.getItem('unlockedAchievements') || '[]'),
    daysUsed: JSON.parse(localStorage.getItem('daysUsed') || '[]'),
    pmag_nickname: localStorage.getItem('pmag_nickname') || '',
    pmag_avatar: localStorage.getItem('pmag_avatar') || '',
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
  if (state.unlockedAchievements) {
    localStorage.setItem('unlockedAchievements', JSON.stringify(state.unlockedAchievements));
  }
  if (state.daysUsed) {
    localStorage.setItem('daysUsed', JSON.stringify(state.daysUsed));
  }
  // Restore avatar and nickname
  if (typeof state.pmag_nickname === "string") {
    localStorage.setItem('pmag_nickname', state.pmag_nickname);
  }
  if (typeof state.pmag_avatar === "string") {
    localStorage.setItem('pmag_avatar', state.pmag_avatar);
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

  window._exported = true;
  checkAchievements(buildAppState());
  window._exported = false;
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

  window._imported = true;
  checkAchievements(buildAppState());
  window._imported = false;
});

// Call renderStats() after every change:
renderStats();

function showGameAddedConfirmation() {
  const alert = document.getElementById('gameAddedAlert');
  alert.classList.remove('d-none');
  setTimeout(() => {
    alert.classList.add('d-none');
  }, 2000);
}


// add achivement popout

function showAchievementPopup(message) {
  const audio = document.getElementById('achievementChime');
  if (audio) {
    audio.currentTime = 0;
    audio.play();
    audio.onended = () => {
      audio.currentTime = 0;
      audio.pause();
      // Remove from DOM to clear iOS media session
      audio.parentNode.removeChild(audio);
      // Re-add for next use
      const newAudio = audio.cloneNode(true);
      newAudio.id = 'achievementChime';
      document.body.appendChild(newAudio);
    };
  }
  const popup = document.getElementById('achievementPopup');
  popup.querySelector('.achievement-text').textContent = message || "Congrats on completing the game! Up to the next one 🎉";
  popup.classList.remove('d-none');
  setTimeout(() => {
    popup.classList.add('show');
  }, 10);
  setTimeout(() => {
    popup.classList.remove('show');
    setTimeout(() => popup.classList.add('d-none'), 400);
  }, 5000);
}


// mobile full screen PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('service-worker.js');
  });
}