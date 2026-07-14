# hurricanesupplylist.com Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build and launch hurricanesupplylist.com — a ~22-page static site for hurricane preparedness — before the June 1 hurricane season start.

**Architecture:** Plain HTML / CSS / JS with no framework, no build step, no third-party runtime scripts. Shared header, footer, and meta blocks are authored as HTML snippets documented in `README.md` and pasted into each page. Printable checklists are HTML pages printed from Chrome (File → Print → Save as PDF). Hosted on GitHub Pages from a private repo, with the custom domain `hurricanesupplylist.com`.

**Tech Stack:** HTML5, vanilla CSS (one `site.css`, one `printables.css`), vanilla JS (one `share.js`, ~30 lines). Self-hosted Fraunces + Inter (subset to Latin). No runtime dependencies.

**Reference docs:**
- Design spec: `docs/plans/2026-04-16-hurricanesupplylist-design.md`
- Tone examples: author's sister site voice passage (captured in memory)
- Checklist reference: `Earthquake Kit — Checklist.pdf` in repo root (to be moved to `docs/reference/` during Task 0.2)

**Adaptation note on TDD:** Classical test-first doesn't fit static HTML/CSS pages. For those, the verification step is visual: open the page in a browser, confirm it matches the design, confirm it validates, confirm it prints cleanly. Where real behavior exists (the share.js button handlers), write actual tests first. All tasks still end with **verify + commit**.

---

## Phase 0 — Foundations

### Task 0.1: Initialize git repo and first commit

**Files:**
- Create: `.gitignore`
- Existing: `docs/plans/2026-04-16-hurricanesupplylist-design.md`, `docs/plans/2026-04-16-hurricanesupplylist-implementation.md`, `design-reference.html`, `Earthquake Kit — Checklist.pdf`, `Family Communication Plan — cascadia.me.pdf`

**Step 1: Write `.gitignore`**

```
.DS_Store
*.swp
*.swo
*~
node_modules/
.env
.env.local
```

**Step 2: Initialize repo and make first commit**

```bash
cd /Users/michaelhendrick/Documents/HurricaneSupplyList.com
git init -b main
git add .gitignore docs/ design-reference.html
git commit -m "chore: initial commit with validated design"
```

**Step 3: Verify**

```bash
git log --oneline
```
Expected: one commit message visible.

---

### Task 0.2: Scaffold directory structure

**Files:**
- Create: `assets/css/`, `assets/js/`, `assets/img/og/`, `assets/fonts/`, `printables/`, `docs/reference/`
- Move: `Earthquake Kit — Checklist.pdf` → `docs/reference/`
- Move: `Family Communication Plan — cascadia.me.pdf` → `docs/reference/`

**Step 1: Create empty directories with `.gitkeep` placeholders**

```bash
mkdir -p assets/css assets/js assets/img/og assets/fonts printables docs/reference
touch assets/css/.gitkeep assets/js/.gitkeep assets/img/og/.gitkeep assets/fonts/.gitkeep printables/.gitkeep
git mv "Earthquake Kit — Checklist.pdf" docs/reference/
git mv "Family Communication Plan — cascadia.me.pdf" docs/reference/
```

**Step 2: Commit**

```bash
git add -A
git commit -m "chore: scaffold directory structure"
```

---

## Phase 1 — Design system and shared chrome

### Task 1.1: Self-host Fraunces and Inter fonts

**Files:**
- Download: Fraunces (weights 500, 700) and Inter (weights 400, 600) — Latin subset, `.woff2` format
- Create: `assets/fonts/fraunces-500.woff2`, `assets/fonts/fraunces-700.woff2`, `assets/fonts/inter-400.woff2`, `assets/fonts/inter-600.woff2`
- Create: `assets/fonts/LICENSE.txt` (SIL Open Font License for both)

**Step 1: Source fonts**

Use `google-webfonts-helper` (gwfh.mranftl.com) or download directly from the GitHub font repos (fraunces/fraunces, rsms/inter). Pick `woff2`, Latin subset. Four files total.

**Step 2: Verify file sizes are reasonable**

```bash
ls -lh assets/fonts/
```
Expected: each file well under 100KB.

**Step 3: Commit**

```bash
git add assets/fonts/
git commit -m "feat: self-host Fraunces and Inter fonts"
```

---

### Task 1.2: Write `site.css` design tokens and base typography

**Files:**
- Create: `assets/css/site.css`
- Delete: `assets/css/.gitkeep`

**Step 1: Write `site.css`**

Contents: `@font-face` declarations (four families); `:root` custom properties for the "Coastal calm" palette (all tokens from the design doc); CSS reset (minimal — just `*,*::before,*::after { box-sizing: border-box }` and `body { margin: 0 }`); base typography (Inter body 18px/1.7, Fraunces headings, max line length 68ch); link styles (coastal blue-grey, underline on hover); list styles with the ochre `::before` marker pattern from `design-reference.html`; button styles (`.btn-primary` ochre, `.btn-secondary` outlined storm); responsive adjustments (17px body on mobile, single-column always).

Reference the canonical Coastal Calm styles in `design-reference.html` as the starting point — copy and adapt rather than rewriting from scratch.

**Step 2: Verify**

Create a throwaway `style-check.html` at repo root that loads `site.css` and contains sample heading, paragraph, list, link, and two buttons. Open in browser. Compare against `design-reference.html` — they should match.

**Step 3: Commit**

```bash
git add assets/css/site.css
git commit -m "feat: add site.css with design system tokens and base typography"
```

Leave `style-check.html` uncommitted / gitignored for now; it evolves into `style-guide.html` in the next task.

---

### Task 1.3: Build `style-guide.html` for ongoing visual verification

**Files:**
- Create: `style-guide.html` at repo root (a development-time page, not part of the shipping site — added to sitemap.xml exclusion)

**Step 1: Build the page**

Sections: palette swatches, type scale (h1–h4 + body + small), link states, list variations (plain, with ochre markers, nested), button variants (primary, secondary, disabled), table style (matching printable format preview), image placeholder component, share button row preview.

**Step 2: Verify**

Open in browser. All elements should be present and match the design doc. This page is the one-stop visual reference you (the user) can open any time to sanity-check the design system.

**Step 3: Commit**

```bash
git add style-guide.html
git commit -m "feat: add style-guide.html for design system reference"
```

---

### Task 1.4: Author shared chrome snippets and document in README

**Files:**
- Create: `docs/snippets/head.html`, `docs/snippets/nav.html`, `docs/snippets/footer.html`, `docs/snippets/share-buttons.html`
- Create: `README.md`

**Step 1: Write each snippet as a self-contained HTML fragment**

- `head.html` — contents of `<head>` with `{{TITLE}}`, `{{DESCRIPTION}}`, `{{CANONICAL_PATH}}`, `{{OG_IMAGE}}` placeholder tokens to hand-substitute per page
- `nav.html` — the top nav block (Home · Kits · States · Printables · About), with `aria-current="page"` instructions in a comment
- `footer.html` — "Last reviewed: {{MONTH YYYY}}" + disclaimer + Ko-fi link (`{{KOFI_URL}}` placeholder) + small sitemap
- `share-buttons.html` — the sticky-desktop / inline-mobile share row (renders only after `share.js` wires it up; fallback is just visible buttons)

**Step 2: Write `README.md`**

Sections: "What this is", "How the site is built" (plain HTML/CSS/JS, no build step), "How to add a new page" (copy an existing one, paste snippets from `docs/snippets/`, substitute placeholders, add to `sitemap.xml` and the relevant index), "How to update a checklist" (edit `/printables/<name>.html`, print to PDF in Chrome, commit both), "How to deploy" (push to main, GH Pages publishes automatically), "Voice guidelines" (short summary pointing to the design doc).

**Step 3: Commit**

```bash
git add docs/snippets/ README.md
git commit -m "docs: add shared HTML snippets and README with contributor guide"
```

---

## Phase 2 — Share buttons and SEO primitives

### Task 2.1: Write `share.js` with failing test first

**Files:**
- Create: `assets/js/share.js`
- Create: `assets/js/share.test.html` (dev-time test runner, gitignored from production deploy but committed for reference)
- Delete: `assets/js/.gitkeep`

**Step 1: Write failing test in `share.test.html`**

A minimal HTML page that loads `share.js` and has inline `<script>` assertions using `console.assert`. Tests:
- `buildTwitterURL(title, url)` returns the correct `twitter.com/intent/tweet?text=...&url=...`
- `buildFacebookURL(url)` returns `facebook.com/sharer/sharer.php?u=...`
- `buildEmailURL(title, url)` returns `mailto:?subject=...&body=...`
- `buildSmsURL(title, url)` returns `sms:?body=...`
- Clicking "Copy link" invokes `navigator.clipboard.writeText` with the current URL

**Step 2: Verify test fails**

Open `share.test.html` in Chrome. DevTools console shows assertion failures (functions undefined).

**Step 3: Implement `share.js`**

Pure functions for each URL builder; a single `init()` that finds `.js-share-row` elements and wires up clicks. No dependencies. Handle the "Copied!" confirmation (replace button text for 1.5s then restore).

**Step 4: Verify tests pass**

Reload `share.test.html`. All assertions should pass, no console errors.

**Step 5: Manual test in browser**

Open `style-guide.html` (add a live share row to it for this test), click each button, confirm each opens the right intent and copy link actually copies.

**Step 6: Commit**

```bash
git add assets/js/share.js assets/js/share.test.html
git commit -m "feat: add share.js with intent URL builders and copy-link handler"
```

---

### Task 2.2: Author SEO primitives

**Files:**
- Create: `robots.txt`
- Create: `sitemap.xml` (with only home, about, printables index for now; each page task adds its own entry)
- Create: `CNAME` containing `hurricanesupplylist.com`
- Create: `assets/img/og-default.png` — a designed 1200×630 placeholder

**Step 1: Write `robots.txt`**

```
User-agent: *
Allow: /
Sitemap: https://hurricanesupplylist.com/sitemap.xml
```

**Step 2: Write skeleton `sitemap.xml`**

Valid XML with entries for `/`, `/about`, `/printables`. Each later page task appends a `<url>` entry.

**Step 3: Write `CNAME`**

One line: `hurricanesupplylist.com`

**Step 4: Create `og-default.png`**

Generate a simple 1200×630 PNG using the `og-default.html` approach: author an HTML file with the design system rendering the site wordmark + tagline centered, open in Chrome at 1200×630 viewport, use DevTools to save a screenshot. Commit the PNG; the HTML source stays in `docs/og-source/og-default.html` so it can be regenerated.

**Step 5: Commit**

```bash
git add robots.txt sitemap.xml CNAME assets/img/og-default.png docs/og-source/
git commit -m "feat: add SEO primitives (robots, sitemap, CNAME, default OG image)"
```

---

## Phase 3 — Evacuation kit (vertical slice)

### Task 3.1: Build `/evacuation-kit.html` end-to-end

**Files:**
- Create: `evacuation-kit.html`
- Modify: `sitemap.xml` (append entry)

**Step 1: Compose the page**

Copy an existing kit-page template? There isn't one yet — this task *is* the template. Assemble from snippets: `head.html` (substitute title, description, canonical), `nav.html`, hero, 4–8 section guide (Water, Food, Light, Documents, Medications, Comfort, Phase checklist, Related kits), share button row (mobile inline + desktop sticky), `footer.html`. Use designed image placeholders for hero.

Content: draft the prose in the editorial/neutral voice (not "I"), each section has a why-paragraph + a readable item list with why-notes + a "how much" callout. Sources: NOAA/NWS/FEMA/Red Cross guidance (cite inline links, never paraphrase as fact).

**Step 2: Verify in browser**

Open in Chrome. Walk through: desktop width, mobile width (DevTools device mode), keyboard tab through all links and buttons, click each share button and confirm intents open correctly, check color contrast with DevTools.

**Step 3: Verify HTML validates**

Paste into validator.w3.org/nu. Fix any errors.

**Step 4: Update `sitemap.xml`**

Append `<url><loc>https://hurricanesupplylist.com/evacuation-kit</loc><lastmod>2026-04-16</lastmod></url>`.

**Step 5: Commit**

```bash
git add evacuation-kit.html sitemap.xml
git commit -m "feat: add evacuation kit page"
```

---

### Task 3.2: Build `/printables/evacuation-kit.html`

**Files:**
- Create: `printables/evacuation-kit.html`
- Create: `assets/css/printables.css` (first use)

**Step 1: Write `printables.css`**

Minimal styles matching the cascadia.me reference: Fraunces title, Inter body, near-black on white, thin `#E6DFD0` hairlines under table rows, no color, no cover. Three-column table (Item | Quantity | Priority) + a checkbox column.

**Step 2: Write `printables/evacuation-kit.html`**

`<title>Evacuation Kit — hurricanesupplylist.com</title>` (the browser print header picks this up). Body: title, one-line lede, three phase sections (Before landfall / First 72 hours / Extended outage), each with the table. Footer: short disclaimer + `hurricanesupplylist.com`.

**Step 3: Verify on screen and in print**

- Open in Chrome. Should read well at normal zoom.
- File → Print → Save as PDF. Preview should match the cascadia.me earthquake kit's clean look. Domain should appear at top-center of each page via browser default header (from `<title>`).

**Step 4: Save PDF**

Save output as `printables/evacuation-kit.pdf`.

**Step 5: Commit**

```bash
git add printables/evacuation-kit.html printables/evacuation-kit.pdf assets/css/printables.css
git commit -m "feat: add evacuation kit printable (HTML source + PDF)"
```

---

### Task 3.3: Lock in "how to add a kit page" pattern in README

**Files:**
- Modify: `README.md`

**Step 1: Write the "How to add a kit page" section**

Step-by-step reproduction of Tasks 3.1 + 3.2 applied to a hypothetical new kit. Include: which snippets to paste, which `{{placeholders}}` to substitute, where to update `sitemap.xml`, the print-to-PDF workflow. This becomes the muscle-memory guide for all remaining kit pages.

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: document kit-page authoring pattern in README"
```

---

## Phase 4 — Remaining kit pages (web + printable)

Each task follows the exact pattern established in Tasks 3.1–3.2. One task per kit. Each task ends with commit. List in order of preparedness priority:

- **Task 4.1:** Food/Water Kit (phase-grouped printable)
- **Task 4.2:** Power Outage Kit (phase-grouped printable)
- **Task 4.3:** First Aid Kit (phase-grouped printable)
- **Task 4.4:** Documents Kit (single-list printable)
- **Task 4.5:** Pet Kit (household-size-grouped printable: 1–2 pets / 3+ pets)
- **Task 4.6:** Baby/Child Kit (age-grouped printable: infant / toddler / school-age)
- **Task 4.7:** Senior/Medical Kit (complexity-grouped printable: basic / chronic conditions)
- **Task 4.8:** Car Kit (single-list printable)

**Per-task steps** (same each time):
1. Copy `evacuation-kit.html` → rename, update content
2. Copy `printables/evacuation-kit.html` → rename, update content (respect the grouping scheme above)
3. Verify in browser, verify print preview, verify HTML validates
4. Save PDF via Chrome print
5. Append `sitemap.xml` entries for both web page and printable
6. Commit: `feat: add <name> kit page and printable`

---

## Phase 5 — State and region pages

Follows the state-page template structure from the design doc. No checklist PDFs per state (each state page links to the existing kit printables); only a web page each.

- **Task 5.1:** Florida — hero, risks (storm surge, rapid intensification), regional quirks, official sources list
- **Task 5.2:** Texas — inland flooding focus, Hill Country flash-flood hazards, coastal surge
- **Task 5.3:** Louisiana — slow-moving systems, post-storm chemical exposures, parish-level EM
- **Task 5.4:** Gulf Coast (multi-state regional) — the overlap region framing
- **Task 5.5:** Carolinas (NC + SC combined) — inland flooding, outer banks evacuation culture
- **Task 5.6:** Georgia — inland impact after landfall, wind risk
- **Task 5.7:** Alabama — coastal + inland pattern
- **Task 5.8:** Mississippi — Gulf Coast concentration
- **Task 5.9:** Puerto Rico — island-specific preparedness (power grid fragility, water, distance-from-mainland supply chain)

**Per-task steps:**
1. Copy `florida.html` (created in Task 5.1 as the template) → rename, rewrite content
2. Verify in browser, verify HTML validates
3. Collect and include **only authoritative links** — state EM office, county EM lookup, NHC, NWS forecast office, 211
4. Append `sitemap.xml` entry
5. Commit: `feat: add <state> page`

**Task 5.1 additionally establishes the state-page template** and should be written carefully; Task 5.2 onward can copy-adapt.

---

## Phase 6 — Home, About, Printables index, 404

### Task 6.1: Build `/index.html` (home)

**Files:** Create `index.html`; modify `sitemap.xml` — already has `/` entry.

Hero (image placeholder), purpose statement ("care, not fear") in 2–3 sentences, two nav cards (Browse kits / Find your state), printables strip of 3–4 manually-curated "most useful" PDFs (my pick: Evacuation, Power Outage, Documents, Pet), About teaser paragraph.

Verify in browser → commit.

### Task 6.2: Build `/about.html`

**Files:** Create `about.html`.

Personal "I" voice without a personal byline. Sections: "Who maintains this" (an independent publisher, not a meteorologist, has done the homework), "Why this site exists", "What I don't know", "How I keep it current", "Tip jar" (Ko-fi button, contextual framing, `{{KOFI_URL}}` placeholder until URL is provided).

Verify in browser → commit.

### Task 6.3: Build `/printables/index.html`

**Files:** Create `printables/index.html`.

Browseable listing of all nine printable PDFs. Each entry: name, one-line description, Download PDF button, View in browser link. Grouped by category (Essentials / Family / Household / Mobility).

Verify in browser → commit.

### Task 6.4: Build `/404.html`

**Files:** Create `404.html`.

Plain 404 with the same calm voice. Short message ("This page isn't here. The list you were probably looking for is one of these..."), then a compact list linking to home, kits index (on home page), states index, printables.

Verify in browser → commit.

---

## Phase 7 — Ko-fi placement and final polish

### Task 7.1: Centralize Ko-fi URL and verify placement

**Files:** Modify every page that contains `{{KOFI_URL}}` once the real URL is provided by the user.

**Step 1:** User provides final Ko-fi URL.

**Step 2:** Find and replace `{{KOFI_URL}}` across the tree.

```bash
grep -rln "{{KOFI_URL}}" . --include="*.html"
```

Replace with the real URL in each result.

**Step 3:** Verify each page: footer Ko-fi link opens correctly, About page larger Ko-fi button opens correctly, printables bottom-of-page link works when pasted in a browser.

**Step 4:** Commit with message referencing the URL swap (not the URL value).

### Task 7.2: Per-page OG images (optional; defer until user ships them)

**Files:** Create `assets/img/og/<page>.png` for each page where a custom preview is wanted. Update each page's `<meta property="og:image">`.

Until user supplies imagery, `assets/img/og-default.png` is used everywhere; this is fine for launch.

### Task 7.3: Launch checks

**Step 1:** Run link checker (e.g. `npx linkinator . --skip node_modules --skip docs/reference`) to catch dead links, especially to `.gov` sources.

**Step 2:** Run HTML validation across every `.html` file (can scriptify with `html-validate` or paste each into validator.w3.org/nu).

**Step 3:** Lighthouse audit on home, one kit page, one state page. Targets: Performance 95+, Accessibility 95+, SEO 100. Fix anything that drops below.

**Step 4:** Commit any fixes.

---

## Phase 8 — Repository creation and launch

### Task 8.1: Create private GitHub repo

**Pre-action checklist (confirm with user before proceeding):**
- [ ] GitHub username / org for the repo
- [ ] Exact repo name (suggest `hurricanesupplylist.com`)
- [ ] `gh` CLI is authenticated

**Step 1:** Confirm with user, then:

```bash
gh repo create hurricanesupplylist.com --private --source . --push --description "Static site for hurricane preparedness. hurricanesupplylist.com"
```

**Step 2:** Verify repo exists on GitHub (private, main branch pushed).

**Step 3:** Enable GitHub Pages:

- GitHub web UI → Settings → Pages → Source: Deploy from branch `main` / `/` (root) → custom domain `hurricanesupplylist.com` (reads from `CNAME`)

Or via CLI:

```bash
gh api -X POST "repos/{owner}/hurricanesupplylist.com/pages" -f "source[branch]=main" -f "source[path]=/"
```

### Task 8.2: DNS cutover (user action)

Document in `README.md`:

- Apex `hurricanesupplylist.com` → A records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (GitHub Pages)
- `www.hurricanesupplylist.com` → CNAME to `<username>.github.io`
- After DNS propagates, enable "Enforce HTTPS" in GitHub Pages settings.

### Task 8.3: Smoke test

After DNS propagates:

- [ ] Home page loads at https://hurricanesupplylist.com
- [ ] At least one kit page loads
- [ ] At least one state page loads
- [ ] One PDF downloads successfully
- [ ] Share buttons open correct intents
- [ ] OG preview renders in a Slack/iMessage paste test
- [ ] Lighthouse scores still green on production URL

---

## Out of scope for v1

- Per-page custom OG images beyond default
- Interactive check-off
- Analytics
- Newsletter signup
- Ko-fi widget embed
- County-level subdivision of state pages
- Republished evacuation routes or shelter lists

## Notes on execution rhythm

- Commit after every task. Small commits, imperative messages.
- Stay in editorial voice on kit and state pages; first-person only on About and Ko-fi framing.
- Every page needs a **"Last reviewed: [Month YYYY]"** footer note, set to the current month at time of authoring.
- Whenever tempted to republish a specific evac route, shelter, or phone number — **link out instead.**
- When the user has not yet supplied an image, ship a designed placeholder (correct aspect ratio, subtle background, visible "replace `<path>`" label), never a broken `<img>`.
