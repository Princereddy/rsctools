// theme.js - Premium Dark Mode Logic
(function() {
  // Read saved theme instantly to prevent Flash of Unstyled Content (FOUC)
  const savedTheme = localStorage.getItem('rsc_theme') || 'light';
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  // Attach event listener once DOM is fully loaded
  window.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;
    
    // Set initial toggle button state
    if (savedTheme === 'dark') {
      toggleBtn.classList.add('is-dark');
    }

    toggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      if (newTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        toggleBtn.classList.add('is-dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        toggleBtn.classList.remove('is-dark');
      }
      
      localStorage.setItem('rsc_theme', newTheme);
    });
  });
})();
