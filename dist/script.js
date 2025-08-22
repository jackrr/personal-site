
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

      // Photo navigation with arrow keys
      const photoViewer = document.querySelector('.photo-viewer');
      if (photoViewer) {
        const galleryName = photoViewer.dataset.gallery;
        const currentIndex = parseInt(photoViewer.dataset.current);
        const totalImages = parseInt(photoViewer.dataset.total);
        
        // Get navigation URLs
        const prevButton = document.querySelector('.nav-prev');
        const nextButton = document.querySelector('.nav-next');
        const prevUrl = prevButton ? prevButton.href : null;
        const nextUrl = nextButton ? nextButton.href : null;
        
        // Arrow key navigation
        document.addEventListener('keydown', (event) => {
          switch(event.key) {
            case 'ArrowLeft':
              event.preventDefault();
              if (prevUrl) {
                window.location.href = prevUrl;
              }
              break;
            case 'ArrowRight':
              event.preventDefault();
              if (nextUrl) {
                window.location.href = nextUrl;
              }
              break;
            case 'Escape':
              event.preventDefault();
              // Go back to gallery
              window.location.href = '/photos/' + galleryName;
              break;
          }
        });
      }
    