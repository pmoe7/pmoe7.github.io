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
  const profileSilhouetteCanvas = document.querySelector('[data-profile-silhouette]');
  const themeMedia = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;
  const aboutOpening = document.querySelector('[data-about-opening]');
  const aboutOpeningSkip = document.querySelector('[data-about-opening-skip]');
  const aboutRevealItems = document.querySelectorAll('.about-reveal:not(.about-principle)');
  const aboutPrincipleItems = document.querySelectorAll('.about-principle');
  const aboutPrincipleToggles = document.querySelectorAll('[data-principle-toggle]');
  const headerToneSections = document.querySelectorAll('.about-theme-section[data-header-tone], .writing-theme-section[data-header-tone], .projects-theme-section[data-header-tone], .case-theme-section[data-header-tone]');
  let lastFocus = null;

  function initKineticOrb(canvas) {
    if (!canvas || !canvas.getContext) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileMedia = window.matchMedia('(max-width: 760px)');
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    let points = [];
    let width = 0;
    let height = 0;
    let animationFrame = null;

    const buildPoints = () => {
      const count = mobileMedia.matches ? 270 : 520;
      points = Array.from({ length: count }, (_, index) => {
        const y = 1 - (index / (count - 1)) * 2;
        const radius = Math.sqrt(1 - y * y);
        const theta = goldenAngle * index;
        return {
          x: Math.cos(theta) * radius,
          y,
          z: Math.sin(theta) * radius,
          phase: (index * 1.61803398875) % (Math.PI * 2)
        };
      });
    };

    const draw = (timeSeconds) => {
      context.clearRect(0, 0, width, height);
      const centerX = width * .5;
      const centerY = height * .5;
      const sphereRadius = Math.min(width, height) * .255;
      const rotationY = timeSeconds * .15;
      const rotationX = -.18 + Math.sin(timeSeconds * .18) * .08;
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);
      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      const isLight = document.documentElement.dataset.theme === 'light';

      const projected = points.map((point) => {
        const x1 = point.x * cosY - point.z * sinY;
        const z1 = point.x * sinY + point.z * cosY;
        const y2 = point.y * cosX - z1 * sinX;
        const z2 = point.y * sinX + z1 * cosX;
        const wave = .5 + .5 * Math.sin(point.phase + timeSeconds * 1.35 + x1 * 4.4 - y2 * 3.1);
        const ridge = Math.pow(wave, 2.15);
        const barLength = sphereRadius * (.075 + ridge * .34);
        const perspective = 1 + z2 * .12;
        const baseRadius = sphereRadius * perspective;
        const tipRadius = (sphereRadius + barLength) * perspective;
        return {
          z: z2,
          baseX: centerX + x1 * baseRadius,
          baseY: centerY + y2 * baseRadius,
          tipX: centerX + x1 * tipRadius,
          tipY: centerY + y2 * tipRadius,
          ridge
        };
      }).sort((a, b) => a.z - b.z);

      const glow = context.createRadialGradient(centerX - sphereRadius * .24, centerY - sphereRadius * .28, 0, centerX, centerY, sphereRadius * 1.08);
      if (isLight) {
        glow.addColorStop(0, 'rgba(101, 28, 44, .2)');
        glow.addColorStop(.58, 'rgba(59, 43, 47, .1)');
        glow.addColorStop(1, 'rgba(38, 30, 32, 0)');
      } else {
        glow.addColorStop(0, 'rgba(244, 241, 232, .18)');
        glow.addColorStop(.58, 'rgba(169, 166, 158, .08)');
        glow.addColorStop(1, 'rgba(120, 116, 109, 0)');
      }
      context.fillStyle = glow;
      context.beginPath();
      context.arc(centerX, centerY, sphereRadius * 1.08, 0, Math.PI * 2);
      context.fill();

      projected.forEach((bar) => {
        const depth = (bar.z + 1) * .5;
        const luminance = Math.round((isLight ? 50 : 118) + depth * (isLight ? 80 : 116) + bar.ridge * 22);
        const alpha = .2 + depth * .63;
        const thickness = 1.15 + depth * 2.85;
        context.lineCap = 'square';
        context.lineWidth = thickness;
        context.strokeStyle = isLight
          ? 'rgba(' + Math.round(luminance * .72) + ',' + Math.round(luminance * .58) + ',' + Math.round(luminance * .61) + ',' + alpha + ')'
          : 'rgba(' + luminance + ',' + luminance + ',' + Math.min(255, luminance + 3) + ',' + alpha + ')';
        context.beginPath();
        context.moveTo(bar.baseX, bar.baseY);
        context.lineTo(bar.tipX, bar.tipY);
        context.stroke();

        if (depth > .46) {
          const cap = thickness * (1 + bar.ridge * .42);
          context.fillStyle = isLight
            ? 'rgba(120, 94, 99,' + (alpha * .82) + ')'
            : 'rgba(224, 223, 218,' + (alpha * .74) + ')';
          context.fillRect(bar.tipX - cap / 2, bar.tipY - cap / 2, cap, cap);
        }
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      buildPoints();
      if (motionMedia.matches) draw(2.4);
    };

    const animate = (timestamp) => {
      draw(timestamp * .001);
      animationFrame = window.requestAnimationFrame(animate);
    };

    const syncMotion = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
      if (motionMedia.matches) draw(2.4);
      else animationFrame = window.requestAnimationFrame(animate);
    };

    const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    if (resizeObserver) resizeObserver.observe(canvas);
    else window.addEventListener('resize', resize, { passive: true });
    if (typeof motionMedia.addEventListener === 'function') motionMedia.addEventListener('change', syncMotion);
    if (typeof mobileMedia.addEventListener === 'function') mobileMedia.addEventListener('change', resize);
    resize();
    syncMotion();
  }

  function initProfileSilhouette(canvas) {
    if (!canvas || !canvas.getContext) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileMedia = window.matchMedia('(max-width: 760px)');
    const sourceCanvas = document.createElement('canvas');
    const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
    const portrait = new Image();
    let particles = [];
    let width = 0;
    let height = 0;
    let animationFrame = null;
    let portraitReady = false;

    const buildPortrait = () => {
      if (!portraitReady || !width || !height || !sourceContext) return;
      const sampleSize = mobileMedia.matches ? 216 : 300;
      const step = 5;
      sourceCanvas.width = sampleSize;
      sourceCanvas.height = sampleSize;
      sourceContext.clearRect(0, 0, sampleSize, sampleSize);
      const cropSize = Math.min(portrait.naturalWidth, portrait.naturalHeight);
      const cropX = (portrait.naturalWidth - cropSize) * .5;
      sourceContext.drawImage(portrait, cropX, 0, cropSize, cropSize, 0, 0, sampleSize, sampleSize);
      const pixels = sourceContext.getImageData(0, 0, sampleSize, sampleSize).data;

      const portraitSize = Math.min(width, height) * .94;
      const left = (width - portraitSize) * .5;
      const top = (height - portraitSize) * .5;
      particles = [];

      for (let y = 0; y < sampleSize; y += step) {
        for (let x = 0; x < sampleSize; x += step) {
          const pixelIndex = (y * sampleSize + x) * 4;
          const luminance = (pixels[pixelIndex] * .2126 + pixels[pixelIndex + 1] * .7152 + pixels[pixelIndex + 2] * .0722) / 255;
          const normalizedX = x / sampleSize;
          const normalizedY = y / sampleSize;
          const nx = normalizedX - .5;
          const ink = Math.max(0, Math.min(1, (1 - luminance - .05) * 1.32));
          const headMask = normalizedY < .7
            && Math.pow(nx / .37, 2) + Math.pow((normalizedY - .36) / .39, 2) < 1.08;
          const neckWidth = Math.max(.075, .27 - Math.max(0, normalizedY - .66) * .62);
          const neckMask = normalizedY >= .62 && normalizedY < .97 && Math.abs(nx) < neckWidth;
          const hash = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
          if ((!headMask && !neckMask) || ink < .07 || hash > .08 + ink * .98) continue;

          particles.push({
            x: left + (normalizedX + (hash - .5) * .012) * portraitSize,
            y: top + (normalizedY + (hash - .5) * .01) * portraitSize,
            nx,
            ny: normalizedY - .5,
            ink,
            size: .62 + ink * 3.45 + hash * 1.35,
            seed: (x * 12.9898 + y * 78.233) % (Math.PI * 2)
          });
        }
      }
    };

    const draw = (timeSeconds) => {
      context.clearRect(0, 0, width, height);
      if (!particles.length) return;
      const isLight = document.documentElement.dataset.theme === 'light';

      particles.forEach((particle) => {
        const wave = Math.sin(timeSeconds * .82 + particle.nx * 8 - particle.ny * 5 + particle.seed);
        const depth = .5 + wave * .5;
        const driftX = wave * (1.15 + (1 - particle.ink) * 1.2);
        const driftY = Math.cos(timeSeconds * .67 + particle.seed) * 1.35;
        const radius = particle.size * (.83 + depth * .24);
        const alpha = .35 + particle.ink * .58 + depth * .08;
        const colorLift = Math.round(depth * 24 + (1 - particle.ink) * 13);

        context.fillStyle = isLight
          ? 'rgba(' + (37 + colorLift) + ',' + (61 + colorLift) + ',' + (91 + colorLift) + ',' + alpha + ')'
          : 'rgba(' + (181 + colorLift) + ',' + (190 + colorLift) + ',' + (202 + colorLift) + ',' + alpha + ')';
        context.beginPath();
        context.arc(particle.x + driftX, particle.y + driftY, radius, 0, Math.PI * 2);
        context.fill();
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      buildPortrait();
      if (motionMedia.matches) draw(1.8);
    };

    const animate = (timestamp) => {
      draw(timestamp * .001);
      animationFrame = window.requestAnimationFrame(animate);
    };

    const syncMotion = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
      if (motionMedia.matches) draw(1.8);
      else animationFrame = window.requestAnimationFrame(animate);
    };

    portrait.addEventListener('load', () => {
      portraitReady = true;
      buildPortrait();
      syncMotion();
    });
    portrait.src = canvas.dataset.portraitSrc;

    const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    if (resizeObserver) resizeObserver.observe(canvas);
    else window.addEventListener('resize', resize, { passive: true });
    if (typeof motionMedia.addEventListener === 'function') motionMedia.addEventListener('change', syncMotion);
    if (typeof mobileMedia.addEventListener === 'function') mobileMedia.addEventListener('change', resize);
    resize();
  }

  initProfileSilhouette(profileSilhouetteCanvas);

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

  if (landingIntro) {
    try { sessionStorage.setItem('mp-intro-v2', '1'); } catch (error) { /* Storage is optional. */ }
  }

  if (aboutOpening) {
    const reduceMotion = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
      }, skip ? 370 : 640);
    };

    if (reduceMotion) {
      aboutOpening.hidden = true;
    } else {
      document.documentElement.classList.add('about-opening-active');
      window.scrollTo(0, 0);
      window.addEventListener('wheel', preventOpeningScroll, { passive: false });
      window.addEventListener('touchmove', preventOpeningScroll, { passive: false });
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => aboutOpening.classList.add('is-running')));
      openingTimer = window.setTimeout(() => finishAboutOpening(false), 1580);
      aboutOpeningSkip && aboutOpeningSkip.addEventListener('click', () => finishAboutOpening(true));
      document.addEventListener('keydown', (event) => {
        if (openingFinished) return;
        if (event.key === 'Escape') finishAboutOpening(true);
        if ([' ', 'ArrowDown', 'PageDown', 'End'].includes(event.key)) event.preventDefault();
      });
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
    { label: 'Home — Mohammed Perves', url: 'index.html' },
    { label: 'About Mohammed Perves', url: 'about.html' },
    { label: 'Projects — AI, data products, and machine learning', url: 'projects.html' },
    { label: 'Equitable vaccine distribution — machine learning case study', url: 'covid.html' },
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
