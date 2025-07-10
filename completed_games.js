let finishedGames = JSON.parse(localStorage.getItem("finishedGameList")) || [];
let completedGames = JSON.parse(localStorage.getItem("completedGames")) || [];



// Render Completed Games List
function renderFinishedGames() {
  const list = document.getElementById("finishedGameList");
  list.innerHTML = "";

  finishedGames.forEach((game, index) => {
    const li = document.createElement("li");
    li.className = "list-group-item list-group-item-success d-flex justify-content-between align-items-center";
    li.innerHTML = `
      <span><strong>${game.title}</strong> (${game.platform}) — <em>${game.mode}</em><br>
      <small>Time played: ${game.time} hrs</small></span>
      <button class="btn btn-sm btn-outline-secondary" onclick="unmarkCompleted(${index})">↩️ Undo</button>
    `;
    list.appendChild(li);
  });
}

function renderCompletedGames() {
  const finishedList = document.getElementById("finishedGameList");
  finishedList.innerHTML = "";

  completedGames.forEach((game, index) => {
    const li = document.createElement("li");
    li.className = "list-group-item list-group-item-success d-flex justify-content-between align-items-center";

    li.innerHTML = `
      <div>
        <strong>${game.title}</strong> (${game.platform}) - ${game.mode}
        ${game.time ? `<br><small class="text-muted">Time played: ${game.time} hrs</small>` : ""}
      </div>
      <button class="btn btn-sm btn-outline-warning restore-btn" data-index="${index}">↩️ Restore</button>
    `;

    finishedList.appendChild(li);
  });

  // Attach event listeners to all restore buttons
document.querySelectorAll('.restore-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const index = parseInt(btn.getAttribute('data-index'), 10);
    unmarkCompleted(index);
  });
});
}

// Mark a Game as Completed
function markCompleted(index) {
  const game = games.splice(index, 1)[0];

  if (!confirm(`Mark "${game.title}" as completed?`)) {
    games.splice(index, 0, game); // put it back
    return;
  }

  completedGames.push(game);
  saveGames();
  saveCompletedGames();
  renderGames();
  renderCompletedGames();
}

function saveCompletedGames() {
  localStorage.setItem("completedGames", JSON.stringify(completedGames));
}


// Unmark a Completed Game
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

// Save Both Lists
function saveGames() {
  localStorage.setItem("gameList", JSON.stringify(games));
  localStorage.setItem("finishedGameList", JSON.stringify(finishedGames));
}

// Update renderGames to include "Completed" button
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
          <button class="btn btn-sm btn-success" onclick="markCompleted(${index})">✅</button>
          <button class="btn btn-sm btn-danger" onclick="deleteGame(${index})">🗑</button>
        </div>
      </div>
    `;

    list.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderCompletedGames();
});