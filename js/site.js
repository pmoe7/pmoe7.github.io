(function () {
  const menu = document.querySelector('[data-menu]');
  const menuOpen = document.querySelector('[data-menu-open]');
  const menuClose = document.querySelector('[data-menu-close]');
  const menuBackdrop = document.querySelector('[data-menu-backdrop]');
  const menuDrawer = document.querySelector('.menu-drawer');
  const search = document.querySelector('[data-search]');
  const searchOpen = document.querySelector('[data-search-open]');
  const searchClose = document.querySelector('[data-search-close]');
  const searchBackdrop = document.querySelector('[data-search-backdrop]');
  const searchBox = document.querySelector('.search-box');
  const searchInput = document.querySelector('[data-search-input]');
  const searchResults = document.querySelector('[data-search-results]');
  const filterButtons = document.querySelectorAll('[data-filter]');
  const filterItems = document.querySelectorAll('[data-category]');
  const themeToggles = document.querySelectorAll('[data-theme-toggle]');
  const themeMedia = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;
  const aboutRevealItems = document.querySelectorAll('.about-reveal:not(.about-principle)');
  const aboutPrincipleItems = document.querySelectorAll('.about-principle');
  const aboutPrincipleToggles = document.querySelectorAll('[data-principle-toggle]');
  const headerToneSections = document.querySelectorAll('.about-theme-section[data-header-tone], .writing-theme-section[data-header-tone], .projects-theme-section[data-header-tone], .case-theme-section[data-header-tone]');
  const ambientMotionRegions = document.querySelectorAll('.home-hero, .projects-hero, .writing-hero');
  let lastFocus = null;

  function getTheme() {
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  }

  function getSystemTheme() {
    return themeMedia && themeMedia.matches ? 'dark' : 'light';
  }

  function getThemePreference() {
    const currentPreference = document.documentElement.dataset.themePreference;
    if (currentPreference === 'auto' || currentPreference === 'light' || currentPreference === 'dark') {
      return currentPreference;
    }

    try {
      const storedPreference = localStorage.getItem('mp-theme');
      if (storedPreference === 'light' || storedPreference === 'dark') return storedPreference;
    } catch (error) { /* Storage is optional. */ }

    return 'auto';
  }

  function renderLucideIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function syncThemeControl() {
    const theme = getTheme();
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    themeToggles.forEach((themeToggle) => {
      const themeIcon = document.createElement('i');
      themeIcon.dataset.lucide = theme === 'dark' ? 'sun' : 'moon';
      themeIcon.dataset.themeIcon = '';
      themeIcon.setAttribute('aria-hidden', 'true');
      themeToggle.replaceChildren(themeIcon);
      themeToggle.dataset.themeState = theme;
      themeToggle.setAttribute('aria-label', 'Switch to ' + nextTheme + ' mode');
      themeToggle.setAttribute('title', 'Switch to ' + nextTheme + ' mode');
    });
    renderLucideIcons();
  }

  function applyTheme(theme, remember) {
    const resolvedTheme = theme === 'dark' || theme === 'light' ? theme : getSystemTheme();
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', resolvedTheme === 'dark' ? '#0b0c0d' : '#faf9f6');
    if (remember) {
      document.documentElement.dataset.themePreference = resolvedTheme;
      document.documentElement.dataset.themeSystem = getSystemTheme();
      try {
        localStorage.setItem('mp-theme-system', getSystemTheme());
        localStorage.setItem('mp-theme', resolvedTheme);
      } catch (error) { /* Storage is optional. */ }
    }
    syncThemeControl();
  }

  function clearStoredThemePreference() {
    try {
      localStorage.removeItem('mp-theme');
      localStorage.removeItem('mp-theme-system');
    } catch (error) { /* Storage is optional. */ }
  }

  function useSystemTheme(theme) {
    const systemTheme = theme || getSystemTheme();
    clearStoredThemePreference();
    document.documentElement.dataset.themePreference = 'auto';
    document.documentElement.dataset.themeSystem = systemTheme;
    applyTheme(systemTheme, false);
  }

  function syncThemeAfterResume() {
    const systemTheme = getSystemTheme();
    if (getThemePreference() === 'auto') {
      applyTheme(systemTheme, false);
      return;
    }

    if (document.documentElement.dataset.themeSystem !== systemTheme) {
      useSystemTheme(systemTheme);
    }
  }

  if (ambientMotionRegions.length) {
    const syncPageMotion = () => {
      document.documentElement.classList.toggle('is-page-motion-paused', document.hidden);
    };
    syncPageMotion();
    document.addEventListener('visibilitychange', syncPageMotion, { passive: true });

    if (typeof IntersectionObserver === 'function') {
      const motionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('is-motion-paused', !entry.isIntersecting);
        });
      }, { rootMargin: '120px 0px' });
      ambientMotionRegions.forEach((region) => motionObserver.observe(region));
    }
  }

  if (aboutRevealItems.length || aboutPrincipleItems.length) {
    document.body.classList.add('has-reveal-motion');
  }

  if (aboutRevealItems.length) {
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: .14, rootMargin: '0px 0px -8% 0px' });
      aboutRevealItems.forEach((item) => revealObserver.observe(item));
    } else {
      aboutRevealItems.forEach((item) => item.classList.add('is-visible'));
    }
  }

  if (aboutPrincipleItems.length) {
    const reducePrincipleMotion = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducePrincipleMotion || !('IntersectionObserver' in window)) {
      aboutPrincipleItems.forEach((item) => item.classList.add('is-visible'));
    } else {
      const principleQueue = [];
      let principleRevealTimer = null;

      const revealNextPrinciple = () => {
        const principle = principleQueue.shift();
        if (!principle) {
          principleRevealTimer = null;
          return;
        }
        principle.classList.add('is-visible');
        principleRevealTimer = window.setTimeout(revealNextPrinciple, 180);
      };

      const principleObserver = new IntersectionObserver((entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => Number(a.target.dataset.principleIndex) - Number(b.target.dataset.principleIndex))
          .forEach((entry) => {
            principleObserver.unobserve(entry.target);
            principleQueue.push(entry.target);
          });

        if (principleQueue.length && principleRevealTimer === null) revealNextPrinciple();
      }, { threshold: .18, rootMargin: '0px 0px -12% 0px' });

      aboutPrincipleItems.forEach((item, index) => {
        item.dataset.principleIndex = String(index);
        principleObserver.observe(item);
      });
    }
  }

  if (aboutPrincipleToggles.length) {
    const principleMedia = window.matchMedia('(max-width: 760px)');
    const syncPrincipleState = () => {
      aboutPrincipleToggles.forEach((button) => button.setAttribute('aria-expanded', String(!principleMedia.matches)));
    };
    syncPrincipleState();
    principleMedia.addEventListener && principleMedia.addEventListener('change', syncPrincipleState);
    aboutPrincipleToggles.forEach((button) => {
      button.addEventListener('click', () => {
        if (!principleMedia.matches) return;
        const willOpen = button.getAttribute('aria-expanded') !== 'true';
        aboutPrincipleToggles.forEach((item) => item.setAttribute('aria-expanded', 'false'));
        button.setAttribute('aria-expanded', String(willOpen));
      });
    });
  }

  if (headerToneSections.length) {
    let headerToneFrame = null;
    const syncAboutHeaderTone = () => {
      headerToneFrame = null;
      const probe = window.innerWidth <= 760 ? 60 : 68;
      let tone = 'dark';
      headerToneSections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= probe && rect.bottom > probe) tone = section.dataset.headerTone || 'dark';
      });
      document.body.dataset.headerTone = tone;
    };
    const queueAboutHeaderTone = () => {
      if (!headerToneFrame) headerToneFrame = window.requestAnimationFrame(syncAboutHeaderTone);
    };
    syncAboutHeaderTone();
    window.addEventListener('scroll', queueAboutHeaderTone, { passive: true });
    window.addEventListener('resize', queueAboutHeaderTone);
  }

  if (menuOpen) menuOpen.setAttribute('aria-expanded', 'false');
  if (searchOpen) searchOpen.setAttribute('aria-expanded', 'false');
  const initialThemePreference = getThemePreference();
  document.documentElement.dataset.themePreference = initialThemePreference;
  applyTheme(initialThemePreference === 'auto' ? getSystemTheme() : initialThemePreference, false);

  themeToggles.forEach((themeToggle) => {
    themeToggle.addEventListener('click', () => {
      applyTheme(getTheme() === 'dark' ? 'light' : 'dark', true);
    });
  });

  const handleSystemThemeChange = (event) => {
    useSystemTheme(event.matches ? 'dark' : 'light');
  };

  if (themeMedia) {
    if (typeof themeMedia.addEventListener === 'function') {
      themeMedia.addEventListener('change', handleSystemThemeChange);
    } else if (typeof themeMedia.addListener === 'function') {
      themeMedia.addListener(handleSystemThemeChange);
    }
  }

  window.addEventListener('storage', (event) => {
    if (event.key !== 'mp-theme') return;
    const preference = event.newValue === 'dark' || event.newValue === 'light' ? event.newValue : 'auto';
    let preferenceSystem = null;
    try { preferenceSystem = localStorage.getItem('mp-theme-system'); } catch (error) { /* Storage is optional. */ }
    if (preference === 'auto' || preferenceSystem !== getSystemTheme()) {
      useSystemTheme();
      return;
    }
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.dataset.themeSystem = preferenceSystem;
    applyTheme(preference, false);
  });

  window.addEventListener('pageshow', syncThemeAfterResume);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) syncThemeAfterResume();
  });

  const searchItems = [
    { label: 'Home | Mohammed Perves', url: 'index.html' },
    { label: 'About Mohammed Perves', url: 'about.html' },
    { label: 'Projects: AI, data products, and machine learning', url: 'projects.html' },
    { label: 'Equitable vaccine distribution: machine learning case study', url: 'covid.html' },
    { label: 'Writing: AI, software, and capital', url: 'writing.html' },
    { label: 'Law or Justice?: archived essay', url: 'law.html' },
    { label: 'Aker AI Platform', url: 'https://aker-ai.com/' },
    { label: 'The AI Leverage Index', url: 'https://www.linkedin.com/posts/pmoe7_one-of-my-favourite-metrics-for-measuring-activity-7361366021611401216-1IpB' },
    { label: 'AI is eating software', url: 'https://www.linkedin.com/posts/pmoe7_ai-activity-7427343198685143040-ouy8' }
  ];

  function openMenu() {
    if (!menu) return;
    lastFocus = document.activeElement;
    document.documentElement.classList.add('menu-open');
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    menuOpen && menuOpen.setAttribute('aria-expanded', 'true');
    window.setTimeout(() => menuClose && menuClose.focus(), 80);
  }

  function closeMenu() {
    if (!menu) return;
    document.documentElement.classList.remove('menu-open');
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    menuOpen && menuOpen.setAttribute('aria-expanded', 'false');
    if (lastFocus) lastFocus.focus();
  }

  function openSearch() {
    if (!search) return;
    lastFocus = document.activeElement;
    document.documentElement.classList.add('search-open');
    search.classList.add('is-open');
    search.setAttribute('aria-hidden', 'false');
    searchOpen && searchOpen.setAttribute('aria-expanded', 'true');
    document.dispatchEvent(new CustomEvent('site-search-toggle', { detail: { open: true } }));
    window.setTimeout(() => searchInput && searchInput.focus(), 80);
  }

  function closeSearch() {
    if (!search) return;
    document.documentElement.classList.remove('search-open');
    search.classList.remove('is-open');
    search.setAttribute('aria-hidden', 'true');
    searchOpen && searchOpen.setAttribute('aria-expanded', 'false');
    document.dispatchEvent(new CustomEvent('site-search-toggle', { detail: { open: false } }));
    if (searchInput) searchInput.value = '';
    if (searchResults) { searchResults.innerHTML = ''; searchResults.classList.remove('has-results'); }
    if (lastFocus) lastFocus.focus();
  }

  menuOpen && menuOpen.addEventListener('click', openMenu);
  menuClose && menuClose.addEventListener('click', closeMenu);
  menuBackdrop && menuBackdrop.addEventListener('click', closeMenu);

  searchOpen && searchOpen.addEventListener('click', openSearch);
  searchClose && searchClose.addEventListener('click', closeSearch);
  searchBackdrop && searchBackdrop.addEventListener('click', closeSearch);

  document.addEventListener('pointerdown', (event) => {
    if (menu && menu.classList.contains('is-open')) {
      const insideMenu = menuDrawer && menuDrawer.contains(event.target);
      const onMenuButton = menuOpen && menuOpen.contains(event.target);
      if (!insideMenu && !onMenuButton) closeMenu();
    }

    if (search && search.classList.contains('is-open')) {
      const insideSearch = searchBox && searchBox.contains(event.target);
      const onSearchButton = searchOpen && searchOpen.contains(event.target);
      if (!insideSearch && !onSearchButton) closeSearch();
    }
  });

  searchInput && searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      searchResults.innerHTML = '';
      searchResults.classList.remove('has-results');
      return;
    }
    const matches = searchItems.filter((item) => item.label.toLowerCase().includes(query)).slice(0, 5);
    searchResults.innerHTML = matches.length
      ? matches.map((item) => '<a href="' + item.url + '">' + item.label + ' <i data-lucide="arrow-up-right" aria-hidden="true"></i></a>').join('')
      : '<span>No results found</span>';
    searchResults.classList.add('has-results');
    renderLucideIcons();
  });

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      filterButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      filterItems.forEach((item) => {
        const categories = (item.dataset.category || '').split(' ');
        item.classList.toggle('is-hidden', filter !== 'all' && !categories.includes(filter));
      });
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab' && menu && menu.classList.contains('is-open') && menuDrawer) {
      const focusable = Array.from(menuDrawer.querySelectorAll('a[href], button:not([disabled])'))
        .filter((item) => item.getClientRects().length);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (first && last && event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (first && last && !event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    if (event.key === 'Escape') {
      if (menu && menu.classList.contains('is-open')) closeMenu();
      if (search && search.classList.contains('is-open')) closeSearch();
    }
  });
})();
