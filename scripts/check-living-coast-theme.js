#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const failures = [];

function fail(message) {
  failures.push(message);
}

function publicPathFromLoc(loc) {
  const pathname = new URL(loc).pathname;
  if (pathname === "/") return "index.html";
  if (pathname.endsWith("/")) return `${pathname.slice(1)}index.html`;
  return `${pathname.slice(1)}.html`;
}

function localAssetPath(source, fullPath) {
  if (!source || /^(?:https?:|data:|\/\/|mailto:|tel:)/i.test(source)) return null;
  const clean = source.split(/[?#]/)[0];
  return source.startsWith("/")
    ? path.join(root, clean.slice(1))
    : path.resolve(path.dirname(fullPath), clean);
}

function webpDimensions(buffer) {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") return null;
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (type === "VP8X" && data + 10 <= buffer.length) {
      return { width: 1 + buffer.readUIntLE(data + 4, 3), height: 1 + buffer.readUIntLE(data + 7, 3) };
    }
    if (type === "VP8 " && data + 10 <= buffer.length && buffer[data + 3] === 0x9d && buffer[data + 4] === 0x01 && buffer[data + 5] === 0x2a) {
      return { width: buffer.readUInt16LE(data + 6) & 0x3fff, height: buffer.readUInt16LE(data + 8) & 0x3fff };
    }
    if (type === "VP8L" && data + 5 <= buffer.length && buffer[data] === 0x2f) {
      const bits = buffer.readUInt32LE(data + 1);
      return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
    }
    offset = data + size + (size % 2);
  }
  return null;
}

const productionPages = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => publicPathFromLoc(match[1]));
productionPages.push("404.html");
if (productionPages.length !== 68) fail(`Expected 68 production pages; found ${productionPages.length}.`);

let regions = 0;
let siteNavPages = 0;

for (const relativePath of productionPages) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    fail(`${relativePath}: missing production page.`);
    continue;
  }

  const html = fs.readFileSync(fullPath, "utf8");
  const isSpanish = /<html\s+lang=["']es["']/i.test(html);
  if (!/<body\b[^>]*class=["'][^"']*\bliving-coast\b/i.test(html)) fail(`${relativePath}: missing living-coast body class.`);
  if (!/<body\b[^>]*\bdata-page=["'][^"']+["']/i.test(html)) fail(`${relativePath}: missing data-page contract.`);
  if (!/assets\/css\/living-coast\.css/i.test(html)) fail(`${relativePath}: missing Living Coast stylesheet.`);
  if (/fonts\.googleapis\.com|fonts\.gstatic\.com|card-wind-tilt\.js/i.test(html)) fail(`${relativePath}: contains a retired font or motion dependency.`);
  if (!/<link\s+rel=["']canonical["']/i.test(html)) fail(`${relativePath}: missing canonical link.`);

  if (/\bdata-region=["'][^"']+["']/i.test(html)) regions += 1;
  if (/<nav\b[^>]*class=["'][^"']*\bsite-nav\b/i.test(html)) {
    siteNavPages += 1;
    if (!/class=["'][^"']*\bbrand-mark\b/i.test(html) || !/class=["'][^"']*\bbrand-name\b/i.test(html)) {
      fail(`${relativePath}: navigation is missing the mark/live-name contract.`);
    }
    if (isSpanish && !/>Atlas \(EN\)<\/a>/i.test(html)) fail(`${relativePath}: Spanish navigation must say Atlas (EN).`);
  }

  if (relativePath !== "404.html" && relativePath !== "atlas.html" && !isSpanish && !/hreflang=["']es["']/i.test(html)) {
    fail(`${relativePath}: missing Spanish hreflang.`);
  }
  if (isSpanish && !/hreflang=["']en["']/i.test(html)) fail(`${relativePath}: missing English hreflang.`);

  for (const tag of html.matchAll(/<(?:img|script)\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
    const assetPath = localAssetPath(tag[1], fullPath);
    if (assetPath && !fs.existsSync(assetPath)) fail(`${relativePath}: broken local source ${tag[1]}.`);
    if (tag[0].startsWith("<img") && (!/\bwidth=["']?\d+/i.test(tag[0]) || !/\bheight=["']?\d+/i.test(tag[0]))) {
      fail(`${relativePath}: image lacks dimensions: ${tag[1]}.`);
    }
  }
  for (const tag of html.matchAll(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
    if (!/\brel=["'][^"']*(?:stylesheet|icon|apple-touch-icon)[^"']*["']/i.test(tag[0])) continue;
    const assetPath = localAssetPath(tag[1], fullPath);
    if (assetPath && !fs.existsSync(assetPath)) fail(`${relativePath}: broken local linked asset ${tag[1]}.`);
  }
}

if (regions !== 18) fail(`Expected 18 regional pages; found ${regions}.`);
if (siteNavPages !== 48) fail(`Expected 48 pages with site navigation; found ${siteNavPages}.`);

const livingCss = fs.readFileSync(path.join(root, "assets/css/living-coast.css"), "utf8");
for (const contract of [
  "--almanac-paper: #f7f0e3",
  "--almanac-clean: #fffdf7",
  "--almanac-ink: #213b3d",
  "--almanac-estuary: #2f6d72",
  "--almanac-satsuma: #aa5529",
  "font-family: \"Newsreader\"",
  "@media (prefers-reduced-motion: reduce)",
  "@media print"
]) {
  if (!livingCss.includes(contract)) fail(`living-coast.css: missing ${contract}.`);
}

for (const relativePath of [
  "assets/fonts/newsreader-latin.woff2",
  "assets/fonts/newsreader-latin-ext.woff2",
  "assets/fonts/work-sans-latin.woff2",
  "assets/fonts/work-sans-latin-ext.woff2",
  "assets/img/og-default.png",
  "assets/img/heroes/faq-still-life.webp"
]) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).size === 0) fail(`${relativePath}: missing or empty.`);
}

const heroFiles = [
  "assets/img/heroes/home-coast.webp",
  "assets/img/heroes/faq-still-life.webp",
  "assets/img/heroes/directories/kits-library.webp",
  "assets/img/heroes/directories/states-atlas.webp",
  "assets/img/heroes/directories/storm-atlas.webp",
  ...["baby-child-medical-kit", "car-kit", "documents-kit", "evacuation-kit", "first-aid-kit", "food-water-kit", "pet-kit", "power-outage-kit", "senior-medical-kit"].map((name) => `assets/img/heroes/kits/${name}.webp`),
  ...["alabama", "carolinas", "florida", "georgia", "gulf-coast", "louisiana", "mississippi", "puerto-rico", "texas"].map((name) => `assets/img/heroes/states/${name}.webp`)
];

if (heroFiles.length !== 23) fail(`Expected 22 illustrated hero assets and one Atlas map preview; found ${heroFiles.length}.`);
for (const relativePath of heroFiles) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    fail(`${relativePath}: missing hero.`);
    continue;
  }
  const stat = fs.statSync(fullPath);
  if (stat.size > 260 * 1024) fail(`${relativePath}: ${stat.size} bytes exceeds the 260 KB ceiling.`);
  const dimensions = webpDimensions(fs.readFileSync(fullPath));
  if (!dimensions || dimensions.width !== 1536 || dimensions.height !== 1024) {
    fail(`${relativePath}: expected 1536×1024.`);
  }
}

const og = fs.readFileSync(path.join(root, "assets/img/og-default.png"));
if (og.readUInt32BE(16) !== 1200 || og.readUInt32BE(20) !== 630) fail("assets/img/og-default.png: expected 1200×630.");

if (!/@media print[\s\S]*?\.feedback-widget[\s\S]*?display:\s*none\s*!important/.test(fs.readFileSync(path.join(root, "assets/css/printables.css"), "utf8"))) {
  fail("printables.css: feedback UI must disappear in print.");
}

if (failures.length) {
  console.error(`Living Coast theme check failed (${failures.length}):`);
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log("Living Coast theme check passed: 68 pages, 18 regional guides, 22 illustrated hero assets, and one Atlas map preview.");
