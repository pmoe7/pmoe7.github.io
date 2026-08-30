(function () {
  const menu = document.querySelector('[data-menu]');
  const menuOpen = document.querySelector('[data-menu-open]');
  const menuClose = document.querySelector('[data-menu-close]');
  const menuBackdrop = document.querySelector('[data-menu-backdrop]');
  const menuDrawer = document.querySelector('.menu-drawer');
  const rootPanel = document.querySelector('[data-panel="root"]');
  const panelTriggers = document.querySelectorAll('[data-panel-target]');
  const panelBacks = document.querySelectorAll('[data-panel-back]');
  const search = document.querySelector('[data-search]');
  const searchOpen = document.querySelector('[data-search-open]');
  const searchClose = document.querySelector('[data-search-close]');
  const searchBackdrop = document.querySelector('[data-search-backdrop]');
  const searchBox = document.querySelector('.search-box');
  const searchInput = document.querySelector('[data-search-input]');
  const searchResults = document.querySelector('[data-search-results]');
  const filterButtons = document.querySelectorAll('[data-filter]');
  const filterItems = document.querySelectorAll('[data-category]');
  const landingIntro = document.querySelector('[data-landing-intro]');
  const themeToggles = document.querySelectorAll('[data-theme-toggle]');
  const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
  const aboutOpening = document.querySelector('[data-about-opening]');
  const aboutOpeningSkip = document.querySelector('[data-about-opening-skip]');
  const aboutRevealItems = document.querySelectorAll('.about-reveal');
  const aboutPrincipleToggles = document.querySelectorAll('[data-principle-toggle]');
  const headerToneSections = document.querySelectorAll('.about-theme-section[data-header-tone], .writing-theme-section[data-header-tone]');
  let lastFocus = null;

  function getTheme() {
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
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
    document.documentElement.dataset.theme = theme;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', theme === 'dark' ? '#0b0c0d' : '#faf9f6');
    if (remember) {
      try { localStorage.setItem('mp-theme', theme); } catch (error) { /* Storage is optional. */ }
    }
    syncThemeControl();
  }

  if (landingIntro) {
    try { sessionStorage.setItem('mp-intro-v2', '1'); } catch (error) { /* Storage is optional. */ }
  }

  if (aboutOpening) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let openingFinished = false;
    let openingTimer = null;
    const preventOpeningScroll = (event) => { if (event.cancelable) event.preventDefault(); };

    const unlockAboutPage = () => {
      document.documentElement.classList.remove('about-opening-active');
      window.removeEventListener('wheel', preventOpeningScroll);
      window.removeEventListener('touchmove', preventOpeningScroll);
    };

    const finishAboutOpening = (skip) => {
      if (openingFinished) return;
      openingFinished = true;
      window.clearTimeout(openingTimer);
      if (skip) aboutOpening.classList.add('is-skipped');
      window.setTimeout(() => {
        unlockAboutPage();
        aboutOpening.setAttribute('aria-hidden', 'true');
        aboutOpening.hidden = true;
      }, skip ? 430 : 820);
    };

    if (reduceMotion) {
      aboutOpening.hidden = true;
    } else {
      document.documentElement.classList.add('about-opening-active');
      window.scrollTo(0, 0);
      window.addEventListener('wheel', preventOpeningScroll, { passive: false });
      window.addEventListener('touchmove', preventOpeningScroll, { passive: false });
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => aboutOpening.classList.add('is-running')));
      openingTimer = window.setTimeout(() => finishAboutOpening(false), 2180);
      aboutOpeningSkip && aboutOpeningSkip.addEventListener('click', () => finishAboutOpening(true));
      document.addEventListener('keydown', (event) => {
        if (openingFinished) return;
        if (event.key === 'Escape') finishAboutOpening(true);
        if ([' ', 'ArrowDown', 'PageDown', 'End'].includes(event.key)) event.preventDefault();
      });
    }
  }

  if (aboutRevealItems.length) {
    document.body.classList.add('has-reveal-motion');
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
  syncThemeControl();

  themeToggles.forEach((themeToggle) => {
    themeToggle.addEventListener('click', () => {
      applyTheme(getTheme() === 'dark' ? 'light' : 'dark', true);
    });
  });

  themeMedia.addEventListener && themeMedia.addEventListener('change', (event) => {
    try {
      if (!localStorage.getItem('mp-theme')) applyTheme(event.matches ? 'dark' : 'light', false);
    } catch (error) { /* Keep the current theme if storage is unavailable. */ }
  });

  const searchItems = [
    { label: 'Home — Mohammed Perves', url: 'index.html' },
    { label: 'About Mohammed Perves', url: 'about.html' },
    { label: 'Writing — AI, software, and capital', url: 'writing.html' },
    { label: 'Aker AI Platform', url: 'https://aker-ai.com/' },
    { label: 'The AI Leverage Index', url: 'https://www.linkedin.com/posts/pmoe7_one-of-my-favourite-metrics-for-measuring-activity-7361366021611401216-1IpB' },
    { label: 'AI is eating software', url: 'https://www.linkedin.com/posts/pmoe7_ai-activity-7427343198685143040-ouy8' }
  ];

  function resetPanels() {
    document.querySelectorAll('[data-panel]').forEach((panel) => panel.classList.remove('is-active'));
    if (rootPanel) rootPanel.classList.remove('is-behind');
  }

  function openMenu() {
    if (!menu) return;
    lastFocus = document.activeElement;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    menuOpen && menuOpen.setAttribute('aria-expanded', 'true');
    window.setTimeout(() => menuClose && menuClose.focus(), 80);
  }

  function closeMenu() {
    if (!menu) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    menuOpen && menuOpen.setAttribute('aria-expanded', 'false');
    resetPanels();
    if (lastFocus) lastFocus.focus();
  }

  function openSearch() {
    if (!search) return;
    lastFocus = document.activeElement;
    search.classList.add('is-open');
    search.setAttribute('aria-hidden', 'false');
    searchOpen && searchOpen.setAttribute('aria-expanded', 'true');
    window.setTimeout(() => searchInput && searchInput.focus(), 80);
  }

  function closeSearch() {
    if (!search) return;
    search.classList.remove('is-open');
    search.setAttribute('aria-hidden', 'true');
    searchOpen && searchOpen.setAttribute('aria-expanded', 'false');
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

  panelTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const panel = document.querySelector('[data-panel="' + trigger.dataset.panelTarget + '"]');
      if (panel) {
        panel.classList.add('is-active');
        rootPanel && rootPanel.classList.add('is-behind');
        const back = panel.querySelector('[data-panel-back]');
        window.setTimeout(() => back && back.focus(), 80);
      }
    });
  });

  panelBacks.forEach((button) => {
    button.addEventListener('click', () => {
      const panel = button.closest('[data-panel]');
      panel && panel.classList.remove('is-active');
      rootPanel && rootPanel.classList.remove('is-behind');
    });
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
    if (event.key === 'Escape') {
      if (menu && menu.classList.contains('is-open')) closeMenu();
      if (search && search.classList.contains('is-open')) closeSearch();
    }
  });
})();
