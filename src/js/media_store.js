(function () {
  const DB_NAME = "pmag-media-db";
  const DB_VERSION = 1;
  const STORE_NAME = "media";
  const REF_PREFIX = "idbmedia:";

  let dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function (event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function () {
        reject(request.error);
      };
    });

    return dbPromise;
  }

  function isReference(value) {
    return typeof value === "string" && value.startsWith(REF_PREFIX);
  }

  function getKeyFromReference(value) {
    if (!isReference(value)) return "";
    return value.slice(REF_PREFIX.length);
  }

  async function putMedia(value) {
    if (typeof value !== "string" || !value) return "";

    const db = await openDb();
    const key = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(value, key);

      tx.oncomplete = function () {
        resolve();
      };
      tx.onerror = function () {
        reject(tx.error);
      };
    });

    return `${REF_PREFIX}${key}`;
  }

  async function resolveMediaReference(value) {
    if (!isReference(value)) {
      return value;
    }

    const key = value.slice(REF_PREFIX.length);
    if (!key) return "";

    const db = await openDb();

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = function () {
        resolve(typeof request.result === "string" ? request.result : "");
      };
      request.onerror = function () {
        resolve("");
      };
    });
  }

  async function prepareMediaReference(value) {
    if (typeof value !== "string" || !value) return "";
    if (isReference(value)) return value;

    if (value.startsWith("data:image")) {
      return putMedia(value);
    }

    return value;
  }

  async function prepareStateForImport(state) {
    if (!state || typeof state !== "object") return state;

    const next = {
      ...state,
      games: Array.isArray(state.games) ? [...state.games] : [],
      completedGames: Array.isArray(state.completedGames) ? [...state.completedGames] : [],
    };

    next.games = await Promise.all(next.games.map(async (game) => ({
      ...game,
      cover: await prepareMediaReference(game.cover || ""),
    })));

    next.completedGames = await Promise.all(next.completedGames.map(async (game) => ({
      ...game,
      cover: await prepareMediaReference(game.cover || ""),
    })));

    if (typeof next.pmag_avatar === "string") {
      next.pmag_avatar = await prepareMediaReference(next.pmag_avatar);
    }

    return next;
  }

  async function materializeStateForExport(state) {
    if (!state || typeof state !== "object") return state;

    const next = {
      ...state,
      games: Array.isArray(state.games) ? [...state.games] : [],
      completedGames: Array.isArray(state.completedGames) ? [...state.completedGames] : [],
    };

    next.games = await Promise.all(next.games.map(async (game) => ({
      ...game,
      cover: await resolveMediaReference(game.cover || ""),
    })));

    next.completedGames = await Promise.all(next.completedGames.map(async (game) => ({
      ...game,
      cover: await resolveMediaReference(game.cover || ""),
    })));

    if (typeof next.pmag_avatar === "string") {
      next.pmag_avatar = await resolveMediaReference(next.pmag_avatar);
    }

    return next;
  }

  async function migrateExistingLocalStorageMedia() {
    const gameList = JSON.parse(localStorage.getItem("gameList") || "[]");
    const completed = JSON.parse(localStorage.getItem("completedGames") || "[]");
    const avatar = localStorage.getItem("pmag_avatar") || "";

    let changed = false;

    const nextGames = await Promise.all((Array.isArray(gameList) ? gameList : []).map(async (game) => {
      const nextCover = await prepareMediaReference(game.cover || "");
      if (nextCover !== (game.cover || "")) changed = true;
      return { ...game, cover: nextCover };
    }));

    const nextCompleted = await Promise.all((Array.isArray(completed) ? completed : []).map(async (game) => {
      const nextCover = await prepareMediaReference(game.cover || "");
      if (nextCover !== (game.cover || "")) changed = true;
      return { ...game, cover: nextCover };
    }));

    const nextAvatar = await prepareMediaReference(avatar);
    if (nextAvatar !== avatar) changed = true;

    if (changed) {
      localStorage.setItem("gameList", JSON.stringify(nextGames));
      localStorage.setItem("completedGames", JSON.stringify(nextCompleted));
      if (nextAvatar) {
        localStorage.setItem("pmag_avatar", nextAvatar);
      }
    }

    return { changed };
  }

  async function cleanupOrphans(referenceSet) {
    const db = await openDb();
    const keepKeys = new Set();

    if (referenceSet && typeof referenceSet.forEach === "function") {
      referenceSet.forEach((ref) => {
        const key = getKeyFromReference(ref);
        if (key) keepKeys.add(key);
      });
    }

    const keys = await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAllKeys();
      req.onsuccess = function () {
        resolve(Array.isArray(req.result) ? req.result : []);
      };
      req.onerror = function () {
        resolve([]);
      };
    });

    const toDelete = keys.filter((key) => !keepKeys.has(String(key)));
    if (!toDelete.length) return;

    await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      toDelete.forEach((key) => store.delete(key));
      tx.oncomplete = function () {
        resolve();
      };
      tx.onerror = function () {
        resolve();
      };
    });
  }

  window.MediaStore = {
    isReference,
    getKeyFromReference,
    resolveMediaReference,
    prepareMediaReference,
    prepareStateForImport,
    materializeStateForExport,
    migrateExistingLocalStorageMedia,
    cleanupOrphans,
  };
})();
