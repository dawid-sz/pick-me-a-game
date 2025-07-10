document.addEventListener('DOMContentLoaded', () => {
  const section = document.getElementById('addGameSection');
  const toggleTitle = document.getElementById('toggleAddGame');
  const form = document.getElementById('addGameForm');

  // Restore toggle state from localStorage (default collapsed)
  const savedState = localStorage.getItem('addGameExpanded');
  if (savedState === 'true') {
    section.classList.add('expanded');
    section.classList.remove('collapsed');
  } else {
    section.classList.add('collapsed');
    section.classList.remove('expanded');
  }

  // Toggle on title click
  toggleTitle.addEventListener('click', () => {
    if (section.classList.contains('collapsed')) {
      section.classList.remove('collapsed');
      section.classList.add('expanded');
      localStorage.setItem('addGameExpanded', 'true');
    } else {
      section.classList.add('collapsed');
      section.classList.remove('expanded');
      localStorage.setItem('addGameExpanded', 'false');
    }
  });

  // After form submission, keep expanded
  const addGameForm = document.getElementById('addGameForm');
  addGameForm.addEventListener('submit', () => {
    section.classList.remove('collapsed');
    section.classList.add('expanded');
    localStorage.setItem('addGameExpanded', 'true');
  });
});


//toogle rotating
if (section.classList.contains('collapsed')) {
  section.classList.remove('collapsed');
  section.classList.add('expanded');
  localStorage.setItem('addGameExpanded', 'true');
} else {
  section.classList.add('collapsed');
  section.classList.remove('expanded');
  localStorage.setItem('addGameExpanded', 'false');
}