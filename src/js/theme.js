function applyTheme(theme) {
  const body = document.body;
  if (theme === "dark") {
    body.classList.remove("bg-light", "text-dark");
    body.classList.add("bg-dark", "text-light");
    themeSwitch.checked = true;
    updateThemeIcon(true);
  } else {
    body.classList.remove("bg-dark", "text-light");
    body.classList.add("bg-light", "text-dark");
    themeSwitch.checked = false;
    updateThemeIcon(false);
  }
  localStorage.setItem("theme", theme);
}

function updateThemeIcon(isDark) {
  const themeIcon = document.getElementById('themeIcon');
  if (!themeIcon) return;
  if (isDark) {
    themeIcon.classList.remove('bi-sun');
    themeIcon.classList.add('bi-moon');
  } else {
    themeIcon.classList.remove('bi-moon');
    themeIcon.classList.add('bi-sun');
  }
}

document.addEventListener("DOMContentLoaded", function() {
  const themeSwitch = document.getElementById('themeSwitch');
  if (!themeSwitch) return;
  // Set initial theme
  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);

  themeSwitch.addEventListener("change", function () {
    const theme = this.checked ? "dark" : "light";
    applyTheme(theme);
  });
});