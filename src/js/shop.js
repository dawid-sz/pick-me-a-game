(function () {
  const SHOP_ITEMS = [
    {
      id: "theme_arcade",
      name: "Arcade Nights",
      cost: 45,
      description: "Neon blue-purple gradient theme.",
      type: "theme",
      value: "pmag-theme-arcade",
    },
    {
      id: "theme_sunset",
      name: "Sunset Run",
      cost: 45,
      description: "Warm dusk style for long sessions.",
      type: "theme",
      value: "pmag-theme-sunset",
    },
    {
      id: "theme_ice",
      name: "Ice Byte",
      cost: 35,
      description: "Clean cool light theme variant.",
      type: "theme",
      value: "pmag-theme-ice",
    },
  ];

  const OWNED_KEY = "pmag_ownedCosmetics";
  const ACTIVE_THEME_KEY = "pmag_activeCosmeticTheme";

  const modal = document.getElementById("shopModal");
  const openBtn = document.getElementById("openShopBtn");
  const closeBtn = document.getElementById("closeShopBtn");
  const grid = document.getElementById("shopItems");

  if (!modal || !openBtn || !closeBtn || !grid) return;

  function getOwned() {
    try {
      const raw = JSON.parse(localStorage.getItem(OWNED_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (_err) {
      return [];
    }
  }

  function setOwned(ids) {
    localStorage.setItem(OWNED_KEY, JSON.stringify(ids));
  }

  function getCoins() {
    return parseInt(localStorage.getItem("userCoins") || "0", 10) || 0;
  }

  function setCoins(value) {
    localStorage.setItem("userCoins", String(Math.max(0, value)));
    if (typeof window.syncUserCoinsFromStorage === "function") {
      window.syncUserCoinsFromStorage();
    }
    if (typeof window.renderCoinDisplay === "function") {
      window.renderCoinDisplay();
    }
  }

  function removeThemeClasses() {
    document.body.classList.remove("pmag-theme-arcade", "pmag-theme-sunset", "pmag-theme-ice");
  }

  function applyActiveTheme() {
    const themeClass = localStorage.getItem(ACTIVE_THEME_KEY);
    removeThemeClasses();
    if (themeClass) {
      document.body.classList.add(themeClass);
    }
  }

  function applyThemeCosmetic(item) {
    if (!item || item.type !== "theme") return;
    localStorage.setItem(ACTIVE_THEME_KEY, item.value);
    applyActiveTheme();
  }

  function buyItem(itemId) {
    const item = SHOP_ITEMS.find((x) => x.id === itemId);
    if (!item) return;

    const owned = getOwned();
    if (owned.includes(item.id)) {
      applyThemeCosmetic(item);
      if (typeof window.showSystemNotice === "function") {
        window.showSystemNotice(`Applied ${item.name}.`, "success", 2000);
      }
      renderShop();
      return;
    }

    const coins = getCoins();
    if (coins < item.cost) {
      if (typeof window.showSystemNotice === "function") {
        window.showSystemNotice(`Need ${item.cost - coins} more coins.`, "warning", 2200);
      }
      return;
    }

    setCoins(coins - item.cost);
    owned.push(item.id);
    setOwned(owned);
    applyThemeCosmetic(item);

    if (typeof window.showSystemNotice === "function") {
      window.showSystemNotice(`Unlocked ${item.name}!`, "success", 2200);
    }

    renderShop();
  }

  function renderShop() {
    const owned = getOwned();
    const coins = getCoins();

    grid.innerHTML = "";
    SHOP_ITEMS.forEach((item) => {
      const isOwned = owned.includes(item.id);
      const card = document.createElement("div");
      card.className = `shop-item ${isOwned ? "owned" : ""}`;

      card.innerHTML = `
        <h6>${item.name}</h6>
        <div class="small mb-2">${item.description}</div>
        <div class="cost mb-2">${item.cost} coins</div>
        <button class="btn btn-sm ${isOwned ? "btn-success" : "btn-outline-light"}">
          ${isOwned ? "Apply" : "Buy"}
        </button>
      `;

      const button = card.querySelector("button");
      button.disabled = !isOwned && coins < item.cost;
      button.addEventListener("click", function () {
        buyItem(item.id);
      });

      grid.appendChild(card);
    });
  }

  openBtn.addEventListener("click", function () {
    modal.classList.remove("d-none");
    renderShop();
  });

  closeBtn.addEventListener("click", function () {
    modal.classList.add("d-none");
  });

  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.classList.add("d-none");
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    applyActiveTheme();
    renderShop();
  });
})();
