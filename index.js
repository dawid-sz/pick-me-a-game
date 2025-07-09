let games = [];
let lastPickedIndex = -1;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("addGameForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const title = document.getElementById("gameTitle").value.trim();
    const platform = document.getElementById("gamePlatform").value.trim();
    const mode = document.getElementById("gameMode").value;
    const time = parseInt(document.getElementById("gameTime").value) || 0;

    if (title) {
      games.push({ title, platform, mode, time });
      saveGames();
      this.reset();
      renderGames();
    }
  });

  document.getElementById("excludeLast").checked = false;
  document.getElementById("onlySP").checked = false;
  document.getElementById("onlyMP").checked = false;

  renderGames();
});

function renderGames() {
  const list = document.getElementById("gameList");
  list.innerHTML = "";

  games.forEach((game, index) => {
    const li = document.createElement("li");
    li.className = "list-group-item";

    li.innerHTML = `
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-start gap-2">
        <div class="flex-fill" id="gameDisplay-${index}">
          <strong>${game.title}</strong> (${game.platform}) — <em>${game.mode}</em><br />
          <small>Time played: ${game.time} hrs</small>
        </div>

        <div class="btn-group mt-2 mt-md-0">
          <button class="btn btn-sm btn-outline-secondary" onclick="editGame(${index})">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deleteGame(${index})">🗑</button>
        </div>
      </div>
    `;

    list.appendChild(li);
  });
}

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
  games.splice(index, 1);
  saveGames();
  renderGames();
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

function filterGames() {
  const onlySP = document.getElementById("onlySP").checked;
  const onlyMP = document.getElementById("onlyMP").checked;

  return games.filter((g) => {
    if (onlySP && g.mode !== "Singleplayer") return false;
    if (onlyMP && g.mode !== "Multiplayer") return false;
    return true;
  });
}