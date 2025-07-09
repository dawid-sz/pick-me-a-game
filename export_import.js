// Save to localStorage
function saveGames() {
  localStorage.setItem("gameList", JSON.stringify(games));
}

// Load from localStorage and clean up broken entries
function loadGames() {
  try {
    const saved = localStorage.getItem("gameList");
    if (!saved) return;

    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      games = parsed.filter(
        g => g && g.title && g.platform && g.mode && Number.isFinite(g.time)
      );
      renderGames(); // <-- fixed: use correct function name
    }
  } catch (err) {
    console.error("Failed to load game list:", err);
  }
}

// Export as JSON
function exportGames() {
  const dataStr = JSON.stringify(games, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "game-list.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Import from JSON
function importGames(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error("Invalid format");

      const validGames = imported.filter(
        g => g && g.title && g.platform && g.mode && Number.isFinite(g.time)
      );
      games = validGames;
      saveGames();
      renderGames(); // <-- fixed
      alert("Game list imported successfully!");
    } catch (err) {
      console.error(err);
      alert("Error parsing JSON file!");
    }
  };
  reader.readAsText(file);
}

// Attach events
document.getElementById("exportBtn").addEventListener("click", exportGames);
document.getElementById("importBtn").addEventListener("click", () => {
  document.getElementById("importFile").click();
});
document.getElementById("importFile").addEventListener("change", importGames);

// Run once on load
window.addEventListener("load", loadGames);