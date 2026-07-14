'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const runtimeFiles = [
  'assets/js/share.js',
  'assets/js/feedback.js',
  'assets/js/live-alert-ticker.js',
  'assets/js/hurricane-atlas.js',
  'assets/js/page-language-toggle.js'
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function fakeElement(tagName) {
  return {
    tagName: String(tagName || '').toUpperCase(),
    className: '',
    dataset: {},
    innerHTML: '',
    attributes: {},
    addEventListener() {},
    appendChild() {},
    querySelector() { return null; },
    setAttribute(name, value) { this.attributes[name] = String(value); }
  };
}

function loadShare(language) {
  const body = fakeElement('body');
  const document = {
    body,
    documentElement: { lang: language },
    readyState: 'loading',
    title: 'Fallback title — Hurricane Coast',
    addEventListener() {},
    createElement: fakeElement,
    querySelector(selector) {
      if (selector === 'meta[property="og:title"]') {
        return { content: 'Localized guide title' };
      }
      if (selector === 'meta[name="description"]') {
        return { content: 'Localized guide description' };
      }
      if (selector === 'link[rel="canonical"]') {
        return { href: 'https://hurricanecoast.me/example' };
      }
      return null;
    },
    querySelectorAll() { return []; }
  };
  const window = {
    location: { href: 'https://hurricanecoast.me/fallback' },
    setTimeout() {}
  };
  const context = {
    console,
    document,
    navigator: {},
    window
  };

  window.window = window;
  vm.runInNewContext(read('assets/js/share.js'), context, { filename: 'share.js' });
  return window.HurricaneShare;
}

test('runtime scripts parse as standalone browser scripts', () => {
  runtimeFiles.forEach((relativePath) => {
    assert.doesNotThrow(() => new vm.Script(read(relativePath), { filename: relativePath }));
  });
});

test('share runtime derives language, metadata, and intent URLs without changing canonical data', () => {
  const share = loadShare('es-PR');

  assert.equal(share.getLanguage(), 'es');
  assert.deepEqual(
    JSON.parse(JSON.stringify(share.getShareData())),
    {
      title: 'Localized guide title',
      text: 'Localized guide description',
      url: 'https://hurricanecoast.me/example'
    }
  );
  assert.equal(
    share.buildEmailURL('Guía costera', 'https://hurricanecoast.me/es/example'),
    'mailto:?subject=Gu%C3%ADa%20costera&body=https%3A%2F%2Fhurricanecoast.me%2Fes%2Fexample'
  );
  assert.equal(
    share.buildSmsURL('Guía costera', 'https://hurricanecoast.me/es/example'),
    'sms:?body=Gu%C3%ADa%20costera%20https%3A%2F%2Fhurricanecoast.me%2Fes%2Fexample'
  );
});

test('share and support UI are localized and deprecated floating effects are not created', () => {
  const share = loadShare('es');
  const supportCard = share.createSupportCard();
  const shareSource = read('assets/js/share.js');

  assert.equal(supportCard.attributes['aria-label'], 'Apoye este sitio');
  assert.match(supportCard.innerHTML, /Si esta guía le ayudó/);
  assert.doesNotMatch(shareSource, /function createRadar/);
  assert.doesNotMatch(shareSource, /createShareButton\(['"]floating-share-btn/);
  assert.match(shareSource, /createShareButton\(['"]inline-share-btn/);
});

test('Atlas reads every documented visual token from CSS with category fallbacks', () => {
  const atlasSource = read('assets/js/hurricane-atlas.js');
  const customProperties = [
    '--atlas-map-background', '--atlas-map-water', '--atlas-map-land',
    '--atlas-map-park', '--atlas-map-building', '--atlas-map-water-line',
    '--atlas-map-road', '--atlas-map-boundary', '--atlas-map-text',
    '--atlas-map-text-halo', '--atlas-track-casing', '--atlas-selected-track',
    '--atlas-landfall-fill', '--atlas-landfall-stroke', '--atlas-category-0',
    '--atlas-category-1', '--atlas-category-2', '--atlas-category-3',
    '--atlas-category-4', '--atlas-category-5'
  ];

  customProperties.forEach((property) => assert.ok(atlasSource.includes(property), property));
  assert.match(atlasSource, /window\.getComputedStyle\(root\)/);
  assert.match(atlasSource, /ATLAS_COLORS\.selectedTrack/);
  assert.match(atlasSource, /CATEGORY_COLORS\[point\.category\]/);
});

test('live alerts expose localized loading, empty, active, and error states with accessible motion controls', () => {
  const tickerSource = read('assets/js/live-alert-ticker.js');
  const siteCss = read('assets/css/site.css');

  ['loading', 'empty', 'ready', 'error'].forEach((state) => {
    assert.match(tickerSource, new RegExp(`setTickerState\\(['"]${state}['"]\\)`), state);
  });
  assert.match(tickerSource, /No active NWS tropical alerts right now\./);
  assert.match(tickerSource, /No hay alertas tropicales activas del NWS/);
  assert.match(tickerSource, /Unable to load live NWS tropical alerts/);
  assert.match(tickerSource, /No se pudieron cargar las alertas tropicales/);
  assert.match(tickerSource, /item\.dataset\.level\s*=\s*\/Watch\$\//);
  assert.match(tickerSource, /visualClone\.setAttribute\(['"]aria-hidden['"], ['"]true['"]\)/);
  assert.match(tickerSource, /second\.setAttribute\(['"]aria-hidden['"], ['"]true['"]\)/);
  assert.match(siteCss, /\.live-alert-ticker:hover[\s\S]*?animation-play-state:\s*paused/);
  assert.match(siteCss, /\.live-alert-ticker:focus-within[\s\S]*?animation-play-state:\s*paused/);
  assert.match(siteCss, /\.live-alert-ticker-item\[data-level=['"]watch['"]\][\s\S]*?--color-watch-indicator/);
  assert.match(siteCss, /\.live-alert-ticker\[data-state=['"]error['"]\][\s\S]*?--color-danger-indicator/);
  assert.match(siteCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.live-alert-ticker-track-inner[\s\S]*?animation:\s*none/);
});

test('feedback and Atlas failure paths retain semantic, localized status copy', () => {
  const feedbackSource = read('assets/js/feedback.js');
  const atlasSource = read('assets/js/hurricane-atlas.js');
  const siteCss = read('assets/css/site.css');
  const printCss = read('assets/css/printables.css');

  assert.match(feedbackSource, /document\.querySelector\(['"]\.feedback-widget['"]\)/);
  assert.match(feedbackSource, /Thanks\. Your note was sent for review\./);
  assert.match(feedbackSource, /Gracias\. Su nota se envió para revisión\./);
  assert.match(feedbackSource, /setStatus\(strings\.failure, ['"]error['"]\)/);
  assert.match(siteCss, /\.feedback-widget-status\[data-state=['"]success['"]\]/);
  assert.match(siteCss, /\.feedback-widget-status\[data-state=['"]error['"]\]/);
  assert.match(printCss, /@media print[\s\S]*?\.feedback-widget[\s\S]*?display:\s*none\s*!important/);

  assert.match(atlasSource, /function handleMapFailure\(error\)/);
  assert.match(atlasSource, /setStatus\(COPY\.mapFailure, ['"]error['"]\)/);
  assert.match(atlasSource, /\[decadeControl, regionControl\]\.forEach/);
  assert.match(atlasSource, /control\.addEventListener\(['"]change['"]/);
  assert.match(atlasSource, /stormControl\.addEventListener\(['"]change['"]/);
});
