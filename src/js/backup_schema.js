// Backup schema and import validation helpers.
(function () {
  const SCHEMA_VERSION = 1;
  const APP_ID = "pick-me-a-game";
  const BACKUP_INDEX_KEY = "pmag_preImportBackups";
  const MAX_PREIMPORT_BACKUPS = 3;

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function safeString(value, fallback = "") {
    return typeof value === "string" ? value : fallback;
  }

  function safeNumber(value, fallback = 0) {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

  function normalizeGame(game) {
    const input = game && typeof game === "object" ? game : {};
    return {
      title: safeString(input.title).trim(),
      platform: safeString(input.platform),
      mode: input.mode === "Multiplayer" ? "Multiplayer" : "Singleplayer",
      time: safeNumber(input.time, 0),
      cover: safeString(input.cover),
      addedAt: input.addedAt || new Date().toISOString(),
    };
  }

  function normalizeCompletedGame(game) {
    const normalized = normalizeGame(game);
    normalized.rating = Math.max(1, Math.min(5, safeNumber(game && game.rating, 0))) || null;
    normalized.notes = safeString(game && game.notes);
    normalized.completedAt = (game && game.completedAt) || new Date().toISOString();
    return normalized;
  }

  function normalizeGoal(goal) {
    const allowedTypes = new Set(["completed", "sessions", "trophies", "picker"]);
    const input = goal && typeof goal === "object" ? goal : {};
    const type = safeString(input.type);

    return {
      type: allowedTypes.has(type) ? type : "completed",
      target: Math.max(1, safeNumber(input.target, 1)),
      deadline: input.deadline ? safeString(input.deadline) : null,
      progress: Math.max(0, safeNumber(input.progress, 0)),
      createdAt: input.createdAt || new Date().toISOString(),
    };
  }

  function normalizeState(inputState) {
    const state = inputState && typeof inputState === "object" ? inputState : {};
    return {
      games: safeArray(state.games).map(normalizeGame).filter((g) => g.title),
      completedGames: safeArray(state.completedGames).map(normalizeCompletedGame).filter((g) => g.title),
      lastPickedIndex: Number.isInteger(state.lastPickedIndex) ? state.lastPickedIndex : -1,
      theme: safeString(state.theme, "light"),
      skipDeleteConfirmation: !!state.skipDeleteConfirmation,
      unlockedAchievements: safeArray(state.unlockedAchievements),
      daysUsed: safeArray(state.daysUsed),
      pmag_nickname: safeString(state.pmag_nickname),
      pmag_avatar: safeString(state.pmag_avatar),
      goals: safeArray(state.goals).map(normalizeGoal),
    };
  }

  function wrapExportState(state) {
    return {
      appId: APP_ID,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data: normalizeState(state),
    };
  }

  function validateImportState(raw) {
    const errors = [];
    let candidate = raw;

    if (!candidate || typeof candidate !== "object") {
      return { valid: false, errors: ["Backup root must be a JSON object."], state: null };
    }

    if (candidate.data && typeof candidate.data === "object") {
      if (candidate.appId && candidate.appId !== APP_ID) {
        errors.push("Backup appId does not match Pick Me a Game.");
      }

      if (typeof candidate.schemaVersion !== "number") {
        errors.push("Backup schemaVersion is missing or invalid.");
      }

      candidate = candidate.data;
    }

    const state = normalizeState(candidate);

    if (!Array.isArray(candidate.games) && !Array.isArray(candidate.completedGames)) {
      errors.push("Backup missing required game arrays.");
    }

    return {
      valid: errors.length === 0,
      errors,
      state,
    };
  }

  function getBackupIndex() {
    try {
      const raw = JSON.parse(localStorage.getItem(BACKUP_INDEX_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (_err) {
      return [];
    }
  }

  function setBackupIndex(index) {
    localStorage.setItem(BACKUP_INDEX_KEY, JSON.stringify(index));
  }

  function createPreImportBackup(currentState) {
    const timestamp = Date.now();
    const key = `pmag_preImportBackup_${timestamp}`;
    const payload = wrapExportState(currentState);
    localStorage.setItem(key, JSON.stringify(payload));

    const index = getBackupIndex();
    index.unshift(key);

    while (index.length > MAX_PREIMPORT_BACKUPS) {
      const staleKey = index.pop();
      localStorage.removeItem(staleKey);
    }

    setBackupIndex(index);
    return key;
  }

  function getLatestPreImportBackup() {
    const index = getBackupIndex();
    if (!index.length) return null;

    const key = index[0];
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      const validated = validateImportState(parsed);
      return validated.valid ? validated.state : null;
    } catch (_err) {
      return null;
    }
  }

  window.BackupSchema = {
    SCHEMA_VERSION,
    wrapExportState,
    validateImportState,
    createPreImportBackup,
    getLatestPreImportBackup,
  };
})();
