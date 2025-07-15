const ACHIEVEMENTS = [
  { id: 'first_game_added', name: 'First Game Added', desc: 'Add your first game', check: state => state.games.length >= 1 },
  { id: 'first_game_completed', name: 'First Game Completed', desc: 'Complete your first game', check: state => state.completed.length >= 1 },
  { id: 'ten_games_added', name: '10 Games Added', desc: 'Add 10 games', check: state => state.games.length >= 10 },
  { id: 'twentyfive_games_added', name: '25 Games Added', desc: 'Add 25 games', check: state => state.games.length >= 25 },
  { id: 'fifty_games_added', name: '50 Games Added', desc: 'Add 50 games', check: state => state.games.length >= 50 },
  { id: 'ten_games_completed', name: '10 Games Completed', desc: 'Complete 10 games', check: state => state.completed.length >= 10 },
  { id: 'twentyfive_games_completed', name: '25 Games Completed', desc: 'Complete 25 games', check: state => state.completed.length >= 25 },
  { id: 'fifty_games_completed', name: '50 Games Completed', desc: 'Complete 50 games', check: state => state.completed.length >= 50 },
  { id: 'first_multiplayer', name: 'First Multiplayer Game', desc: 'Add your first multiplayer game', check: state => state.games.some(g => g.mode === 'Multiplayer') },
  { id: 'first_singleplayer', name: 'First Singleplayer Game', desc: 'Add your first singleplayer game', check: state => state.games.some(g => g.mode === 'Singleplayer') },
  { id: 'first_custom_cover', name: 'First Custom Cover', desc: 'Add a game with a custom cover image', check: state => state.games.some(g => g.cover) },
  { id: 'first_backup_export', name: 'First Backup Exported', desc: 'Export your app backup', check: state => state.exported },
  { id: 'first_backup_import', name: 'First Backup Imported', desc: 'Import a backup', check: state => state.imported },
  { id: 'first_game_picked', name: 'First Game Picked', desc: 'Use the "Pick a Game" feature', check: state => state.picked },
  { id: 'first_game_shared', name: 'First Game Shared', desc: 'Share a picked game as image or text', check: state => state.shared },
  { id: 'night_owl', name: 'Night Owl', desc: 'Use the app in dark mode', check: state => state.darkMode },
  { id: 'completionist', name: 'Completionist', desc: 'Complete all games in your list', check: state => state.games.length > 0 && state.completed.length === state.games.length },
  { id: 'backlog_buster', name: 'Backlog Buster', desc: 'Mark 5 games as completed in one day', check: state => state.completedToday >= 5 },
  { id: 'collector', name: 'Collector', desc: 'Add games for 5 different platforms', check: state => (new Set(state.games.map(g => g.platform))).size >= 5 },
  { id: 'social_gamer', name: 'Social Gamer', desc: 'Add 5 multiplayer games', check: state => state.games.filter(g => g.mode === 'Multiplayer').length >= 5 },
  { id: 'solo_adventurer', name: 'Solo Adventurer', desc: 'Add 10 singleplayer games', check: state => state.games.filter(g => g.mode === 'Singleplayer').length >= 10 },
  { id: 'speedrunner', name: 'Speedrunner', desc: 'Complete a game within 24 hours of adding it', check: state => state.completed.some(g => g.completedAt - g.addedAt <= 86400000) },
  { id: 'veteran', name: 'Veteran', desc: 'Use the app for 30 days', check: state => state.daysUsed >= 30 },
  { id: 'perfectionist', name: 'Perfectionist', desc: 'Add a game, complete it, and add a cover image for it', check: state => state.completed.some(g => g.cover) },
  {
    id: 'legend',
    name: 'You Are a Legend!',
    desc: 'Unlock all other achievements',
    check: state => {
      // Exclude 'legend' itself from the check
      const unlocked = new Set(getUnlockedAchievements());
      return ACHIEVEMENTS
        .filter(a => a.id !== 'legend')
        .every(a => unlocked.has(a.id));
    }
  }
];

// Utility to load/save unlocked achievements
function getUnlockedAchievements() {
  return JSON.parse(localStorage.getItem('unlockedAchievements') || '[]');
}
function setUnlockedAchievements(arr) {
  localStorage.setItem('unlockedAchievements', JSON.stringify(arr));
}

// Call this after any relevant action
function checkAchievements(state) {
  const unlocked = new Set(getUnlockedAchievements());
  let newUnlocks = [];
  for (const ach of ACHIEVEMENTS) {
    if (!unlocked.has(ach.id) && ach.check(state)) {
      unlocked.add(ach.id);
      newUnlocks.push(ach);
    }
  }
  if (newUnlocks.length) {
    setUnlockedAchievements([...unlocked]);
    renderAchievements();
    // Optionally show popup for each new achievement
    newUnlocks.forEach(ach => showAchievementPopup(`Achievement unlocked: ${ach.name}!`));
    // Reveal achievements section if hidden
    document.getElementById('achievementsSection')?.classList.remove('d-none');
    renderStats();
  }
}

// Render achievements section
function renderAchievements() {
  let unlocked = new Set(getUnlockedAchievements());
  const section = document.getElementById('achievementsSection');
  if (!section) return;

  const unlockedList = ACHIEVEMENTS.filter(ach => unlocked.has(ach.id));
  if (unlockedList.length === 0) {
    section.classList.add('d-none');
    return;
  }

  section.classList.remove('d-none');
  section.innerHTML = `
    <h4 class="mb-3">🏅 Achievements</h4>
    <div class="achievements-grid" id="achievementsGrid">
      ${unlockedList.map((ach, i) => `
        <div class="achievement-card unlocked${i >= 5 ? ' achievement-collapsed' : ' achievement-expanded'}">
          <div class="achievement-badge">🏆</div>
          <div class="achievement-text-area">
              <div class="achievement-title">${ach.name}</div>
              <div class="achievement-desc">${ach.desc}</div>
          </div>
        </div>
      `).join('')}
    </div>
    ${unlockedList.length > 5 ? `
      <button id="toggleAchievementsBtn" class="btn btn-outline-secondary btn-xs mt-2" style="width:120px;">Show more</button>
    ` : ''}
  `;

  if (unlockedList.length > 3) {
    const btn = document.getElementById('toggleAchievementsBtn');
    const cards = section.querySelectorAll('.achievement-card.unlocked');
    let expanded = false;

    if (btn) {
      btn.addEventListener('click', () => {
        expanded = !expanded;
        cards.forEach((card, i) => {
          if (i >= 3) {
            if (expanded) {
              card.style.display = 'flex';
              // Force reflow for transition
              void card.offsetWidth;
              card.classList.remove('achievement-collapsing');
              card.classList.add('achievement-expanded');
            } else {
              card.classList.remove('achievement-expanded');
              card.classList.add('achievement-collapsing');
              // After transition, hide completely
              setTimeout(() => {
                if (!expanded) card.style.display = 'none';
              }, 300);
            }
          }
        });
        btn.textContent = expanded ? 'Show less' : 'Show more';
      });
    }

    // Initial state: collapse extra cards
    cards.forEach((card, i) => {
      if (i >= 3) {
        card.classList.remove('achievement-expanded');
        card.classList.add('achievement-collapsing');
        card.style.display = 'none';
      }
    });
  }
}

// Call this on app load
document.addEventListener('DOMContentLoaded', () => {
  renderAchievements();
  // Hide section if nothing unlocked
  const unlocked = getUnlockedAchievements();
  if (!unlocked.length) {
    document.getElementById('achievementsSection')?.classList.add('d-none');
  }
});



// Export for use in other scripts
window.ACHIEVEMENTS = ACHIEVEMENTS;
window.getUnlockedAchievements = getUnlockedAchievements;
window.checkAchievements = checkAchievements;
window.renderAchievements = renderAchievements;