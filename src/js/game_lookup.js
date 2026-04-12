(function () {
  const API_URL = "https://www.cheapshark.com/api/1.0/games?limit=8&title=";
  const CACHE_KEY = "pmag_gameSearchCache_v1";
  const CACHE_TTL_MS = 1000 * 60 * 60 * 12;

  const titleInput = document.getElementById("gameTitle");
  const searchBtn = document.getElementById("searchGameBtn");
  const resultsList = document.getElementById("gameSearchResults");
  const coverUrlInput = document.getElementById("gameCoverUrl");
  const qualityInput = document.getElementById("coverQuality");

  if (!titleInput || !searchBtn || !resultsList || !coverUrlInput) return;

  let searchAbortController = null;

  function loadCache() {
    try {
      const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
      return raw && typeof raw === "object" ? raw : {};
    } catch (_err) {
      return {};
    }
  }

  function saveCache(cache) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  }

  function getCachedResult(query) {
    const cache = loadCache();
    const entry = cache[query.toLowerCase()];
    if (!entry) return null;
    if (Date.now() - entry.savedAt > CACHE_TTL_MS) return null;
    return Array.isArray(entry.items) ? entry.items : null;
  }

  function setCachedResult(query, items) {
    const cache = loadCache();
    cache[query.toLowerCase()] = {
      savedAt: Date.now(),
      items,
    };
    saveCache(cache);
  }

  function getPreferredCover(item) {
    const quality = qualityInput ? qualityInput.value : "high";
    if (quality === "high" && item && item.steamAppID && /^\d+$/.test(String(item.steamAppID))) {
      return `https://cdn.cloudflare.steamstatic.com/steam/apps/${item.steamAppID}/header.jpg`;
    }
    return item && item.thumb ? item.thumb : "";
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function pullCoverData(url) {
    if (!url || !url.startsWith("http")) return "";

    try {
      const response = await fetch(url);
      if (!response.ok) return url;
      const blob = await response.blob();
      if (!blob || !blob.type.startsWith("image/")) return url;

      // Keep payload size under control for localStorage.
      if (blob.size > 800000) return url;

      const dataUrl = await blobToDataUrl(blob);
      return typeof dataUrl === "string" ? dataUrl : url;
    } catch (_err) {
      return url;
    }
  }

  function clearResults() {
    resultsList.classList.add("d-none");
    resultsList.innerHTML = "";
  }

  function renderResults(items) {
    resultsList.innerHTML = "";

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "list-group-item small text-muted";
      empty.textContent = "No matches found. You can still add the game manually.";
      resultsList.appendChild(empty);
      resultsList.classList.remove("d-none");
      return;
    }

    items.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "list-group-item list-group-item-action d-flex align-items-center gap-2";

      const thumb = getPreferredCover(item) || "src/img/placeholder_cover.png";
      const name = item.external || "Unknown Title";

      button.innerHTML = `
        <img src="${thumb}" alt="${name}" style="width:32px;height:44px;object-fit:cover;border-radius:4px;" />
        <span>${name}</span>
      `;

      button.addEventListener("click", async function () {
        titleInput.value = name;
        coverUrlInput.value = thumb;

        if (typeof window.showSystemNotice === "function") {
          window.showSystemNotice("Pulling cover image...", "info", 1200);
        }

        const pulledCover = await pullCoverData(thumb);
        coverUrlInput.value = pulledCover || thumb;
        clearResults();

        if (typeof window.showSystemNotice === "function") {
          window.showSystemNotice("Game title and cover selected.", "success", 1800);
        }
      });

      resultsList.appendChild(button);
    });

    resultsList.classList.remove("d-none");
  }

  async function searchGames() {
    const query = titleInput.value.trim();
    if (!query) {
      clearResults();
      return;
    }

    const cached = getCachedResult(query);
    if (cached) {
      renderResults(cached);
      return;
    }

    if (searchAbortController) {
      searchAbortController.abort();
    }

    searchAbortController = new AbortController();

    try {
      const response = await fetch(`${API_URL}${encodeURIComponent(query)}`, {
        signal: searchAbortController.signal,
      });

      if (!response.ok) {
        throw new Error("Search request failed");
      }

      const data = await response.json();
      const items = Array.isArray(data) ? data : [];
      setCachedResult(query, items);
      renderResults(items);
    } catch (error) {
      if (error.name === "AbortError") return;
      clearResults();
      if (typeof window.showSystemNotice === "function") {
        window.showSystemNotice("Search unavailable right now. You can still add manually.", "warning", 2600);
      }
    }
  }

  searchBtn.addEventListener("click", searchGames);

  titleInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      searchGames();
    }
  });

  document.addEventListener("click", function (event) {
    if (!resultsList.contains(event.target) && event.target !== titleInput && event.target !== searchBtn) {
      clearResults();
    }
  });
})();
