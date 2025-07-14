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
  const list = document.getElementById("gameList");
  list.innerHTML = "";

  if (games.length === 0) {
    section.style.display = "none";
    return;
  } else {
    section.style.display = "";
  }

  games.forEach((game, index) => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    let html = `
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-start gap-2">
        <div class="flex-fill" id="gameDisplay-${index}">
          <strong>${game.title}</strong> (${game.platform}) — <em>${game.mode}</em><br />
          <small>Time played: ${game.time} hrs</small>
        </div>
        <div class="dropdown mt-2 mt-md-0">
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
    `;
    if (game.cover) {
      html = `
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-start gap-2">
          <div class="flex-fill" id="gameDisplay-${index}">
            <img src="${game.cover}" alt="Cover" class="game-cover-img" />
            <strong>${game.title}</strong> (${game.platform}) — <em>${game.mode}</em><br />
            <small>Time played: ${game.time} hrs</small>
          </div>
          <div class="dropdown mt-2 mt-md-0">
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
      `;
    }
    li.innerHTML = html;
    list.appendChild(li);
  });
}

// --- Render Completed Games ---
function renderCompletedGames() {
  const section = document.getElementById("completedGamesSection");
  const list = document.getElementById("finishedGameList");
  list.innerHTML = "";

  if (completedGames.length === 0) {
    section.style.display = "none";
    return;
  } else {
    section.style.display = "";
  }

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
        <div class="dropdown mt-2 mt-md-0">
          <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="More actions">
            <i class="bi bi-three-dots-vertical"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li>
              <a class="dropdown-item" href="#" onclick="unmarkCompleted(${index});return false;">
              <i class="bi bi-arrow-counterclockwise"></i> Restore
              </a>
            </li>
            <li>
              <a class="dropdown-item" href="#" onclick="editCompletedNotes(${index});return false;">
              <i class="bi bi-journal-text"></i> Notes
              </a>
            </li>
          </ul>
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
  if (confirm(`Move "${game.title}" back to your active game list?`)) {
    games.push(game);
    completedGames.splice(index, 1);
    saveGames();
    saveCompletedGames();
    renderGames();
    renderCompletedGames();
    renderStats();
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


// --- Greeting Banner ---

document.addEventListener('DOMContentLoaded', function() {
  const greetings = [
    "Welcome back, Gamer! 🎮",
    "Ready for your next adventure?",
    "Achievement unlocked: Visiting today!",
    "Let’s pick something epic to play!",
    "Good to see you! What will you play next?",
    "Level up your backlog today!",
    "Game on! What’s your mood?",
    "New quest: Find your next game!",
    "You’ve respawned! Let’s roll!",
    "Insert coin to continue your journey!",
    "Time to grind or chill — your call.",
    "Let’s slay that backlog, one game at a time.",
    "Controller in hand? Let’s do this.",
    "Your save file is loaded. Welcome back!",
    "Another day, another level to conquer!",
    "You’re back online, Commander.",
    "Logged in and looking legendary!",
    "It’s dangerous to go alone… take a game!",
    "Choose your next mission wisely.",
    "May your frame rates be high and lobbies be fast.",
    "Time to press start on something new!",
    "The game world awaits your return!",
    "Welcome, Champion! What’s your next battle?",
    "Start your engines — game time!",
    "It's-a you! Let’s pick a game!",
    "Time to roll the dice on a new adventure.",
    "A new challenger approaches… it’s you!",
    "Gaming mode: Activated.",
    "Pick your path — RPG, FPS, or cozy farming?",
    "Adventure doesn’t start itself.",
    "Let the backlog battles commence!",
    "Let’s pause reality and play.",
    "The realm awaits your presence.",
    "Game over? Nah — just getting started.",
    "You’ve got this. Let’s find your next win.",
    "Your controller misses you!",
    "Next up: Gaming greatness.",
    "Booting up your next big obsession.",
    "XP boost activated. Let’s go!",
    "The grind begins now.",
    "Side quest accepted: Find a game!",
    "Loading fun… please wait…",
    "Equip your headset — let’s play.",
    "Back for more? We knew you’d return.",
    "It’s time to press A to continue.",
    "You bring the snacks, we bring the games.",
    "Your party needs you!",
    "Power on, let’s dive in.",
    "No bugs here, just games.",
    "Loot, level, repeat.",
    "Don't just stand there — grab a game!",
    "Today’s vibes: gaming excellence.",
    "Console or PC — it’s your world.",
    "Mount your chocobo, we ride at dawn!",
    "You’ve logged in. Now choose your destiny.",
    "We saved your seat — and your save file.",
    "You've earned some screen time.",
    "Welcome back to the leaderboard.",
    "Ready, player one?",
    "Welcome to the grind zone.",
    "You’ve returned from the pause menu!",
    "Are you not entertained? Let’s fix that.",
    "Back again? Your backlog trembles.",
    "Let’s break some pixels today!",
    "Is it a gaming day? Trick question — always.",
    "Ready to farm, fight, or fly?",
    "Player spotted. Loading game suggestions.",
    "It’s time to co-op with your controller.",
    "Escape reality — just for a little while.",
    "New game plus? Let’s find one!",
    "Today’s forecast: 100% chance of gaming.",
    "A wild gamer appeared!",
    "Take your time — we’ve got plenty of games.",
    "From 8-bit to 4K, let’s go!",
    "Choose your character… oh wait, it’s you!",
    "You're online — time to go AFK in real life.",
    "Craving chaos or calm? Let’s pick.",
    "You bring the skill, we bring the picks.",
    "Back in the lobby — welcome!",
    "One does not simply visit without finding a game.",
    "On a quest for fun? You’re in the right place.",
    "Time to rack up some playtime!",
    "Health bar full — let’s go!",
    "Who needs sleep when you have games?",
    "Back at it — let’s conquer some quests.",
    "You’re in the right zone — the fun zone.",
    "Tired of reality? Excellent timing.",
    "What's the vibe — chill or challenge?",
    "Back in the game hub — welcome!",
    "Recharged and ready to play!",
    "New loot available — time to choose.",
    "We queued up the fun. You just pick.",
    "Energy levels: 100%. Game time!",
    "You pressed start — now choose your world.",
    "Every day’s a good day for games.",
    "Wanna save the world or plant some crops?",
    "You’ve logged in to the fun dimension.",
    "You’re just in time for a new journey.",
    "Game picking difficulty: Insane. Let’s help.",
    "Mood: gaming. Let’s fuel it.",
    "One click away from your next obsession.",
    "Console: on. Mind: ready.",
    "You’re the protagonist today.",
    "Let’s make your game time legendary.",
    "Mission accepted: Find fun."
  ];

  if (!sessionStorage.getItem('greetingShown')) {
    let lastGreetingIndex = parseInt(sessionStorage.getItem('lastGreetingIndex'), 10);
    let idx;
    do {
      idx = Math.floor(Math.random() * greetings.length);
    } while (greetings.length > 1 && idx === lastGreetingIndex);

    sessionStorage.setItem('lastGreetingIndex', idx); // Save for next time

    const greeting = greetings[idx];
    const banner = document.getElementById('greetingBanner');
    banner.textContent = greeting;
    banner.classList.remove('d-none');
    sessionStorage.setItem('greetingShown', '1');

    // Hide after 5 seconds with fade-out
    setTimeout(() => {
      banner.classList.add('fade-out');
      setTimeout(() => {
        banner.remove();
      }, 500); // Wait for fade-out transition
    }, 5000);
  }
});

// show random quote/tip/fact on picking a game
const gamingMessages = [
  "“It's dangerous to go alone! Take this.” – The Legend of Zelda",
  "Tip: Try playing with friends for a new experience!",
  "Fun Fact: The best-selling game of all time is Minecraft.",
  "“War. War never changes.” – Fallout",
  "Tip: Take breaks to avoid gaming fatigue.",
  "Fun Fact: Pac-Man was inspired by a pizza with a slice missing.",
  "“Do a barrel roll!” – Star Fox 64",
  "Tip: Use headphones for a more immersive experience.",
  "Fun Fact: The voice of Mario is Charles Martinet.",
  "“Finish him!” – Mortal Kombat",
  "Tip: Lower sensitivity can improve your aim in shooters.",
  "Fun Fact: Tetris was created by a Russian software engineer in 1984.",
  "“Praise the Sun!” – Dark Souls",
  "Tip: Don’t ignore side quests — they often offer great rewards.",
  "Fun Fact: The first home console was the Magnavox Odyssey (1972).",
  "“The cake is a lie.” – Portal",
  "Tip: Use autosave or save manually — don’t rely on just one save file.",
  "Fun Fact: The PlayStation was originally a collaboration between Sony and Nintendo.",
  "“You have died of dysentery.” – The Oregon Trail",
  "Tip: Calibrate your TV or monitor for better color and contrast in games.",
  "Fun Fact: Doom was once banned in Germany until 2011.",
  "“Hadouken!” – Street Fighter",
  "Tip: Turn off motion blur if it gives you headaches.",
  "Fun Fact: The character Kirby was named after Nintendo’s lawyer.",
  "“Nothing is true; everything is permitted.” – Assassin’s Creed",
  "Tip: Playing different genres can help improve your reflexes and problem-solving.",
  "Fun Fact: Lara Croft was originally supposed to be male.",
  "“Get over here!” – Scorpion, Mortal Kombat",
  "Tip: Adjust your in-game field of view (FOV) for a better perspective.",
  "Fun Fact: Final Fantasy was named so because it was meant to be the developer's last game.",
  "“Stay awhile and listen.” – Diablo",
  "Tip: Reduce screen time before bed to sleep better after gaming.",
  "Fun Fact: The longest game ever made (in hours) is “Monster Hunter Freedom Unite.”",
  "“I used to be an adventurer like you...” – Skyrim",
  "Tip: Use controller vibration feedback to improve reaction timing.",
  "Fun Fact: Pokémon is the highest-grossing media franchise of all time.",
  "“You must construct additional pylons.” – StarCraft",
  "Tip: A mechanical keyboard can improve your response time in PC gaming.",
  "Fun Fact: Mario first appeared in Donkey Kong as “Jumpman.”",
  "“Fus Ro Dah!” – Skyrim",
  "Tip: Keep your system dust-free to prevent overheating.",
  "Fun Fact: Animal Crossing uses your system’s real-time clock.",
  "“Snake? Snaaaake!” – Metal Gear Solid",
  "Tip: Don't skip tutorials — they often teach valuable mechanics.",
  "Fun Fact: The Sims was inspired by architecture simulation software.",
  "“Would you kindly...” – BioShock",
  "Tip: Always keep an eye on your health bar — don’t get greedy!",
  "Fun Fact: The original Xbox was nearly called the DirectX Box.",
  "“You were almost a Jill sandwich.” – Resident Evil",
  "Tip: Drinking water during long sessions helps with focus.",
  "Fun Fact: The Game Boy survived a bombing in the Gulf War and still works.",
  "“This is my story.” – Final Fantasy X",
  "Tip: Rebind your keys or controls if the defaults aren’t comfortable.",
  "Fun Fact: Grand Theft Auto V made over $1 billion in three days.",
  "“Requiescat in pace.” – Assassin’s Creed",
  "Tip: Play at your own pace — not every game needs to be rushed.",
  "Fun Fact: Minecraft was initially created in just 6 days.",
  "“Hey! Listen!” – Navi, The Legend of Zelda",
  "Tip: Lowering graphics settings can improve gameplay smoothness.",
  "Fun Fact: The first eSports event was in 1972 at Stanford University.",
  "“Boomshakalaka!” – NBA Jam",
  "Tip: Coop games are a great way to bond with friends or family.",
  "Fun Fact: The first Pokémon ever designed was Rhydon.",
  "“A man chooses, a slave obeys.” – BioShock",
  "Tip: Taking notes in puzzle games can really help.",
  "Fun Fact: The PS2 is the best-selling console of all time.",
  "“Objection!” – Phoenix Wright: Ace Attorney",
  "Tip: Learning enemy patterns makes boss fights easier.",
  "Fun Fact: Sonic the Hedgehog's shoes were inspired by Michael Jackson.",
  "“You were not prepared!” – Illidan, World of Warcraft",
  "Tip: Use cover effectively in shooters to stay alive longer.",
  "Fun Fact: Pong was so popular it caused coin shortages in the 70s.",
  "“I am Error.” – Zelda II: The Adventure of Link",
  "Tip: Games with NG+ modes are great for replay value.",
  "Fun Fact: The term “Easter egg” in games started with *Adventure* on the Atari 2600.",
  "“You can’t hide from the Shadow.” – League of Legends",
  "Tip: Use quick save before difficult decisions or fights.",
  "Fun Fact: Sega's Dreamcast was the first console with online play.",
  "“I choose you, Pikachu!” – Pokémon",
  "Tip: Keep your console firmware updated for better performance.",
  "Fun Fact: The name “Link” symbolizes connecting the player and the world.",
  "“My name is Commander Shepard...” – Mass Effect",
  "Tip: Sound cues are just as important as visuals in competitive games.",
  "Fun Fact: Portal was based on a student project called Narbacular Drop.",
  "“They’re taking the hobbits to Isengard!” – LEGO Lord of the Rings",
  "Tip: In strategy games, economy management is key to victory.",
  "Fun Fact: Metroid was one of the first games to feature a female protagonist.",
  "“It's-a me, Mario!” – Super Mario 64",
  "Tip: Stretch during long gaming sessions to prevent stiffness.",
  "Fun Fact: The Halo franchise helped make Xbox a success.",
  "“What is a man? A miserable little pile of secrets.” – Castlevania",
  "Tip: Try using a controller on PC for certain game genres.",
  "Fun Fact: League of Legends had over 100 million monthly players at its peak.",
  "“Jackpot!” – Devil May Cry",
  "Tip: In open-world games, explore off the main path for hidden gems.",
  "Fun Fact: Wii Sports is the best-selling single-platform game ever.",
  "“You are not alone.” – Final Fantasy IX",
  "Tip: Manage your inventory regularly to avoid getting overburdened.",
  "Fun Fact: The ESRB was created after Mortal Kombat’s controversial violence.",
  "“I’ve covered wars, you know.” – Dead Rising",
  "Tip: Some of the best stories in games are hidden in item descriptions.",
  "Fun Fact: Shigeru Miyamoto originally wanted to make games without scores.",
  "“Keep your eyes open. Your enemies will.” – Metal Gear Solid",
  "Tip: Playing on harder difficulties can teach advanced mechanics faster.",
  "Fun Fact: The character Samus was revealed to be female only at the end of the first Metroid.",
  "“Now you're playing with power!” – Nintendo slogan",
  "Tip: Turn off HUD for a more immersive experience in open-world games.",
  "Fun Fact: Silent Hill’s fog was originally due to hardware limitations.",
  "“I fight for my friends!” – Fire Emblem",
  "Tip: Custom loadouts can give you a big edge in multiplayer.",
  "Fun Fact: Kratos from God of War was almost blue instead of red.",
  "“You require more vespene gas.” – StarCraft",
  "Tip: Try a game you’ve never heard of — hidden gems are everywhere.",
  "Fun Fact: The name “Atari” comes from a Japanese term used in Go.",
  "“We all make choices in life, but in the end our choices make us.” – BioShock",
  "Tip: Use motion controls for better aiming in some Switch and Wii games.",
  "Fun Fact: The Dreamcast VMU was the first controller with a screen.",
  "“No gods or kings. Only man.” – BioShock",
  "Tip: Subtitles help catch important dialogue you might miss.",
  "Fun Fact: The longest-running game series is “The Oregon Trail,” dating back to 1971.",
  "“Let's-a go!” – Mario",
  "Tip: Tweak your in-game audio settings for footsteps in shooters.",
  "Fun Fact: EarthBound sold poorly in the U.S. but became a cult classic.",
  "“I've seen things you people wouldn't believe.” – Cyberpunk 2077 homage",
  "Tip: Learn hotkeys to speed up your gameplay in RTS and MMO games.",
  "Fun Fact: The Pokémon anime was created to promote the games, not the other way around.",
  "“You Died.” – Dark Souls",
  "Tip: Enable performance mode for smoother frame rates on console.",
  "Fun Fact: Pong machines used actual TVs and had to be tuned like old channels.",
  "“My body is ready.” – Reggie Fils-Aimé",
  "Tip: Don’t hoard consumables — use them when needed!",
  "Fun Fact: GLaDOS from Portal was voiced by an opera singer.",
  "“You must defeat Sheng Long to stand a chance.” – Street Fighter II",
  "Tip: Playing with a friend makes horror games less scary (sometimes).",
  "Fun Fact: The Sims let you remove pool ladders to trap Sims.",
  "“You're pretty good.” – Metal Gear Solid",
  "Tip: Watching speedruns can teach advanced tricks and skips.",
  "Fun Fact: The rarest video game is “Nintendo World Championships 1990.”",
  "“There is no knowledge that is not power.” – Mortal Kombat",
  "Tip: Try inverted controls if you’re having trouble aiming.",
  "Fun Fact: Yoshi was originally supposed to appear in Super Mario Bros. 3.",
  "“Rip and tear!” – DOOM",
  "Tip: Replaying old favorites can remind you why you love gaming.",
  "Fun Fact: The first video game Easter egg was in *Adventure* (1980).",
  "“Prepare for unforeseen consequences.” – Half-Life",
  "Tip: Don’t rush the endgame — enjoy the journey.",
  "Fun Fact: Portal 2's ending song, “Want You Gone,” is a sequel to “Still Alive.”",
  "“I am the law.” – Judge Dredd (from numerous games)",
  "Tip: Use stealth when possible — it's often safer than direct combat.",
  "Fun Fact: “GoldenEye 007” was almost canceled mid-development.",
  "“It’s super effective!” – Pokémon",
  "Tip: Use difficulty sliders to tailor the challenge to your mood.",
  "Fun Fact: The first female gaming protagonist was Ms. Pac-Man.",
  "“The right man in the wrong place can make all the difference.” – Half-Life 2",
  "Tip: Use the map frequently — it’s your best tool in open-world games.",
  "Fun Fact: The GameCube could connect to the Game Boy Advance for bonus features.",
  "“I will never forgive you!” – Tales of Symphonia",
  "Tip: Use companion AI commands to control the battlefield better.",
  "Fun Fact: Street Fighter II had more than 30 official versions.",
  "“Shall we dance?” – Bayonetta",
  "Tip: Try remapping shoulder buttons if your hands get tired.",
  "Fun Fact: Sonic’s original name was “Mr. Needlemouse.”",
  "“You're gonna carry that weight.” – Cowboy Bebop game reference",
  "Tip: Try using a walkthrough only after you're stuck for 30+ minutes.",
  "Fun Fact: The Xbox 360 “Red Ring of Death” cost Microsoft over $1 billion.",
  "“Justice rains from above!” – Overwatch",
  "Tip: Toggle aim-assist if you're struggling or too good.",
  "Fun Fact: The first gaming magazine was “Computer and Video Games” in 1981.",
  "“Let the hunt begin.” – Bloodborne",
  "Tip: Play with subtitles in languages you want to learn — great practice!",
  "Fun Fact: Animal Crossing’s characters speak a sped-up version of Japanese syllables.",
  "“The weak lose and the strong win. Which are you?” – Tekken",
  "Tip: Try gaming with a standing desk — great for posture!",
  "Fun Fact: Minecraft’s creepers were a coding error.",
  "“Victory is mine!” – Various games",
  "Tip: Learn combos in fighting games one step at a time.",
  "Fun Fact: There’s a full version of Pac-Man hidden in Google Search.",
  "“Time to tip the scales!” – Fire Emblem: Awakening",
  "Tip: Clean your controller and mouse regularly for better accuracy.",
  "Fun Fact: The word “Nintendo” roughly means “Leave luck to heaven.”",
  "“I never asked for this.” – Deus Ex",
  "Tip: Use vibration feedback to improve rhythm in racing and music games.",
  "Fun Fact: Link is left-handed in most classic Zelda games.",
  "“Let’s rock!” – Guilty Gear",
  "Tip: Keyboard shortcuts in menus speed up inventory management.",
  "Fun Fact: Metal Gear Solid was originally a 2D NES game.",
  "“So long, Bowser!” – Mario 64",
  "Tip: Back up your save files — cloud saves aren’t always reliable.",
  "Fun Fact: Halo was originally a Mac exclusive before Microsoft bought Bungie.",
  "“We do what we must because we can.” – Portal",
  "Tip: Turn on streamer mode to avoid DMCA music strikes.",
  "Fun Fact: The Witcher series is based on Polish fantasy novels.",
  "“Your princess is in another castle.” – Super Mario Bros.",
  "Tip: Use your mini-map — it’s there for a reason!",
  "Fun Fact: In Japan, the SNES is called the Super Famicom.",
  "“Don’t blink.” – Five Nights at Freddy’s homage",
  "Tip: Disable depth of field for clearer visuals in some games.",
  "Fun Fact: The Game Boy Camera could take actual photos in 1998.",
  "“No one man should have all that power.” – Saints Row",
  "Tip: Create loadouts for different playstyles.",
  "Fun Fact: Mass Effect 3’s ending sparked one of the biggest fan backlashes ever.",
  "“All your base are belong to us.” – Zero Wing",
  "Tip: Tweak gamma settings if the game is too dark.",
  "Fun Fact: There’s a working calculator built in Minecraft using redstone."
];

let lastMessageIndex = -2;

function showRandomMessage() {
  const msgBox = document.getElementById('randomMessage');
  let idx;
  do {
    idx = Math.floor(Math.random() * gamingMessages.length);
  } while (gamingMessages.length > 1 && idx === lastMessageIndex);
  lastMessageIndex = idx;
  const msg = gamingMessages[idx];
  msgBox.textContent = msg;
  msgBox.classList.remove('d-none');
  // Trigger reflow to restart animation if needed
  void msgBox.offsetWidth;
  msgBox.classList.add('show');
  setTimeout(() => {
    msgBox.classList.remove('show');
    setTimeout(() => msgBox.classList.add('d-none'), 500);
  }, 6000); // 6 seconds
}


// mobile full screen PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('service-worker.js');
  });
}