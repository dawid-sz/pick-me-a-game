document.addEventListener('DOMContentLoaded', () => {
  const section = document.getElementById('addGameSection');
  const toggleBtn = document.getElementById('toggleAddGame');
  const addGameForm = document.getElementById('addGameForm');

  // Always start collapsed
  section.classList.add('collapsed');
  section.classList.remove('expanded');

  // Toggle on title click
  toggleBtn.addEventListener('click', () => {
    toggleBtn.classList.toggle('open');
    if (section.classList.contains('collapsed')) {
      section.classList.remove('collapsed');
      section.classList.add('expanded');
    } else {
      section.classList.add('collapsed');
      section.classList.remove('expanded');
    }
  });

  // After form submission, keep expanded (optional)
  addGameForm.addEventListener('submit', () => {
    section.classList.remove('collapsed');
    section.classList.add('expanded');
  });
});


