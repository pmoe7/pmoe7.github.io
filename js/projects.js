(() => {
  const controls = document.querySelector('[data-project-controls]');
  if (!controls) return;
  const cards = [...document.querySelectorAll('[data-project-category]')];
  const filters = [...controls.querySelectorAll('[data-project-filter]')];
  const count = controls.querySelector('[data-project-count]');
  controls.hidden = false;
  filters.forEach(button => button.addEventListener('click', () => {
    const selected = button.dataset.projectFilter;
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    cards.forEach(card => { card.hidden = selected !== 'all' && !card.dataset.projectCategory.split(' ').includes(selected); });
    const total = cards.filter(card => !card.hidden).length;
    count.textContent = `${total} ${total === 1 ? 'project' : 'projects'}`;
  }));

  const dialog = document.querySelector('.work-viewer');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const image = dialog.querySelector('[data-preview-image]');
  const caption = dialog.querySelector('#preview-caption');
  const position = dialog.querySelector('[data-preview-position]');
  let gallery = [], active = 0;
  function openGallery(link) {
    gallery = [...link.closest('article').querySelectorAll('[data-preview]')];
    active = gallery.indexOf(link);
    render();
    dialog.showModal();
  }
  function render() {
    const link = gallery[active];
    image.src = link.href;
    image.alt = link.querySelector('img').alt;
    caption.textContent = link.dataset.caption;
    position.textContent = `${link.closest('article').querySelector('h3').textContent} / ${active + 1} of ${gallery.length}`;
    dialog.querySelector('[data-preview-prev]').hidden = gallery.length < 2;
    dialog.querySelector('[data-preview-next]').hidden = gallery.length < 2;
  }
  function step(direction) { active = (active + direction + gallery.length) % gallery.length; render(); }
  document.querySelectorAll('[data-preview]').forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openGallery(link);
  }));
  document.querySelectorAll('[data-gallery-open]').forEach(trigger => trigger.addEventListener('click', event => {
    event.preventDefault();
    openGallery(trigger.closest('article').querySelector('[data-preview]'));
  }));
  dialog.querySelector('[data-preview-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-preview-prev]').addEventListener('click', () => step(-1));
  dialog.querySelector('[data-preview-next]').addEventListener('click', () => step(1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); step(event.key === 'ArrowLeft' ? -1 : 1); }
    // Keep the site's global overlay shortcuts from handling viewer keystrokes.
    event.stopPropagation();
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
})();
