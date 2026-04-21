#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sitemapPath = path.join(root, "sitemap.xml");
const sitemap = fs.readFileSync(sitemapPath, "utf8");
const noindexPattern = /<meta\s+name=["']robots["']\s+content=["'][^"']*\bnoindex\b/i;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "Google") {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(root, fullPath);
    if (relativePath.startsWith(path.join("docs", "snippets"))) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }

  return files;
}

function publicPathFromLoc(loc) {
  const url = new URL(loc);
  let pathname = url.pathname;

  if (pathname === "/") {
    return "index.html";
  }

  if (pathname.endsWith("/")) {
    return `${pathname.slice(1)}index.html`;
  }

  return `${pathname.slice(1)}.html`;
}

const productionHtml = new Set(
  Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => publicPathFromLoc(match[1]))
);
productionHtml.add("404.html");

const failures = [];

for (const fullPath of walk(root)) {
  const relativePath = path.relative(root, fullPath);
  if (productionHtml.has(relativePath)) {
    continue;
  }

  const html = fs.readFileSync(fullPath, "utf8");
  if (!noindexPattern.test(html)) {
    failures.push(relativePath);
  }
}

if (failures.length > 0) {
  console.error("Non-production HTML files must not be publicly indexable:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Production HTML check passed.");
