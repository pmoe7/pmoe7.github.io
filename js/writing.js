(() => {
  const controls = document.querySelector('[data-writing-controls]');
  if (!controls) return;
  const buttons = [...controls.querySelectorAll('[data-writing-filter]')];
  const articles = [...document.querySelectorAll('.essay-row[data-category]')];
  const count = controls.querySelector('[data-writing-count]');
  controls.hidden = false;
  buttons.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.writingFilter;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    articles.forEach(article => {
      article.hidden = category !== 'all' && !article.dataset.category.split(' ').includes(category);
    });
    const total = articles.filter(article => !article.hidden).length;
    count.textContent = `${total} ${total === 1 ? 'article' : 'articles'}`;
  }));
})();
