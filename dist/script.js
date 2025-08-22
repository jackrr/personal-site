
      // Theme toggle functionality
      const themeToggle = document.getElementById('theme-toggle');
      const themeToggleMobile = document.getElementById('theme-toggle-mobile');
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

      function toggleTheme() {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
      }

      if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
      }
      
      if (themeToggleMobile) {
        themeToggleMobile.addEventListener('click', toggleTheme);
      }

      // Mobile navigation menu toggle
      const navToggle = document.getElementById('nav-toggle');
      const navMenu = document.getElementById('nav-menu');

      if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
          navToggle.classList.toggle('active');
          navMenu.classList.toggle('active');
        });

        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('.nav-link:not(.theme-toggle)');
        navLinks.forEach(link => {
          link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
          });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (event) => {
          if (!navToggle.contains(event.target) && !navMenu.contains(event.target)) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
          }
        });
      }

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

        // Touch/swipe navigation
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;

        photoViewer.addEventListener('touchstart', (event) => {
          startX = event.touches[0].clientX;
          startY = event.touches[0].clientY;
        }, { passive: true });

        photoViewer.addEventListener('touchend', (event) => {
          endX = event.changedTouches[0].clientX;
          endY = event.changedTouches[0].clientY;

          const deltaX = endX - startX;
          const deltaY = endY - startY;
          const minSwipeDistance = 50;

          // Check if horizontal swipe is greater than vertical swipe
          if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
              // Swipe right - go to previous image
              if (prevUrl) {
                window.location.href = prevUrl;
              }
            } else {
              // Swipe left - go to next image
              if (nextUrl) {
                window.location.href = nextUrl;
              }
            }
          }
        }, { passive: true });
      }
    