import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/seasonal-scene.js', import.meta.url), 'utf8');

function setup(date, search = '', coarse = false, reducedInitially = false) {
  let now = date;
  let id = 0;
  let interval;
  const frames = new Map();
  const events = {};
  const calls = {};
  const classes = () => {
    const values = new Set();
    return { contains: name => values.has(name), toggle(name, on) { on ? values.add(name) : values.delete(name); } };
  };
  const context = {};
  for (const name of ['setTransform', 'clearRect', 'fillRect', 'beginPath', 'moveTo', 'lineTo',
    'ellipse', 'stroke', 'save', 'translate', 'rotate', 'scale', 'closePath', 'fill', 'restore', 'arc']) {
    context[name] = (...args) => {
      assert.ok(args.every(value => typeof value !== 'number' || Number.isFinite(value)), name + ' has finite coordinates');
      calls[name] = (calls[name] || 0) + 1;
    };
  }
  context.createRadialGradient = (...args) => {
    assert.ok(args.every(Number.isFinite));
    assert.ok(args[5] > 0);
    return { addColorStop() {} };
  };
  const photo = { style: {} };
  const portraitSource = {};
  const scene = { clientWidth: coarse ? 390 : 1440, clientHeight: coarse ? 844 : 900,
    classList: classes(), dataset: {}, querySelector: selector => selector === 'source' ? portraitSource : photo };
  const canvas = { parentElement: scene, getContext: () => context };
  const elements = [];
  function createElement(tag) {
    const element = { tag, children: [], attributes: {},
      setAttribute(name, value) { this.attributes[name] = value; },
      append(...children) { this.children.push(...children); },
      contains(target) { return this === target || this.children.some(child => child.contains(target)); },
      focus() { document.activeElement = this; },
      addEventListener(name, callback) {
        const key = tag === 'details' ? (name === 'change' ? 'pickSeason' : 'pickerKey')
          : tag === 'fieldset' ? 'pickClick' : name;
        events[key] = callback;
      }
    };
    elements.push(element);
    return element;
  }
  const reduced = { matches: reducedInitially, addEventListener(name, callback) { events.reduced = callback; } };
  const document = { hidden: false, documentElement: { classList: classes() },
    querySelector: selector => selector === '[data-scene-weather]' ? canvas : { prepend() {} },
    createElement, addEventListener(name, callback) { events[name] = callback; } };
  const window = { devicePixelRatio: 2, location: { search, pathname: '/index.html', hash: '#main' },
    history: { replaceState(state, title, url) { window.lastUrl = url; window.location.search = url.includes('?') ? '?' + url.split('?')[1].split('#')[0] : ''; } },
    matchMedia: query => query.includes('reduced-motion') ? reduced : { matches: coarse },
    addEventListener(name, callback) { events[name] = callback; }, setInterval(callback) { interval = callback; } };
  vm.runInNewContext(source, { document, window, Intl, URLSearchParams,
    Date: class extends Date { constructor() { super(now); } },
    MutationObserver: class { observe() {} },
    requestAnimationFrame(callback) { frames.set(++id, callback); return id; },
    cancelAnimationFrame(key) { frames.delete(key); }
  });
  const button = elements.find(element => element.tag === 'button');
  const picker = elements.find(element => element.tag === 'details');
  const trigger = elements.find(element => element.tag === 'summary');
  return { scene, photo, portraitSource, calls, events, reduced, document, frames, canvas, button, picker, trigger, window,
    changeDate(value) { now = value; interval(); },
    tick(time) {
      const entry = frames.entries().next().value;
      assert.ok(entry, 'animation frame scheduled');
      frames.delete(entry[0]); entry[1](time);
    }
  };
}

const expected = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer',
  'summer', 'summer', 'fall', 'fall', 'fall', 'winter'];
for (let month = 1; month <= 12; month++) {
  const result = setup(`2026-${String(month).padStart(2, '0')}-15T12:00:00Z`);
  assert.equal(result.scene.dataset.season, expected[month - 1]);
  assert.ok(existsSync(new URL('../' + result.photo.src, import.meta.url)));
  assert.equal(result.photo.src, 'img/seasons/desktop/' + expected[month - 1] + '_desktop_2560x1440.webp', 'use only matching seasonal artwork');
  result.tick(100); result.tick(140);
  const method = { winter: 'arc', spring: 'ellipse', summer: 'fillRect', fall: 'rotate' }[expected[month - 1]];
  assert.ok(result.calls[method] > 0, expected[month - 1] + ' draws its effect');
}

for (const season of ['fall', 'winter', 'spring', 'summer']) {
  const result = setup('2026-09-26T12:00:00Z', '?season=' + season, true);
  assert.equal(result.scene.dataset.season, season);
  result.tick(100); result.tick(140);
  assert.equal(result.canvas.width, 390, 'mobile pixel ratio is capped');
}
assert.equal(setup('2026-09-26T12:00:00Z', '?season=constructor').scene.dataset.season, 'fall');
assert.equal(setup('2026-09-26T12:00:00Z', '?season=invalid').scene.dataset.season, 'fall');

const rollover = setup('2026-12-01T04:59:00Z');
assert.equal(rollover.scene.dataset.season, 'fall', 'still November in New York');
rollover.changeDate('2026-12-01T05:00:00Z');
assert.equal(rollover.scene.dataset.season, 'winter');
assert.equal(rollover.photo.src, 'img/seasons/desktop/winter_desktop_2560x1440.webp');

const result = setup('2026-09-26T12:00:00Z');
result.events.click(); assert.equal(result.frames.size, 0); assert.equal(result.button.attributes['aria-label'], 'Play scene');
result.events.click(); assert.equal(result.frames.size, 1);
result.document.hidden = true; result.events.visibilitychange(); assert.equal(result.frames.size, 0);
result.document.hidden = false; result.events.visibilitychange(); assert.equal(result.frames.size, 1);
result.reduced.matches = true; result.events.reduced(); assert.equal(result.frames.size, 0);
result.reduced.matches = false; result.events.reduced(); assert.equal(result.frames.size, 1);
result.document.documentElement.classList.toggle('menu-open', true);
result.events.visibilitychange(); assert.equal(result.frames.size, 0);
const still = setup('2026-09-26T12:00:00Z', '', false, true);
assert.equal(still.frames.size, 0);
assert.equal(still.photo.src, 'img/seasons/desktop/fall_desktop_2560x1440.webp', 'seasonal image still loads with reduced motion');
const webp = readFileSync(new URL('../img/seasons/desktop/fall_desktop_2560x1440.webp', import.meta.url));
assert.equal(webp.subarray(8, 12).toString(), 'WEBP');
const switched = setup('2026-09-26T12:00:00Z', '?intro=1');
assert.equal(switched.trigger.textContent, 'Auto');
switched.events.click(); // Changing the season must preserve the user's pause.
switched.events.pickSeason({ target: { name: 'scene-season', value: 'winter' } });
assert.equal(switched.scene.dataset.season, 'winter');
assert.equal(switched.photo.src, 'img/seasons/desktop/winter_desktop_2560x1440.webp');
assert.equal(switched.frames.size, 0);
assert.equal(switched.window.lastUrl, '/index.html?intro=1&season=winter#main');
switched.events.pickSeason({ target: { name: 'scene-season', value: 'auto' } });
assert.equal(switched.scene.dataset.season, 'fall');
assert.equal(switched.window.lastUrl, '/index.html?intro=1#main');
still.events.pickSeason({ target: { name: 'scene-season', value: 'winter' } });
assert.equal(still.photo.src, 'img/seasons/desktop/winter_desktop_2560x1440.webp');
assert.equal(still.frames.size, 0, 'season picker works without enabling reduced-motion animations');
console.log('Passed: manual season selection, Auto reset, shareable URLs, and switching while paused or using reduced motion.');
assert.equal(still.trigger.textContent, 'Winter');
switched.picker.open = true;
switched.events.pickerKey({ key: 'Escape', preventDefault() {}, stopPropagation() {} });
assert.equal(switched.picker.open, false);
assert.equal(switched.document.activeElement, switched.trigger);
switched.picker.open = true;
switched.events.pointerdown({ target: switched.trigger });
assert.equal(switched.picker.open, true, 'inside clicks leave picker open');
switched.events.pointerdown({ target: {} });
assert.equal(switched.picker.open, false);
switched.picker.open = true;
switched.events.pickClick({ target: { name: 'scene-season' } });
assert.equal(switched.picker.open, false);
assert.equal(switched.document.activeElement, switched.trigger);
console.log('Passed: custom season picker labels, Escape, outside click, selection dismissal, and focus restoration.');
const seasonNames = ['winter', 'spring', 'summer', 'fall'];
for (const [width, height] of [[1448, 1086], [1920, 1080], [320, 640], [390, 844], [430, 932], [760, 640], [844, 390]]) {
  for (const name of seasonNames) {
    const view = setup('2026-09-26T12:00:00Z', '?season=' + name);
    view.scene.clientWidth = width; view.scene.clientHeight = height;
    view.events.resize();
    const renderedWidth = parseFloat(view.photo.style.width);
    const renderedHeight = parseFloat(view.photo.style.height);
    const left = parseFloat(view.photo.style.left);
    const top = parseFloat(view.photo.style.top);
    assert.ok(left <= .01 && top <= .01 && left + renderedWidth >= width - .01 && top + renderedHeight >= height - .01, name + ' fills the viewport without gaps');
    const aspect = width <= height ? 1440 / 2560 : 2560 / 1440;
    assert.equal(view.portraitSource.srcset, 'img/seasons/mobile/' + name + '_mobile_1440x2560.webp');
    assert.ok(existsSync(new URL('../' + view.portraitSource.srcset, import.meta.url)));
    assert.equal(view.photo.src, 'img/seasons/desktop/' + name + '_desktop_2560x1440.webp');
    assert.ok(Math.abs(renderedWidth / renderedHeight - aspect) < .001, name + ' preserves image proportions');
    assert.ok(Math.abs(renderedWidth - width) < .01 || Math.abs(renderedHeight - height) < .01, name + ' uses the minimum scale needed to cover');
    assert.ok(Math.abs(left * 2 + renderedWidth - width) < .01 && Math.abs(top * 2 + renderedHeight - height) < .01, name + ' centers the composition');
  }
}
console.log('Passed: full landing coverage, minimum zoom, and responsive compositions on desktop, tablet, and mobile.');
console.log('Passed: all 12 months, four effects, mobile, preview validation, New York rollover, image assets, pause, visibility, menu, and reduced motion.');
