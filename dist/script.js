
      // Theme toggle functionality
      const themeToggle = document.getElementById('theme-toggle');
      const html = document.documentElement;

      // Initialize theme based on system preference or stored preference
      const savedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (savedTheme) {
        html.setAttribute('data-theme', savedTheme);
      } else if (systemPrefersDark) {
        html.setAttribute('data-theme', 'dark');
      } else {
        html.setAttribute('data-theme', 'light');
      }

      themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
      });
    