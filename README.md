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
