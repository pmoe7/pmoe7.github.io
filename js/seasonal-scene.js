(function () {
  'use strict';

  const canvas = document.querySelector('[data-scene-weather]');
  if (!canvas) return;
  const scene = canvas.parentElement;
  const photo = scene.querySelector('img');
  const portraitSource = scene.querySelector('source');
  // Northern Hemisphere seasons, using the site's New York time zone.
  // Each season uses its matching portrait artwork.
  const seasons = {
    winter: { effect: 'snow', count: 110, lamps: { desktop: [[.532, .395], [.614, .528]], mobile: [[.968, .18], [.17, .23]] } },
    spring: { effect: 'rain', count: 150, lamps: { desktop: [[.54, .39], [.611, .499]], mobile: [[.968, .19], [.19, .25]] } },
    summer: { effect: 'fireflies', count: 24, lamps: { desktop: [[.545, .39], [.619, .495]], mobile: [[.968, .19], [.195, .25]] } },
    fall: { effect: 'leaves', count: 36, lamps: { desktop: [[.528, .398], [.624, .51]], mobile: [[.968, .18], [.17, .24]] } }
  };
  const monthFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'numeric' });
  // Optional preview links: ?season=fall, winter, spring, or summer.
  const preview = new URLSearchParams(window.location.search).get('season');
  let selection = Object.prototype.hasOwnProperty.call(seasons, preview) ? preview : 'auto';
  let seasonName = '';
  let season;
  let imageFrame;

  function layoutPhoto() {
    const viewportWidth = scene.clientWidth;
    const viewportHeight = scene.clientHeight;
    const portrait = viewportWidth <= viewportHeight;
    const sourceWidth = portrait ? 1440 : 2560;
    const sourceHeight = portrait ? 2560 : 1440;
    // Match the picture source and cover with only the minimum necessary crop.
    const fit = Math.max(viewportWidth / sourceWidth, viewportHeight / sourceHeight);
    imageFrame = {
      variant: portrait ? 'mobile' : 'desktop',
      width: sourceWidth * fit,
      height: sourceHeight * fit,
      x: (viewportWidth - sourceWidth * fit) * .5,
      y: (viewportHeight - sourceHeight * fit) * .5
    };
    photo.style.width = imageFrame.width + 'px';
    photo.style.height = imageFrame.height + 'px';
    photo.style.left = imageFrame.x + 'px';
    photo.style.top = imageFrame.y + 'px';
  }

  function selectSeason() {
    const month = Number(monthFormatter.format(new Date()));
    const name = selection !== 'auto' ? selection
      : month >= 9 && month <= 11 ? 'fall'
      : month >= 6 && month <= 8 ? 'summer'
      : month >= 3 && month <= 5 ? 'spring' : 'winter';
    if (name === seasonName) return false;
    seasonName = name;
    season = seasons[name];
    scene.dataset.season = name;
    portraitSource.srcset = 'img/seasons/mobile/' + name + '_mobile_1440x2560.webp';
    photo.src = 'img/seasons/desktop/' + name + '_desktop_2560x1440.webp';
    layoutPhoto();
    return true;
  }

  selectSeason();
  const context = canvas.getContext('2d');
  if (!context) return;
  const controls = document.querySelector('.topbar-actions');
  const picker = document.createElement('details');
  picker.className = 'season-picker';
  const trigger = document.createElement('summary');
  trigger.className = 'season-trigger';
  const options = document.createElement('fieldset');
  options.className = 'season-options';
  const legend = document.createElement('legend');
  legend.className = 'sr-only';
  legend.textContent = 'Background season';
  options.append(legend);
  const labels = { auto: 'Auto', spring: 'Spring', summer: 'Summer', fall: 'Fall', winter: 'Winter' };
  const choices = [];
  for (const [value, label] of Object.entries(labels)) {
    const row = document.createElement('label');
    row.className = 'season-choice';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'scene-season';
    input.value = value;
    const caption = document.createElement('span');
    caption.textContent = label;
    const mark = document.createElement('span');
    mark.className = 'season-choice-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = '\u2713';
    row.append(input, caption, mark);
    options.append(row);
    choices.push(input);
  }
  picker.append(trigger, options);
  function updatePicker() {
    trigger.textContent = labels[selection];
    trigger.setAttribute('aria-label', 'Background season: ' + labels[selection]);
    choices.forEach(input => { input.checked = input.value === selection; });
  }
  function closePicker(restoreFocus = false) {
    picker.open = false;
    if (restoreFocus) trigger.focus();
  }
  updatePicker();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(pointer: coarse)');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'icon-button scene-toggle';
  function updateButton(isPaused) {
    const label = isPaused ? 'Play scene' : 'Pause scene';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.innerHTML = '<svg class="lucide" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + (isPaused ? '<path d="m8 5 12 7-12 7V5Z"/>' : '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>')
      + '</svg>';
  }
  updateButton(false);
  controls && controls.prepend(button);
  controls && controls.prepend(picker);

  let width = 0;
  let height = 0;
  let particles = [];
  let frame = 0;
  let lastTime = 0;
  let elapsed = 0;
  let paused = false;
  let visible = true;

  // Coordinates follow the photograph's cover crop, including on narrow screens.
  function point(x, y) {
    return [imageFrame.x + x * imageFrame.width, imageFrame.y + y * imageFrame.height];
  }

  function resize() {
    width = scene.clientWidth;
    height = scene.clientHeight;
    layoutPhoto();
    const ratio = Math.min(window.devicePixelRatio || 1, mobile.matches ? 1 : 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const density = Math.min(1, Math.max(.4, width * height / 1200000));
    const count = Math.round(season.count * density * (mobile.matches ? .7 : 1));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * (width + 50), y: Math.random() * height,
      depth: .3 + Math.random() * .7, phase: Math.random() * Math.PI * 2,
      color: Math.floor(Math.random() * 4)
    }));
  }

  function glow(x, y, radius, strength) {
    const [px, py] = point(x, y);
    const gradient = context.createRadialGradient(px, py, 0, px, py, radius);
    gradient.addColorStop(0, 'rgba(255, 177, 69, ' + strength + ')');
    gradient.addColorStop(1, 'rgba(255, 146, 38, 0)');
    context.fillStyle = gradient;
    context.fillRect(px - radius, py - radius, radius * 2, radius * 2);
  }

  function animateLamp(x, y, size, phase) {
    // Scale with the photograph so the light stays inside the lantern at every crop.
    const imageSpan = point(1, 0)[0] - point(0, 0)[0];
    const t = elapsed + phase;
    const warmth = .5 + Math.sin(t * 1.65) * .27
      + Math.sin(t * 4.3) * .08 + Math.sin(t * 6.7) * .035;
    const swayX = Math.sin(t * .9) * .0012;
    const swayY = Math.cos(t * 1.1) * .0008;
    const radius = imageSpan * size;

    // A bright core, amber glass, and a wider breathing halo move independently.
    glow(x + swayX, y + swayY, radius * .22, .2 + warmth * .5);
    glow(x, y, radius * .55, .12 + warmth * .3);
    glow(x + swayX * 2, y, radius * (1.8 + warmth * .45), .07 + warmth * .18);
  }

  function drawLeaf(particle) {
    const size = 5 + particle.depth * 8;
    context.save();
    context.translate(particle.x, particle.y);
    context.rotate(Math.sin(elapsed * .8 + particle.phase) * .8 + particle.phase);
    context.scale(.45 + Math.abs(Math.cos(elapsed * 1.3 + particle.phase)) * .55, 1);
    context.globalAlpha = .45 + particle.depth * .4;
    context.fillStyle = ['#c46a24', '#e7a342', '#a94422', '#d78932'][particle.color];
    context.beginPath();
    // A small lobed maple leaf, with a tapered stem and a central vein.
    const outline = [[0,-1], [.25,-.45], [.65,-.65], [.52,-.18], [1,-.22],
      [.66,.18], [.8,.46], [.22,.48], [0,.8], [-.22,.48], [-.8,.46],
      [-.66,.18], [-1,-.22], [-.52,-.18], [-.65,-.65], [-.25,-.45]];
    outline.forEach(([x, y], index) => {
      if (index === 0) context.moveTo(x * size, y * size);
      else context.lineTo(x * size, y * size);
    });
    context.closePath();
    context.fill();
    context.strokeStyle = 'rgba(77, 36, 16, .5)';
    context.lineWidth = .7;
    context.beginPath();
    context.moveTo(0, -size * .7);
    context.lineTo(0, size * 1.12);
    context.stroke();
    context.restore();
  }

  function drawParticles(dt) {
    for (const particle of particles) {
      const { depth, phase } = particle;
      if (season.effect === 'rain') {
        particle.y += (230 + depth * 380) * dt;
        particle.x -= (22 + depth * 35) * dt;
        const length = 7 + depth * 17;
        context.strokeStyle = 'rgba(191, 224, 237, ' + (.09 + depth * .19) + ')';
        context.lineWidth = .45 + depth * .55;
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(particle.x + length * .1, particle.y - length);
        context.stroke();
      } else if (season.effect === 'leaves') {
        particle.y += (18 + depth * 30) * dt;
        particle.x += (18 + Math.sin(elapsed * .45) * 15 + Math.sin(elapsed + phase) * 24) * dt;
        drawLeaf(particle);
      } else if (season.effect === 'snow') {
        particle.y += (12 + depth * 24) * dt;
        particle.x += Math.sin(elapsed * .6 + phase) * 17 * dt;
        context.fillStyle = 'rgba(228, 240, 247, ' + (.2 + depth * .45) + ')';
        context.beginPath();
        context.arc(particle.x, particle.y, .6 + depth * 1.8, 0, Math.PI * 2);
        context.fill();
      } else {
        particle.x += Math.sin(elapsed * .7 + phase) * 9 * dt;
        particle.y += Math.cos(elapsed * .5 + phase) * 6 * dt;
        const brightness = Math.pow(.5 + Math.sin(elapsed * 1.4 + phase) * .5, 2);
        const radius = 3 + depth * 5;
        const light = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, radius);
        light.addColorStop(0, 'rgba(255, 230, 139, ' + brightness * .7 + ')');
        light.addColorStop(1, 'rgba(255, 195, 64, 0)');
        context.fillStyle = light;
        context.fillRect(particle.x - radius, particle.y - radius, radius * 2, radius * 2);
      }
      if (particle.y > height + 30) { particle.y = -30; particle.x = Math.random() * width; }
      if (particle.y < -30) particle.y = height + 30;
      if (particle.x < -30) particle.x = width + 30;
      if (particle.x > width + 30) particle.x = -30;
    }
  }

  function draw(time) {
    frame = requestAnimationFrame(draw);
    if (!lastTime) { lastTime = time; return; }
    const delta = time - lastTime;
    if (delta < 1000 / 30) return;
    lastTime = time;
    const dt = Math.min(delta / 1000, .07);
    elapsed += dt;
    context.clearRect(0, 0, width, height);

    // Slow warm light fluctuations, without flashes or lightning.
    context.globalCompositeOperation = 'screen';
    const pulse = .12 + Math.sin(elapsed * 1.3) * .025 + Math.sin(elapsed * 3.1) * .012;
    const glowSize = Math.min(width, height) * .085;
    const lamps = season.lamps[imageFrame.variant];
    animateLamp(lamps[0][0], lamps[0][1], .035, 0);
    animateLamp(lamps[1][0], lamps[1][1], .047, 2.4);
    glow(.198, seasonName === 'fall' ? .29 : .332, glowSize * 1.4, pulse * .55);
    glow(.754, .82, glowSize * 1.6, pulse * .3);
    context.globalCompositeOperation = 'source-over';

    drawParticles(dt);

    // Small elliptical rings stay on the wet street, away from the portrait.
    for (let i = 0; season.effect === 'rain' && i < 9; i++) {
      const phase = (elapsed * .55 + i / 9) % 1;
      const [x, y] = point(.64 + ((i * .137) % .27), .79 + ((i * .071) % .2));
      const radius = (3 + phase * 18) * Math.max(.6, height / 1086);
      context.strokeStyle = 'rgba(238, 190, 116, ' + (.19 * (1 - phase)) + ')';
      context.lineWidth = .7;
      context.beginPath();
      context.ellipse(x, y, radius, radius * .22, 0, 0, Math.PI * 2);
      context.stroke();
    }
  }

  function sync() {
    if (selectSeason()) resize();
    const stopped = paused || reducedMotion.matches || document.hidden || !visible
      || document.documentElement.classList.contains('menu-open')
      || document.documentElement.classList.contains('search-open');
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    if (reducedMotion.matches) context.clearRect(0, 0, width, height);
    if (!stopped) frame = requestAnimationFrame(draw);
  }

  picker.addEventListener('change', event => {
    if (event.target.name !== 'scene-season') return;
    selection = Object.prototype.hasOwnProperty.call(seasons, event.target.value) ? event.target.value : 'auto';
    updatePicker();
    sync();
    // Keep the chosen season in the URL for refreshing and sharing the scene.
    const params = new URLSearchParams(window.location.search);
    if (selection === 'auto') params.delete('season');
    else params.set('season', selection);
    const query = params.toString();
    try {
      window.history.replaceState(null, '', window.location.pathname + (query ? '?' + query : '') + window.location.hash);
    } catch (_) { /* Local file previews may not allow history updates. */ }
  });
  // Native radio keys handle arrow navigation; pointer selection closes the panel.
  options.addEventListener('click', event => {
    if (event.target.name === 'scene-season') closePicker(true);
  });
  picker.addEventListener('keydown', event => {
    if (picker.open && (event.key === 'Escape' || (event.key === 'Enter' && event.target !== trigger))) {
      event.preventDefault();
      event.stopPropagation();
      closePicker(true);
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!picker.contains(event.target)) closePicker();
  });
  document.addEventListener('focusin', event => {
    if (!picker.contains(event.target)) closePicker();
  });
  button.addEventListener('click', () => {
    paused = !paused;
    updateButton(paused);
    sync();
  });
  reducedMotion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  // Refresh at month boundaries even if the homepage is left open overnight.
  window.setInterval(() => { if (!document.hidden && selectSeason()) { resize(); sync(); } }, 60000);
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(scene);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(scene);
  else window.addEventListener('resize', resize, { passive: true });
  resize();
  sync();
})();
