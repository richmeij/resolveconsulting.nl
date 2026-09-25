const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function page(file, href, storage) {
  const html = fs.readFileSync(file, 'utf8');
  const rootAttrs = Object.fromEntries([...html.match(/<html\b[^>]*>/)[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
  const root = { lang: 'nl', getAttribute: name => rootAttrs[name] || null };
  const buttons = ['nl', 'en'].map(lang => ({
    attrs: { 'data-set-lang': lang }, handlers: {},
    getAttribute(name) { return this.attrs[name]; },
    setAttribute(name, value) { this.attrs[name] = value; },
    addEventListener(name, callback) { this.handlers[name] = callback; }
  }));
  const links = [...html.matchAll(/<a\b[^>]*href="([^"]*)"/g)].map(m => ({
    attrs: { href: m[1] },
    getAttribute(name) { return this.attrs[name]; },
    setAttribute(name, value) { this.attrs[name] = value; },
    removeAttribute(name) { delete this.attrs[name]; }
  }));
  const events = {};
  const document = {
    documentElement: root, title: '',
    querySelector: selector => selector === 'meta[name="description"]' ? { setAttribute() {} } : null,
    querySelectorAll: selector => selector === '[data-set-lang]' ? buttons : selector === 'a[href]' ? links : [],
    getElementById: () => null,
    addEventListener(name, callback) { events[name] = callback; }
  };
  const location = new URL(href);
  const window = { location, addEventListener(name, callback) { events[name] = callback; }, matchMedia: () => ({ matches: true }) };
  const context = vm.createContext({ document, window, location, URL, URLSearchParams, navigator: { languages: ['nl-NL'] }, localStorage: storage });
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
  for (const script of scripts) {
    const src = script[1].match(/src="([^"]*)"/);
    vm.runInContext(src ? fs.readFileSync(src[1].split('?')[0], 'utf8') : script[2], context);
  }
  return { root, links, events, choose(lang) { const button = buttons.find(b => b.attrs['data-set-lang'] === lang); button.handlers.click.call(button); } };
}

const blockedStorage = { getItem() { throw Error('Storage unavailable'); }, setItem() { throw Error('Storage unavailable'); } };
const home = page('index.html', 'https://example.test/index.html', blockedStorage);
home.choose('en');
const backendHref = home.links.find(a => a.attrs.href.includes('backend.html')).attrs.href;
const backend = page('backend.html', new URL(backendHref, 'https://example.test/index.html').href, blockedStorage);
assert.equal(backend.root.lang, 'en', 'EN must survive navigation from home to backend without shared storage');
backend.choose('nl');
const frontendHref = backend.links.find(a => a.attrs.href.includes('frontend.html')).attrs.href;
assert.equal(page('frontend.html', new URL(frontendHref, 'https://example.test/backend.html').href, blockedStorage).root.lang, 'nl');
console.log('PASS: language survives page navigation without shared storage, in both directions.');
// Directly opened files may each have their own storage bucket.
const buckets = new Map();
function fileStorage(file) {
  if (!buckets.has(file)) buckets.set(file, new Map());
  const values = buckets.get(file);
  return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
}
const fileHome = page('index.html', 'file:///site/index.html', fileStorage('index'));
fileHome.choose('en');
const fileLink = fileHome.links.find(a => a.attrs.href.includes('backend.html')).attrs.href;
const fileBackend = page('backend.html', new URL(fileLink, 'file:///site/index.html').href, fileStorage('backend'));
assert.equal(fileBackend.root.lang, 'en', 'File navigation must carry the selected language across isolated storage');
const shared = new Map([['resolve-lang', 'nl']]);
const storage = { getItem: key => shared.get(key), setItem: (key, value) => shared.set(key, value) };
const explicit = page('architectuur.html', 'https://example.test/architectuur.html?lang=en', storage);
explicit.events.pageshow({ persisted: false });
assert.equal(explicit.root.lang, 'en', 'An explicit URL choice wins on initial navigation');
shared.set('resolve-lang', 'nl');
explicit.events.pageshow({ persisted: true });
assert.equal(explicit.root.lang, 'nl', 'Back/forward restoration must refresh the shared choice');
explicit.events.storage({ key: 'resolve-lang', newValue: 'en' });
assert.equal(explicit.root.lang, 'en', 'Other tabs must follow language changes');
assert.equal(page('frontend.html', 'https://example.test/frontend.html?lang=invalid', blockedStorage).root.lang, 'nl');
assert.ok(fileHome.links.filter(a => a.attrs.href.startsWith('mailto:')).every(a => !a.attrs.href.includes('?lang=')));
console.log('PASS: file storage isolation, URL precedence, browser fallback, back/forward restoration and tab synchronization.');

for (const file of ['index.html', 'frontend.html', 'backend.html', 'architectuur.html']) {
  const html = fs.readFileSync(file, 'utf8');
  const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/)[1];
  const title = html.match(/<title>([^<]*)<\/title>/)[1];
  assert.match(html, /property="og:image" content="https:\/\/resolveconsulting\.nl\/assets\/og\.png"/);
  assert.match(html, /property="og:image:width" content="1200"/);
  assert.match(html, /property="og:image:height" content="630"/);
  assert.equal(html.match(/property="og:title" content="([^"]*)"/)[1], title);
  assert.equal(html.match(/property="og:description" content="([^"]*)"/)[1], description);
  assert.equal(html.match(/name="twitter:title" content="([^"]*)"/)[1], title);
  assert.equal(html.match(/name="twitter:description" content="([^"]*)"/)[1], description);
  assert.equal(html.match(/property="og:url" content="([^"]*)"/)[1], html.match(/rel="canonical" href="([^"]*)"/)[1]);
}
console.log('PASS: Open Graph and Twitter tags match each page title, description, and canonical URL.');

function shareDocument(html) {
  const rootAttrs = Object.fromEntries([...html.match(/<html\b[^>]*>/)[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
  const root = { lang: 'nl', getAttribute: name => rootAttrs[name] || null };
  const metas = [...html.matchAll(/<meta\b([^>]*)\/?>/g)].map(m => {
    const attrs = Object.fromEntries([...m[1].matchAll(/([\w:-]+)="([^"]*)"/g)].map(a => [a[1], a[2]]));
    return { attrs, getAttribute: name => attrs[name] || null, setAttribute(name, value) { attrs[name] = value; } };
  });
  const document = {
    documentElement: root,
    title: html.match(/<title>([^<]*)<\/title>/)[1],
    querySelector: selector => metas.find(meta => selector === 'meta[name="description"]' && meta.attrs.name === 'description') || null,
    querySelectorAll: selector => {
      if (selector === 'a[href]' || selector === '[data-set-lang]') return [];
      const wanted = selector.split(',').map(part => part.trim());
      return metas.filter(meta => wanted.some(part => {
        const property = part.match(/property="([^"]+)"/);
        const name = part.match(/name="([^"]+)"/);
        return (property && meta.attrs.property === property[1]) || (name && meta.attrs.name === name[1]);
      }));
    },
    getElementById: () => null,
    addEventListener() {}
  };
  const location = new URL('https://example.test/architectuur.html');
  const window = { location, addEventListener() {}, matchMedia: () => ({ matches: true }) };
  vm.runInContext(fs.readFileSync('language.js', 'utf8'), vm.createContext({
    document, window, location, URL, URLSearchParams,
    navigator: { languages: ['en-US'] },
    localStorage: { getItem: () => null, setItem() {} }
  }));
  const content = (selector) => document.querySelectorAll(selector).map(meta => meta.attrs.content);
  return { root, content };
}
const englishShare = shareDocument(fs.readFileSync('architectuur.html', 'utf8'));
assert.equal(englishShare.root.lang, 'en');
assert.deepEqual(englishShare.content('meta[property="og:title"], meta[name="twitter:title"]'), ['Architecture | Resolve Consulting', 'Architecture | Resolve Consulting']);
assert.deepEqual(englishShare.content('meta[property="og:locale"]'), ['en_US']);
assert.ok(englishShare.content('meta[property="og:description"]')[0].startsWith('Good architecture'));
console.log('PASS: switching language updates the share title, description, and locale.');
