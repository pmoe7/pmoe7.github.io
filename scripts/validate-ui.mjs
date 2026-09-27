import assert from 'node:assert/strict';
import fs from 'node:fs';

const pages = ['index.html', 'about.html', 'projects.html', 'writing.html', 'covid.html',
  'law.html', 'pairs.html', 'contact.html', 'resume.html', '404.html', 'Hackathon.html'];
const expectedNavigation = ['index.html', 'about.html', 'projects.html', 'writing.html'];
for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  assert.match(html, /<body[^>]*class="[^"]*\bsite-ui\b/, `${page}: shared UI scope`);
  assert.equal((html.match(/css\/ui\.css\?v=3/g) || []).length, 1, `${page}: shared stylesheet`);
  const stylesheets = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(match => match[1]);
  assert.equal(stylesheets.filter(href => href.includes('css/palette.css?v=8')).length, 1, `${page}: one shared palette`);
  assert.ok(stylesheets.at(-1).endsWith('css/palette.css?v=8'), `${page}: palette has final cascade priority`);
  assert.equal((html.match(/js\/site\.js\?v=shared-ui-6/g) || []).length, 1, `${page}: shared behavior`);
  for (const className of ['site-header', 'menu-drawer', 'search-box', 'site-footer']) {
    assert.equal((html.match(new RegExp('class="' + className + '"', 'g')) || []).length, 1, `${page}: one ${className}`);
  }
  assert.equal((html.match(/<main\b/g) || []).length, 1, `${page}: one main landmark`);
  assert.equal((html.match(/<\/main>/g) || []).length, 1, `${page}: main landmark closes`);
  assert.match(html, /class="skip-link" href="#main"/, `${page}: skip link`);
  const links = [...html.matchAll(/<a class="menu-link" href="\/?([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(links, expectedNavigation, `${page}: consistent primary navigation`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${page}: unique IDs`);
  assert.ok(!/css\/home-controls\.css|box-primary-nav|navbar-toggler/.test(html), `${page}: no obsolete navigation`);
  for (const asset of html.matchAll(/(?:href|src)="(\/?(?:css|js)\/[^"?#]+)[^"\s]*"/g)) {
    assert.ok(fs.existsSync(asset[1].replace(/^\//, '')), `${page}: missing ${asset[1]}`);
  }
  assert.ok(page === 'index.html' || !html.includes('js/seasonal-scene.js'), `${page}: seasonal effects stay on home`);
}
const artifact = fs.readFileSync('reports/vaccine-distribution.html', 'utf8');
assert.ok(artifact.includes('pdf2htmlEX'), 'Original presentation is retained');
console.log(`Shared UI validation passed for ${pages.length} pages: navigation, assets, landmarks, and unique IDs.`);
