let games = JSON.parse(localStorage.getItem('games') || '[]');
let lastPlayed = localStorage.getItem('lastPlayed') || null;
let xp = parseInt(localStorage.getItem('xp') || '0');

function saveGames() {
localStorage.setItem('games', JSON.stringify(games));
}

function addGame() {
const name = document.getElementById('gameName').value.trim();
const type = document.getElementById('gameType').value;
if (!name) return;
games.push({ name, type });
saveGames();
renderGameList();
document.getElementById('gameName').value = '';
}

function renderGameList() {
const list = document.getElementById('gameList');
list.innerHTML = '';
games.forEach((game, i) => {
const item = document.createElement('div');
item.className = 'list-group-item d-flex justify-content-between align-items-center bg-dark text-light';
item.innerHTML = `
<div>
${game.name} <span class="tag">(${game.type})</span>
</div>
<button class="btn btn-sm btn-danger" onclick="removeGame(${i})">❌</button>
`;
list.appendChild(item);
});
}

function removeGame(index) {
games.splice(index, 1);
saveGames();
renderGameList();
}

function gainXP(amount) {
xp += amount;
localStorage.setItem('xp', xp);
updateXPDisplay();
}

function updateXPDisplay() {
const level = Math.floor(xp / 100) + 1;
document.getElementById('xpStatus').innerText = `XP: ${xp} | Level: ${level}`;
}

function pickGame() {
const exclude = document.getElementById('excludeLast').checked;
const onlySP = document.getElementById('onlySP').checked;
const onlyMP = document.getElementById('onlyMP').checked;

let filtered = games.filter(g => {
if (exclude && g.name === lastPlayed) return false;
if (onlySP && g.type !== 'singleplayer') return false;
if (onlyMP && g.type !== 'multiplayer') return false;
return true;
});

const output = document.getElementById('pickedGame');

if (filtered.length === 0) {
output.innerText = 'No valid game found.';
return;
}

const pick = filtered[Math.floor(Math.random() * filtered.length)];
lastPlayed = pick.name;
localStorage.setItem('lastPlayed', lastPlayed);
output.innerText = `Play: ${pick.name}`;
gainXP(10);
}

function pickTwoGames() {
const exclude = document.getElementById('excludeLast').checked;
const onlySP = document.getElementById('onlySP').checked;
const onlyMP = document.getElementById('onlyMP').checked;

let filtered = games.filter(g => {
if (exclude && g.name === lastPlayed) return false;
if (onlySP && g.type !== 'singleplayer') return false;
if (onlyMP && g.type !== 'multiplayer') return false;
return true;
});

const output = document.getElementById('pickedGame');

if (filtered.length < 2) {
output.innerText = 'Not enough games to suggest two.';
return;
}

filtered = filtered.sort(() => 0.5 - Math.random());
const picks = filtered.slice(0, 2);
output.innerText = `Options: ${picks[0].name} OR ${picks[1].name}`;
gainXP(5);
}

renderGameList();
updateXPDisplay();