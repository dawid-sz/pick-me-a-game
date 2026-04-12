// --- Data ---
let games = JSON.parse(localStorage.getItem("gameList") || "[]");
let completedGames = JSON.parse(localStorage.getItem("completedGames") || "[]");
let lastPickedIndex = -1;
let goalsCompleted = parseInt(localStorage.getItem("goalsCompleted") || "0");
let userCoins = parseInt(localStorage.getItem("userCoins") || "0", 10);
if (!Number.isFinite(userCoins)) {
  userCoins = 0;
  localStorage.setItem("userCoins", "0");
}
let pickHistory = parseStorageArray("pmag_pickHistory");
let mediaCleanupTimer = null;
let weeklyChallenge = null;
let noticeTimer = null;
let lastSyncNoticeAt = 0;

const WEEKLY_CHALLENGE_KEY = "pmag_weeklyChallenge";
const PICK_HISTORY_KEY = "pmag_pickHistory";
const PICK_HISTORY_LIMIT = 5;

const SYNC_KEYS = new Set([
  "gameList",
  "completedGames",
  "theme",
  "pmag_nickname",
  "pmag_avatar",
  "goalsList",
  "unlockedAchievements",
  "userCoins",
]);

function parseStorageArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}

function showSystemNotice(message, tone = "info", duration = 3500) {
  const el = document.getElementById("appSystemNotice");
  if (!el) return;

  el.classList.remove("d-none", "alert-info", "alert-warning", "alert-success");
  el.classList.add(`alert-${tone}`);
  el.textContent = message;

  if (noticeTimer) {
    clearTimeout(noticeTimer);
    noticeTimer = null;
  }

  if (duration > 0) {
    noticeTimer = setTimeout(() => {
      el.classList.add("d-none");
    }, duration);
  }
}

window.showSystemNotice = showSystemNotice;

function renderCoinDisplay() {
  const coinCount = document.getElementById("coinCount");
  if (!coinCount) return;
  coinCount.textContent = Number.isFinite(userCoins) ? userCoins : 0;
}

function syncUserCoinsFromStorage() {
  const parsed = parseInt(localStorage.getItem("userCoins") || "0", 10);
  userCoins = Number.isFinite(parsed) ? parsed : 0;
}

function saveCoins() {
  setLocalStorageSafe("userCoins", String(userCoins), "Coins could not be saved because storage is full.");
}

function addCoins(amount, reason) {
  if (!Number.isFinite(amount) || amount <= 0) return;

  if (!Number.isFinite(userCoins)) {
    userCoins = parseInt(localStorage.getItem("userCoins") || "0", 10);
    if (!Number.isFinite(userCoins)) userCoins = 0;
  }

  const now = Date.now();
  if (reason === "picker") {
    const lastPickerCoin = parseInt(localStorage.getItem("pmag_lastPickerCoinAt") || "0", 10);
    if (now - lastPickerCoin < 8000) return;
    localStorage.setItem("pmag_lastPickerCoinAt", String(now));
  }

  const adjustedAmount = applyWeeklyMultiplier(amount, reason);

  userCoins += adjustedAmount;
  saveCoins();
  renderCoinDisplay();
}

function awardDailyCoins() {
  const today = new Date().toDateString();
  const lastDailyReward = localStorage.getItem("pmag_lastDailyCoinDate") || "";
  if (lastDailyReward === today) return;

  localStorage.setItem("pmag_lastDailyCoinDate", today);
  addCoins(1, "daily");
  showSystemNotice("Daily reward: +1 coin", "success", 2200);
}

window.addCoins = addCoins;
window.renderCoinDisplay = renderCoinDisplay;
window.syncUserCoinsFromStorage = syncUserCoinsFromStorage;

async function updateStorageHealth() {
  if (!navigator.storage || !navigator.storage.estimate) return;

  try {
    const estimate = await navigator.storage.estimate();
    if (!estimate || !estimate.quota || !estimate.usage) return;

    const percent = Math.round((estimate.usage / estimate.quota) * 100);
    if (percent >= 90) {
      showSystemNotice(`Storage is nearly full (${percent}%). Export a backup to avoid data loss.`, "warning", 6000);
    }
  } catch (_err) {
    // Ignore estimation errors on unsupported browsers.
  }
}

function setLocalStorageSafe(key, value, fallbackMessage) {
  try {
    localStorage.setItem(key, value);
    updateStorageHealth();
    return true;
  } catch (err) {
    if (err && (err.name === "QuotaExceededError" || err.code === 22)) {
      showSystemNotice(fallbackMessage || "Storage is full. Export backup and remove large images.", "warning", 7000);
      return false;
    }
    throw err;
  }
}

function syncCoreStateFromStorage() {
  games = parseStorageArray("gameList");
  completedGames = parseStorageArray("completedGames");
}

function savePickHistory() {
  localStorage.setItem(PICK_HISTORY_KEY, JSON.stringify(pickHistory.slice(0, PICK_HISTORY_LIMIT)));
}

function collectMediaReferences() {
  const refs = new Set();

  games.forEach((g) => {
    if (window.MediaStore && window.MediaStore.isReference(g.cover)) refs.add(g.cover);
  });
  completedGames.forEach((g) => {
    if (window.MediaStore && window.MediaStore.isReference(g.cover)) refs.add(g.cover);
  });

  const avatar = localStorage.getItem("pmag_avatar") || "";
  if (window.MediaStore && window.MediaStore.isReference(avatar)) refs.add(avatar);

  return refs;
}

function requestMediaCleanup() {
  if (!window.MediaStore || !window.MediaStore.cleanupOrphans) return;
  if (mediaCleanupTimer) clearTimeout(mediaCleanupTimer);
  mediaCleanupTimer = setTimeout(() => {
    window.MediaStore.cleanupOrphans(collectMediaReferences());
    mediaCleanupTimer = null;
  }, 800);
}

window.requestMediaCleanup = requestMediaCleanup;

function getCurrentWeekKey() {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - yearStart) / 86400000);
  const week = Math.floor(days / 7) + 1;
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function createWeeklyChallenge() {
  const templates = [
    { id: "add_game", label: "Add games", target: 4, multiplier: 1.4, bonus: 20 },
    { id: "complete_game", label: "Complete games", target: 2, multiplier: 1.8, bonus: 30 },
    { id: "picker", label: "Use picker", target: 8, multiplier: 1.5, bonus: 25 },
  ];
  const chosen = templates[Math.floor(Math.random() * templates.length)];

  return {
    weekKey: getCurrentWeekKey(),
    id: chosen.id,
    label: chosen.label,
    target: chosen.target,
    progress: 0,
    multiplier: chosen.multiplier,
    bonus: chosen.bonus,
    bonusClaimed: false,
  };
}

function loadWeeklyChallenge() {
  try {
    const parsed = JSON.parse(localStorage.getItem(WEEKLY_CHALLENGE_KEY) || "null");
    if (parsed && parsed.weekKey === getCurrentWeekKey()) {
      weeklyChallenge = parsed;
      return;
    }
  } catch (_err) {
    // ignored
  }

  weeklyChallenge = createWeeklyChallenge();
  localStorage.setItem(WEEKLY_CHALLENGE_KEY, JSON.stringify(weeklyChallenge));
}

function renderWeeklyChallenge() {
  const box = document.getElementById("weeklyChallengeBox");
  if (!box || !weeklyChallenge) return;

  const done = weeklyChallenge.progress >= weeklyChallenge.target;
  const status = done ? "Completed" : `${weeklyChallenge.progress}/${weeklyChallenge.target}`;
  const rewardText = done
    ? (weeklyChallenge.bonusClaimed ? `Weekly bonus claimed: +${weeklyChallenge.bonus} coins` : `Bonus ready: +${weeklyChallenge.bonus} coins`)
    : `Focus action coins are x${weeklyChallenge.multiplier}`;

  box.innerHTML = `
    <div class="alert ${done ? "alert-success" : "alert-primary"} mb-0">
      <div><strong>Weekly Challenge:</strong> ${weeklyChallenge.label}</div>
      <div class="small">Progress: ${status}</div>
      <div class="small">${rewardText}</div>
    </div>
  `;
}

function advanceWeeklyChallenge(reason) {
  if (!weeklyChallenge) return;
  if (weeklyChallenge.id !== reason) return;

  weeklyChallenge.progress += 1;
  const justCompleted = weeklyChallenge.progress >= weeklyChallenge.target && !weeklyChallenge.bonusClaimed;
  if (justCompleted) {
    weeklyChallenge.bonusClaimed = true;
    userCoins += weeklyChallenge.bonus;
    saveCoins();
    renderCoinDisplay();
    showSystemNotice(`Weekly challenge done! +${weeklyChallenge.bonus} coins`, "success", 2600);
  }

  localStorage.setItem(WEEKLY_CHALLENGE_KEY, JSON.stringify(weeklyChallenge));
  renderWeeklyChallenge();
}

function applyWeeklyMultiplier(amount, reason) {
  if (!weeklyChallenge || weeklyChallenge.id !== reason) return amount;
  if (weeklyChallenge.progress >= weeklyChallenge.target) return amount;
  return Math.max(1, Math.round(amount * weeklyChallenge.multiplier));
}

function getCoverImgMarkup(cover, className = "game-cover-img") {
  const placeholder = "src/img/placeholder_cover.png";
  const safeCover = typeof cover === "string" ? cover : "";
  if (!safeCover) {
    return `<img src="${placeholder}" alt="No cover" class="${className}" />`;
  }

  if (window.MediaStore && window.MediaStore.isReference(safeCover)) {
    return `<img src="${placeholder}" alt="Cover" class="${className}" data-media-ref="${safeCover}" />`;
  }

  return `<img src="${safeCover}" alt="Cover" class="${className}" />`;
}

async function hydrateMediaRefs(rootElement) {
  if (!window.MediaStore || !rootElement) return;

  const pending = rootElement.querySelectorAll("[data-media-ref]");
  for (const node of pending) {
    const ref = node.getAttribute("data-media-ref");
    if (!ref) continue;
    const resolved = await window.MediaStore.resolveMediaReference(ref);
    if (resolved) {
      if (node.tagName === "IMG") node.src = resolved;
      if (node.tagName === "INPUT") node.value = resolved;
    }
  }
}

// mobile full screen PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('service-worker.js');
  });
}

// Service Worker update prompt
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('service-worker.js').then(reg => {
      reg.onupdatefound = () => {
        const newWorker = reg.installing;
        newWorker.onstatechange = () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              showUpdatePrompt();
            }
          }
        };
      };
    });
  });
}

function showUpdatePrompt() {
  // Create a custom modal for update prompt
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div class="custom-modal-bg" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      display: flex; align-items: center; justify-content: center; z-index: 9999;">
      <div class="custom-modal-content" style="padding: 20px; max-width: 320px; text-align: center;">
        <h5>Update Available</h5>
        <p>A new version of Pick Me a Game is available.</p>
        <div class="d-flex gap-2 justify-content-center mt-3">
          <button class="btn btn-success btn-sm" id="applyUpdateBtn">Apply Update</button>
          <button class="btn btn-secondary btn-sm" id="declineUpdateBtn">Later</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('applyUpdateBtn').onclick = () => {
    window.location.reload();
  };
  document.getElementById('declineUpdateBtn').onclick = () => {
    document.body.removeChild(modal);
  };
}

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
  setLocalStorageSafe("gameList", JSON.stringify(games), "Game list could not be saved because storage is full.");
  requestMediaCleanup();
}
function saveCompletedGames() {
  setLocalStorageSafe("completedGames", JSON.stringify(completedGames), "Completed list could not be saved because storage is full.");
  requestMediaCleanup();
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
          <div class="d-flex gap-1">
            <button class="btn btn-outline-success btn-xs" onclick="quickLogSession(${index}, 0.5)">+30m</button>
            <button class="btn btn-outline-success btn-xs" onclick="quickLogSession(${index}, 1)">+1h</button>
          </div>
        </div>
        <div class="game-cover-menu">
          <div class="cover-wrapper">
                ${getCoverImgMarkup(game.cover, "game-cover-img")}
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

  hydrateMediaRefs(grid);
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
            ${getCoverImgMarkup(game.cover, "game-cover-img")}
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

  hydrateMediaRefs(grid);
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
      ${game.cover ? getCoverImgMarkup(game.cover, "game-cover-img mt-2") : ""}
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

  hydrateMediaRefs(container);

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
    reader.onload = async function(evt) {
      const value = evt.target.result;
      games[index].cover = window.MediaStore
        ? await window.MediaStore.prepareMediaReference(value)
        : value;
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

function quickLogSession(index, hours) {
  const target = games[index];
  if (!target) return;
  target.time = (parseFloat(target.time) || 0) + hours;
  saveGames();
  renderGames();
  renderStats();
  addCoins(1, "session");
}

function normalizeTitle(title) {
  return (title || "").toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
}

function findPotentialDuplicate(title) {
  const normalized = normalizeTitle(title);
  if (!normalized) return null;
  const allGames = [...games, ...completedGames];
  return allGames.find((g) => {
    const candidate = normalizeTitle(g.title);
    return candidate === normalized || candidate.includes(normalized) || normalized.includes(candidate);
  }) || null;
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
    addCoins(10, "complete_game");
    advanceWeeklyChallenge("complete_game");
    if (typeof renderGoals === "function") renderGoals();
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
  const mood = document.getElementById("moodFilter")?.value || "any";
  return games.filter((g) => {
    if (onlySP && g.mode !== "Singleplayer") return false;
    if (onlyMP && g.mode !== "Multiplayer") return false;
    if (mood === "short" && (parseFloat(g.time) || 0) > 10) return false;
    if (mood === "story" && g.mode !== "Singleplayer") return false;
    if (mood === "multiplayer" && g.mode !== "Multiplayer") return false;
    return true;
  });
}

function getMoodWeight(game) {
  const mood = document.getElementById("moodFilter")?.value || "any";
  const hours = parseFloat(game.time) || 0;
  if (mood === "short") return hours <= 5 ? 3 : 1;
  if (mood === "story") return game.mode === "Singleplayer" ? 3 : 1;
  if (mood === "multiplayer") return game.mode === "Multiplayer" ? 3 : 1;
  return 1;
}

function weightedPick(pool) {
  let total = 0;
  const weighted = pool.map((g) => {
    const w = Math.max(1, getMoodWeight(g));
    total += w;
    return { g, w };
  });

  let roll = Math.random() * total;
  for (const entry of weighted) {
    roll -= entry.w;
    if (roll <= 0) return entry.g;
  }
  return pool[pool.length - 1];
}

function pickGame() {
  const filtered = filterGames();
  if (filtered.length === 0) {
    document.getElementById("pickedGame").innerText = "No games match the selected filters.";
    return;
  }

  let options = [...filtered];
  if (document.getElementById("excludeLast").checked && filtered.length > 1) {
    options = options.filter((g) => games.indexOf(g) !== lastPickedIndex);
  }

  if (document.getElementById("avoidRecentPicks")?.checked && options.length > 1) {
    const recent = new Set(pickHistory.slice(0, PICK_HISTORY_LIMIT));
    const reduced = options.filter((g) => !recent.has((g.title || "").toLowerCase()));
    if (reduced.length) options = reduced;
  }

  const picked = weightedPick(options);
  lastPickedIndex = games.indexOf(picked);
  document.getElementById("pickedGame").innerText = `🎮 ${picked.title} (${picked.platform}) — ${picked.mode}`;

  document.getElementById('pickedGameWrapper').classList.remove('d-none');

  window._picked = true;
  checkAchievements(buildAppState());
  window._picked = false;
  showRandomMessage();
  addCoins(2, "picker");
  advanceWeeklyChallenge("picker");

  pickHistory.unshift((picked.title || "").toLowerCase());
  pickHistory = pickHistory.filter(Boolean).slice(0, PICK_HISTORY_LIMIT);
  savePickHistory();

  if (window.incrementPickerGoals) window.incrementPickerGoals();
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
document.addEventListener("DOMContentLoaded", async () => {
  if (window.MediaStore) {
    const migration = await window.MediaStore.migrateExistingLocalStorageMedia();
    if (migration.changed) {
      syncCoreStateFromStorage();
      if (typeof updateProfileDisplay === "function") updateProfileDisplay();
    }
  }

  checkAchievements(buildAppState()); // <-- Add this line FIRST
  loadWeeklyChallenge();
  renderCoinDisplay();
  awardDailyCoins();
  renderWeeklyChallenge();

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

    const duplicate = findPotentialDuplicate(title);
    if (duplicate && !confirm(`"${duplicate.title}" already exists in your library. Add anyway?`)) {
      return;
    }

    const fileInput = document.getElementById('gameCover');
    const file = fileInput.files[0];

    // Helper to actually add the game and reset form
    async function doAddGame(cover) {
      const remoteCover = document.getElementById("gameCoverUrl").value.trim();
      const rawCover = cover || remoteCover || "";
      const normalizedCover = window.MediaStore
        ? await window.MediaStore.prepareMediaReference(rawCover)
        : rawCover;
      addGame({
        title,
        platform,
        mode,
        time,
        cover: normalizedCover,
      });
      e.target.reset();
      document.getElementById("gameCoverUrl").value = "";
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
  addCoins(5, "add_game");
  advanceWeeklyChallenge("add_game");
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
      <li>Goals completed: ${goalsCompleted}</li>
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
    goals: JSON.parse(localStorage.getItem('goalsList') || '[]'),
    userCoins,
    pickHistory,
    weeklyChallenge,
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
  if (state.goals) { // <-- Add this block
    localStorage.setItem('goalsList', JSON.stringify(state.goals));
    window.goals = state.goals;
    if (typeof renderGoals === "function") renderGoals();
  }
  if (Number.isFinite(Number(state.userCoins))) {
    userCoins = Number(state.userCoins);
    saveCoins();
    renderCoinDisplay();
  }
  if (Array.isArray(state.pickHistory)) {
    pickHistory = state.pickHistory.map((x) => String(x).toLowerCase()).filter(Boolean).slice(0, PICK_HISTORY_LIMIT);
    savePickHistory();
  }
  if (state.weeklyChallenge && typeof state.weeklyChallenge === "object") {
    weeklyChallenge = state.weeklyChallenge;
    localStorage.setItem(WEEKLY_CHALLENGE_KEY, JSON.stringify(weeklyChallenge));
  }
  // Add more fields here as you add features
  saveGames();
  saveCompletedGames();
  renderGames();
  renderCompletedGames();
  renderStats && renderStats();
  renderWeeklyChallenge();
}

async function exportAppState() {
  let state = getAppState();
  if (window.MediaStore) {
    state = await window.MediaStore.materializeStateForExport(state);
  }
  const exportPayload = window.BackupSchema
    ? window.BackupSchema.wrapExportState(state)
    : state;
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {type: "application/json"});
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
  reader.onload = async function(evt) {
    try {
      const importedPayload = JSON.parse(evt.target.result);
      const validated = window.BackupSchema
        ? window.BackupSchema.validateImportState(importedPayload)
        : { valid: true, state: importedPayload, errors: [] };

      if (!validated.valid) {
        alert(`Invalid backup file:\n- ${validated.errors.join("\n- ")}`);
        return;
      }

      if (window.BackupSchema) {
        window.BackupSchema.createPreImportBackup(getAppState());
      }

      let importState = validated.state;
      if (window.MediaStore) {
        importState = await window.MediaStore.prepareStateForImport(importState);
      }

      setAppState(importState);
      alert("Backup restored!");
    } catch (err) {
      alert("Invalid backup file.");
    }
    e.target.value = "";
  };
  reader.readAsText(file);

  window._imported = true;
  checkAchievements(buildAppState());
  window._imported = false;
});

function restoreLastImportBackup() {
  if (!window.BackupSchema) {
    alert("Restore helper is unavailable in this version.");
    return;
  }

  const state = window.BackupSchema.getLatestPreImportBackup();
  if (!state) {
    alert("No pre-import backup found.");
    return;
  }

  setAppState(state);
  alert("Restored your last pre-import snapshot.");
}

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

function incrementGoalsCompleted() {
  goalsCompleted++;
  localStorage.setItem("goalsCompleted", goalsCompleted);
  renderStats();
}

window.addEventListener("storage", function (event) {
  if (!event.key || !SYNC_KEYS.has(event.key)) return;

  if (event.key === "gameList" || event.key === "completedGames") {
    syncCoreStateFromStorage();
    renderGames();
    renderCompletedGames();
    renderStats();
    if (typeof renderGoals === "function") renderGoals();
  }

  if (event.key === "theme") {
    applyTheme(localStorage.getItem("theme") || "light");
  }

  if (event.key === "pmag_nickname" || event.key === "pmag_avatar") {
    if (typeof updateProfileDisplay === "function") updateProfileDisplay();
  }

  if (event.key === "userCoins") {
    userCoins = parseInt(localStorage.getItem("userCoins") || "0", 10) || 0;
    renderCoinDisplay();
  }

  if (event.key === "goalsList" && typeof window.syncGoalsFromStorage === "function") {
    window.syncGoalsFromStorage();
  }

  const now = Date.now();
  if (now - lastSyncNoticeAt > 1200) {
    showSystemNotice("Changes synced from another tab.", "info", 2400);
    lastSyncNoticeAt = now;
  }

  updateStorageHealth();
});

document.addEventListener("DOMContentLoaded", () => {
  updateStorageHealth();
});