// --- Greeting Banner ---

document.addEventListener('DOMContentLoaded', function() {
  const greetings = [
    "Welcome back, Gamer! 🎮",
    "Ready for your next adventure?",
    "Achievement unlocked: Visiting today!",
    "Let’s pick something epic to play!",
    "Good to see you! What will you play next?",
    "Level up your backlog today!",
    "Game on! What’s your mood?",
    "New quest: Find your next game!",
    "You’ve respawned! Let’s roll!",
    "Insert coin to continue your journey!",
    "Time to grind or chill — your call.",
    "Let’s slay that backlog, one game at a time.",
    "Controller in hand? Let’s do this.",
    "Your save file is loaded. Welcome back!",
    "Another day, another level to conquer!",
    "You’re back online, Commander.",
    "Logged in and looking legendary!",
    "It’s dangerous to go alone… take a game!",
    "Choose your next mission wisely.",
    "May your frame rates be high and lobbies be fast.",
    "Time to press start on something new!",
    "The game world awaits your return!",
    "Welcome, Champion! What’s your next battle?",
    "Start your engines — game time!",
    "It's-a you! Let’s pick a game!",
    "Time to roll the dice on a new adventure.",
    "A new challenger approaches… it’s you!",
    "Gaming mode: Activated.",
    "Pick your path — RPG, FPS, or cozy farming?",
    "Adventure doesn’t start itself.",
    "Let the backlog battles commence!",
    "Let’s pause reality and play.",
    "The realm awaits your presence.",
    "Game over? Nah — just getting started.",
    "You’ve got this. Let’s find your next win.",
    "Your controller misses you!",
    "Next up: Gaming greatness.",
    "Booting up your next big obsession.",
    "XP boost activated. Let’s go!",
    "The grind begins now.",
    "Side quest accepted: Find a game!",
    "Loading fun… please wait…",
    "Equip your headset — let’s play.",
    "Back for more? We knew you’d return.",
    "It’s time to press A to continue.",
    "You bring the snacks, we bring the games.",
    "Your party needs you!",
    "Power on, let’s dive in.",
    "No bugs here, just games.",
    "Loot, level, repeat.",
    "Don't just stand there — grab a game!",
    "Today’s vibes: gaming excellence.",
    "Console or PC — it’s your world.",
    "Mount your chocobo, we ride at dawn!",
    "You’ve logged in. Now choose your destiny.",
    "We saved your seat — and your save file.",
    "You've earned some screen time.",
    "Welcome back to the leaderboard.",
    "Ready, player one?",
    "Welcome to the grind zone.",
    "You’ve returned from the pause menu!",
    "Are you not entertained? Let’s fix that.",
    "Back again? Your backlog trembles.",
    "Let’s break some pixels today!",
    "Is it a gaming day? Trick question — always.",
    "Ready to farm, fight, or fly?",
    "Player spotted. Loading game suggestions.",
    "It’s time to co-op with your controller.",
    "Escape reality — just for a little while.",
    "New game plus? Let’s find one!",
    "Today’s forecast: 100% chance of gaming.",
    "A wild gamer appeared!",
    "Take your time — we’ve got plenty of games.",
    "From 8-bit to 4K, let’s go!",
    "Choose your character… oh wait, it’s you!",
    "You're online — time to go AFK in real life.",
    "Craving chaos or calm? Let’s pick.",
    "You bring the skill, we bring the picks.",
    "Back in the lobby — welcome!",
    "One does not simply visit without finding a game.",
    "On a quest for fun? You’re in the right place.",
    "Time to rack up some playtime!",
    "Health bar full — let’s go!",
    "Who needs sleep when you have games?",
    "Back at it — let’s conquer some quests.",
    "You’re in the right zone — the fun zone.",
    "Tired of reality? Excellent timing.",
    "What's the vibe — chill or challenge?",
    "Back in the game hub — welcome!",
    "Recharged and ready to play!",
    "New loot available — time to choose.",
    "We queued up the fun. You just pick.",
    "Energy levels: 100%. Game time!",
    "You pressed start — now choose your world.",
    "Every day’s a good day for games.",
    "Wanna save the world or plant some crops?",
    "You’ve logged in to the fun dimension.",
    "You’re just in time for a new journey.",
    "Game picking difficulty: Insane. Let’s help.",
    "Mood: gaming. Let’s fuel it.",
    "One click away from your next obsession.",
    "Console: on. Mind: ready.",
    "You’re the protagonist today.",
    "Let’s make your game time legendary.",
    "Mission accepted: Find fun."
  ];

  if (!sessionStorage.getItem('greetingShown')) {
    let lastGreetingIndex = parseInt(sessionStorage.getItem('lastGreetingIndex'), 10);
    let idx;
    do {
      idx = Math.floor(Math.random() * greetings.length);
    } while (greetings.length > 1 && idx === lastGreetingIndex);

    sessionStorage.setItem('lastGreetingIndex', idx); // Save for next time

    const greeting = greetings[idx];
    const banner = document.getElementById('greetingBanner');
    banner.textContent = greeting;
    banner.classList.remove('d-none');
    sessionStorage.setItem('greetingShown', '1');

    // Hide after 5 seconds with fade-out
    setTimeout(() => {
      banner.classList.add('fade-out');
      setTimeout(() => {
        banner.remove();
      }, 500); // Wait for fade-out transition
    }, 5000);
  }
});