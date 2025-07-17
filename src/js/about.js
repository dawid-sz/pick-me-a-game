const sections = {
    about: `
    <h1 class="mb-5">About</h1>
  <p>
    <strong>Pick Me a Game</strong> is a passion project built by a gamer, for gamers. It helps you pick what to play from your own curated list of games—no algorithms, no ads, no fuss. Just randomness, fun, and a touch of personality.
  </p>
  <p>
    From adding your games with custom covers, tracking hours, and filtering by mode, to marking titles as completed, collecting achievements, and getting a fun quote or tip after every pick — the app keeps it simple and personal.
  </p>
  <p>
    You can export and import your entire profile, share your lists, and even set up a nickname and avatar. Everything stays on your device unless you choose to back it up to the cloud in the future.
  </p>
  <p>
    This is a side project made with ❤️ and no intention to sell or profit from. It’s just for those of us who want to spend less time choosing and more time playing.
  </p>
    `,
    contact: `
    <h1>Contact</h1>
    <form class="contact-form">
        <div class="mb-3">
        <label for="contactSubject" class="form-label">Subject</label>
        <select class="form-select" id="contactSubject">
            <option>General Support</option>
            <option>Feedback</option>
            <option>Bug Report</option>
        </select>
        </div>
        <div class="mb-3">
        <label for="contactName" class="form-label">Name (optional)</label>
        <input type="text" class="form-control" id="contactName">
        </div>
        <div class="mb-3">
        <label for="contactEmail" class="form-label">Email address</label>
        <input type="email" class="form-control" id="contactEmail">
        </div>
        <div class="mb-3">
        <label for="contactMessage" class="form-label">What's on your mind?</label>
        <textarea class="form-control" id="contactMessage" rows="4"></textarea>
        </div>
        <button type="submit" class="btn btn-primary w-100">Send</button>
    </form>
    `,
    faq: `
    <h1 class="mb-4">FAQ</h1>

    <h4>What is Pick Me a Game?</h4>
    <p>It’s a personal web app made by a gamer for gamers — to help you pick what to play next from your own game list. No more wasting time scrolling through your backlog!</p>

    <h4>Where is my data stored?</h4>
    <p>All your data — profile, game list, stats, achievements — is stored <strong>locally</strong> in your browser using <code>localStorage</code>. Nothing is sent anywhere unless you use the optional cloud backup feature (coming soon).</p>

    <h4>Can I back up or transfer my data?</h4>
    <p>Yes! You can use the <strong>Export</strong> button to download a full backup of your app data as a <code>.json</code> file. You can also import it on another device to continue where you left off.</p>

    <h4>Why do I see random greetings and quotes?</h4>
    <p>To make things more fun and personal, the app shows random greetings and over 200 quotes, tips, and fun facts after each game is picked. It’s just a little touch of charm.</p>

    <h4>What are the achievements for?</h4>
    <p>You can collect up to 25 unique achievements by using different features of the app — like picking games, adding entries, completing titles, and more. It’s just for fun and motivation.</p>

    <h4>Can I create a profile?</h4>
    <p>Yes! You can set your nickname and choose an avatar (or upload your own). This gives your experience a bit more personality — and your stats and achievements will be tied to it.</p>

    <h4>Is there a dark mode?</h4>
    <p>Yes — just toggle it using the theme button in the top navigation bar. It saves your preference for next time too.</p>

    <h4>Will there be a cloud save?</h4>
    <p>Yes, in a future update. You'll be able to optionally upload your data to a private cloud using a unique ID (no account or email needed) and then restore it on another device.</p>

    <h4>Can I share my game list or picked game?</h4>
    <p>Yes — you can copy your full list or selected game as text, or generate an image to share with friends.</p>

    <h4>Can I use this on my phone?</h4>
    <p>Absolutely! You can even add it to your home screen (like a real app) and it will open in full-screen mode on iOS (Android in work).</p>

    <h4>Is this a commercial project?</h4>
    <p>No. This is a passion project built by one gamer to help others. It’s 100% free, with no trackers, no ads, and no hidden agenda.</p>

    <h4>Still have questions?</h4>
    <p>Feel free to reach out on <a href="https://github.com/dawid-sz/pick-me-a-game" target="_blank" rel="noopener noreferrer">GitHub</a> or Reddit. I’d love to hear your thoughts!</p>
`,
    privacy: `
    <h1 class="mb-5">Privacy Policy</h1>
    <p><strong>Last updated:</strong> July 14, 2025</p>

    <p><strong>Pick Me a Game</strong> is a personal web app built by a gamer, for gamers. It’s designed to help you choose what to play next without wasting time scrolling through your backlog.</p>

    <h4 class="mt-4">🔒 Your Privacy</h4>
    <ul>
        <li>This app does <strong>not</strong> collect, track, or transmit any personal data.</li>
        <li>All your game data (profile, list, achievements, stats) is stored <strong>locally</strong> in your browser using <code>localStorage</code>.</li>
        <li>When you use the <strong>Export</strong> function, the data is saved as a <code>.json</code> file on your device. No data is uploaded unless you explicitly use future cloud backup features.</li>
        <li>The app does <strong>not</strong> use cookies, analytics, or third-party trackers.</li>
    </ul>

    <h4 class="mt-4">☁️ Optional Cloud Backup (Coming Soon)</h4>
    <p>A future version may allow optional backup of your data to the cloud using a secure ID. This will be:</p>
    <ul>
        <li><strong>Opt-in only</strong></li>
        <li>No login required</li>
        <li>Still 100% private — no email, name, or personal info needed</li>
    </ul>

    <h4 class="mt-4">📬 Contact</h4>
    <p>Questions? Feedback? Reach out via <a href="https://github.com/dawid-sz/pick-me-a-game" target="_blank" rel="noopener noreferrer">GitHub</a> or the "Contact" form. I’m happy to chat with fellow gamers.</p>
    `
};

// Function to show a section
function showSection(section) {
  document.getElementById('mainContent').innerHTML = sections[section];
  document.querySelectorAll('.side-menu-link').forEach(link => {
    link.classList.toggle('active', link.dataset.section === section);
  });
  // Update hash in URL without scrolling
  history.replaceState(null, '', '#' + section);
}

// On load, show section from hash if present
document.addEventListener('DOMContentLoaded', () => {
  let section = location.hash.replace('#', '') || 'about';
  if (!sections[section]) section = 'about';
  showSection(section);
  document.querySelectorAll('.side-menu-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      showSection(this.dataset.section);
    });
  });
});

// Optional: Listen for hash changes (if user uses browser back/forward)
window.addEventListener('hashchange', () => {
  let section = location.hash.replace('#', '') || 'about';
  if (!sections[section]) section = 'about';
  showSection(section);
});