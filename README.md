# hurricanesupplylist.com

A static preparedness reference for people in hurricane-prone areas. No ads. No affiliate links. Ko-fi tips welcome.

## What this is

Plain HTML/CSS/JavaScript hosted on GitHub Pages. No build step, no framework, no node_modules required to read or edit.

## How the site is built

- One `site.css` for all web pages
- One `printables.css` for printable checklists
- Shared HTML fragments in `docs/snippets/` — copy and paste into each page
- Self-hosted fonts in `assets/fonts/`
- No third-party scripts at runtime

## How to add a new page

1. Copy the closest existing page (e.g., `evacuation-kit.html` for a new kit page, `florida.html` for a new state page).
2. Open `docs/snippets/head.html` and paste its contents inside the `<head>`, substituting all `{{tokens}}`.
3. Open `docs/snippets/nav.html` and paste as the first `<body>` element. Add `aria-current="page"` to the matching nav link.
4. Open `docs/snippets/footer.html` and paste before `</body>`. Substitute `{{REVIEWED_DATE}}` and `{{LOCAL_EM_URL}}`.
5. Write content in the editorial (non-first-person) voice. See `docs/plans/2026-04-16-hurricanesupplylist-design.md` for the voice guidelines.
6. Add the page to `sitemap.xml` (one `<url>` block).
7. Validate HTML at [validator.w3.org/nu](https://validator.w3.org/nu/).
8. Commit: `git add <page>.html sitemap.xml && git commit -m "feat: add <name> page"`

## How to add a kit page (detailed)

Each kit has two files that must be kept in sync:
- `/<name>-kit.html` — the web guide (prose + item list + PDF download CTA)
- `/printables/<name>-kit.html` — the print-ready version (table format)

### Web page (`/<name>-kit.html`)

1. Copy `evacuation-kit.html` → rename (e.g. `pet-kit.html`).
2. Update the `<head>` tokens: `{{PAGE_TITLE}}`, `{{META_DESCRIPTION}}`, `{{CANONICAL_PATH}}`.
3. Update the `<h1>` and hero paragraph.
4. Update the PDF download link href: `printables/<name>-kit.pdf`.
5. Write 4–8 sections. Each section follows this pattern:
   - `<h2>` section name
   - `<p class="prose">` — 2–4 sentence why-paragraph (editorial voice, no "I")
   - `<ul class="checklist">` — items with `<span class="why">— reason</span>` notes
   - `<div class="callout">` where a "how much" note adds value
6. Update the Related kits strip to link to adjacent kits.
7. Add the page to `sitemap.xml` (see below).

### Printable (`/printables/<name>-kit.html`)

1. Copy `printables/evacuation-kit.html` → rename.
2. Update the `<title>` to: `[Kit Name] — hurricanesupplylist.com`
3. Update the lede paragraph.
4. Choose the right grouping scheme:
   - **Phase-grouped** (Before landfall / First 72 hours / Extended outage): Evacuation, Power Outage, Food/Water, First Aid
   - **Household-size grouped** (1–2 / family of 3–5): Pet, Baby/Child, Senior/Medical
   - **Single list**: Documents, Car
5. For each section: one `<h2>` + one `<table>` with CRITICAL / IMPORTANT / RECOMMENDED priority tiers.
6. Keep the disclaimer and site-line at the bottom.

### Generate the PDF

1. Open `printables/<name>-kit.html` in Chrome.
2. File → Print.
3. Destination: Save as PDF. Layout: Portrait. Margins: Default. Headers and footers: **ON** (the domain appears at top of each page from the `<title>`).
4. Save as `printables/<name>-kit.pdf`.
5. Delete `printables/<name>-kit.pdf.todo` if present.

### Update `sitemap.xml`

Add before `</urlset>`:
```xml
  <url>
    <loc>https://hurricanesupplylist.com/<name>-kit</loc>
    <lastmod>YYYY-MM-DD</lastmod>
    <priority>0.9</priority>
  </url>
```

### Commit

```bash
git add <name>-kit.html printables/<name>-kit.html printables/<name>-kit.pdf sitemap.xml
git commit -m "feat: add <name> kit page and printable"
```

## How to update a checklist (web + printable)

Each kit has two files:
- `/<name>-kit.html` — the full web guide (prose + items + download CTA)
- `/printables/<name>-kit.html` — the print-ready version (table format, CRITICAL/IMPORTANT/RECOMMENDED)

If you add or remove items, update **both files**. Then:

1. Open `/printables/<name>-kit.html` in Chrome.
2. File → Print → Destination: Save as PDF.
3. Layout: Portrait. Margins: Default. Headers and footers: on (the page title appears at top of each page automatically).
4. Save to `/printables/<name>-kit.pdf` (overwrite the existing file).
5. Commit: `git add printables/<name>-kit.html printables/<name>-kit.pdf && git commit -m "chore: update <name> checklist"`

## Ko-fi URL

The Ko-fi URL is stored as `{{KOFI_URL}}` in several places. When the final URL is ready, find and replace across all pages:

```
grep -rln "{{KOFI_URL}}" . --include="*.html"
```

Then replace in each file.

## How to deploy

Push to `main`. GitHub Pages publishes automatically (usually within 60 seconds). Custom domain `hurricanesupplylist.com` is configured via the `CNAME` file.

## DNS

To point the domain at GitHub Pages:
- Add four A records for `hurricanesupplylist.com`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- Add a CNAME record for `www.hurricanesupplylist.com` → `<github-username>.github.io`
- After propagation, enable "Enforce HTTPS" in GitHub Pages settings.

## Voice

- Kit and state pages: editorial, neutral voice. No "I".
- About page: first-person. "I'm Michael, I did the homework."
- Never publish evacuation routes, shelter addresses, or phone numbers. Link to the authoritative source instead.
- Tone: care, not fear. Useful, not just informative. Honest about limits.
- More detail in `docs/plans/2026-04-16-hurricanesupplylist-design.md`.
