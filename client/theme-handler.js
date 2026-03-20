document.addEventListener('DOMContentLoaded', () => {
  const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
  const currentTheme = localStorage.getItem('theme');

  if (currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (currentTheme === 'dark') {
      toggleSwitch.checked = true;
    }
  }

  function switchTheme(e) {
    if (e.target.checked) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      if (typeof showToast === 'function') showToast('Dark mode enabled');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      if (typeof showToast === 'function') showToast('Light mode enabled');
    }
  }

  if (toggleSwitch) {
    toggleSwitch.addEventListener('change', switchTheme, false);
  }
});
