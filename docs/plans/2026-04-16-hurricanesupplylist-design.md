# hurricanesupplylist.com — design

**Date:** 2026-04-16
**Status:** Validated through brainstorming. Ready for implementation planning.

## Purpose

A public-service reference for hurricane preparedness. Highly shareable, fast, calm in tone, and honest about what it is (a supplement, not a replacement for local emergency management). Revenue via Ko-fi tips only. No ads, no affiliate links, no tracking.

## Voice and tone

Three pillars (lifted from the author's sister site):

1. **Care, not fear.** Preparedness is about care, not anxiety. Sobering where needed, never frightening. "This is manageable, you just have to think about it before it happens."
2. **Useful, not just informative.** Every guide answers "will this actually change what you do?" Context, not just checklists. The act of building your own kit is part of the preparedness.
3. **Honest about limits.** Author is "a person who has done the homework," not an emergency management professional. Cite sources. Point to local emergency management offices as authoritative.

**Voice distribution:** Editorial/neutral voice on kit and state pages (they read as reference). Personal first-person "I" voice on About and Ko-fi pages.

**Banned stylistic moves:** scare headlines, urgency baiting, exclamation points in body copy, emoji. Reds in the palette. Republishing specifics that go stale (evacuation routes, shelter addresses, phone numbers, product models).

## Stack

- Plain HTML, CSS, JavaScript. No framework, no build step.
- Hosted on GitHub Pages from a **private** repository.
- Self-hosted fonts (Fraunces + Inter), no Google Fonts in production.
- No analytics, no third-party share scripts, no Ko-fi widget JS.

## File structure

```
/
├── index.html                    home
├── about.html                    personal "I" voice, Ko-fi prominent
├── evacuation-kit.html           kit pages, flat URLs
├── pet-kit.html
├── power-outage-kit.html
├── baby-child-kit.html
├── senior-medical-kit.html
├── car-kit.html
├── documents-kit.html
├── first-aid-kit.html
├── food-water-kit.html
├── florida.html                  state pages, flat URLs
├── texas.html
├── louisiana.html
├── gulf-coast.html
├── carolinas.html
├── georgia.html
├── alabama.html
├── mississippi.html
├── puerto-rico.html
├── 404.html
├── robots.txt
├── sitemap.xml
├── CNAME                         GitHub Pages custom domain
│
├── printables/
│   ├── index.html                browsable list of all PDFs
│   ├── evacuation-kit.html       print-friendly HTML source
│   ├── evacuation-kit.pdf        committed PDF (browser print output)
│   └── ... (one pair per checklist)
│
├── assets/
│   ├── css/site.css              single stylesheet for the web pages
│   ├── css/printables.css        stylesheet for /printables/ HTML
│   ├── js/share.js               share-button behavior (~30 lines)
│   ├── img/og-default.png        default 1200×630 social preview
│   ├── img/og/florida.png        per-page OG images where worth it
│   └── fonts/                    self-hosted Fraunces + Inter
│
├── docs/
│   └── plans/                    design docs (this file)
│
└── README.md                     repo intro + "how to update a checklist"
```

## Visual system

**Palette — "Coastal calm"**

| Role | Color | Use |
|---|---|---|
| Background | `#FBF8F2` | page background |
| Ink | `#1F2A33` | body copy, headings |
| Muted ink | `#556270` | captions, meta, footer |
| Accent — storm | `#3A6B83` | links, secondary buttons |
| Accent — warm | `#C2742B` | primary buttons, list-item markers, Ko-fi |
| Rule | `#E6DFD0` | dividers, table borders |

No reds (emergency register). Two accents used sparingly.

**Typography**

- Headings: Fraunces, weights 500 and 700
- Body: Inter, weights 400 and 600
- Body size: 18px desktop, 17px mobile. Line-height 1.6–1.7. Max line length ~68ch.
- Max widths: 720px for article content, 1100px for home and index pages.

**Layout primitives**

- Single-column, centered. No sidebar.
- Text nav at top (Home · Kits · States · Printables · About). No hamburger.
- Mobile-first CSS, single `site.css`, target ~300 lines.

## Page templates

**Shared on every page:** top nav with brand wordmark; meta block with `<title>`, description, canonical, OG + Twitter Card tags, JSON-LD; footer with "Last reviewed: [Month YYYY]" + "A supplement, not a replacement for your local emergency management office." + Ko-fi link.

### 1. Home (`/index.html`)

- Hero: short statement of purpose (care, not fear). Placeholder for hero image.
- Two prominent navigation cards: Browse kits, Find your state.
- Printables strip: 3–4 manually-curated "most useful" checklists.
- One-paragraph About teaser linking to `/about`.

### 2. Kit page (`/evacuation-kit.html`, etc.)

- Hero: title + one-sentence lede + primary "Download the checklist (PDF)" button.
- Long-form guide in 4–8 sections (Water, Food, Light, Documents, etc.). Each section:
  - Short "why" paragraph
  - Readable list of items with why-notes (web only — printable is spare)
  - "How much" callout where relevant
- "Related kits" strip at bottom.
- Share buttons: sticky vertical on desktop, inline horizontal on mobile.
- Second download CTA near the footer.

### 3. State / region page (`/florida.html`, etc.)

- Hero: "Preparing for hurricanes in Florida" + Florida checklist download CTA.
- Sections:
  1. What makes hurricanes here different (storm surge, rapid intensification, slow systems, inland flooding — hazards, not forecasts)
  2. Regional supply quirks (mosquito gear, coastal specifics, Gulf-cold-snap oddities)
  3. **Official sources to bookmark now** — prominent linked list: state emergency management, county lookup, NHC, NWS, 211
  4. Historical context — well-settled storms only; no current-season predictions
- Share buttons (same as kit pages).
- **No specific evacuation routes or shelter lists.** Link out for those.

### 4. About / Tip (`/about.html`)

- Personal first-person "I" voice.
- Who I am, why I made this, what I don't know, how I keep it current.
- Ko-fi button, framed by context ("if this saved you a trip to the hardware store…"), not pushy.

## Printables (PDF) system

**Format modeled directly on the author's cascadia.me earthquake kit.**

Each printable is one HTML file in `/printables/`. You open it in Chrome, File → Print → Save as PDF, commit the `.pdf` next to the `.html`. Browser default print headers/footers stay on — `<title>` puts the domain at the top of every page automatically.

**Structure:**

```
Title (serif)
Lede (one short paragraph)

[Section heading]
| Item | Quantity | Priority | ☐ |
(hairline-separated rows)

[Next section heading]
| ... |

Disclaimer: "Your local emergency management office is the best source..."
Site line:  "hurricanesupplylist.com"
```

**Priority tiers:** `CRITICAL`, `IMPORTANT`, `RECOMMENDED`.

**Grouping by kit type:**

- **Phase-grouped** (Before landfall / First 72 hours / Extended outage): Evacuation, Power Outage, Food/Water, First Aid
- **Household-size grouped** (1–2 / family): Pet (by pet count), Baby/Child (by age), Senior/Medical (by complexity)
- **No subdivision** — single list: Documents, Car

**Styling (`printables.css`):** Fraunces for title and section headings, Inter for body, near-black on white, thin warm-tan hairlines, no color, no cover page, no custom `@page` CSS.

**Update workflow** (documented in `README.md`):

1. Edit `/printables/<name>.html`
2. Open in Chrome → Print → Save as PDF → save to `/printables/<name>.pdf`
3. Commit both files

Web kit page and printable are separately maintained. The redundancy is acceptable at v1 scale.

## Shareability

**On-page share buttons** (`assets/js/share.js`, ~30 lines): X/Twitter · Facebook · SMS · Email · Copy link. Sticky vertical on desktop, inline horizontal on mobile. Uses `href` intents (`twitter.com/intent/tweet`, `sms:`, `mailto:`) and `navigator.clipboard` — no third-party scripts.

**SEO:**

- Per-page `<title>`, meta description, canonical URL
- Open Graph + Twitter Card tags everywhere; default OG image + per-page overrides
- JSON-LD structured data: `Article` on kit and state pages, `WebSite` on home, `CollectionPage` on printables index
- `sitemap.xml` (hand-maintained at this scale) + `robots.txt`

**Short memorable URLs:** `/florida`, `/texas`, `/gulf-coast`. Files named `.html`; rely on GitHub Pages' automatic resolution of extensionless links.

**Rich social previews:** OG image per kit and per state as user supplies; default image for others.

## Ko-fi

- Plain anchor button using the Ko-fi URL (TBD). No Ko-fi widget JS.
- Placement: small in footer on every page, larger on About page with contextual framing, small link at the bottom of each printable.
- URL stored in a single location (placeholder until provided) so swap is one edit.

## Imagery

User supplies images later. Every image slot in every template ships with a **designed placeholder** (correct aspect ratio reserved, muted on-brand background tone, visible label: "Hero image — replace `assets/img/<slot>.jpg`") so pages look finished before images arrive.

## v1 page inventory (~22 pages)

**Home + meta:** `/`, `/about`, `/printables`, `/404`

**Kits (9):** Evacuation, Pet, Power Outage, Baby/Child, Senior/Medical, Car, Documents, First Aid, Food/Water

**States / regions (9):** Florida, Texas, Louisiana, Gulf Coast, Carolinas, Georgia, Alabama, Mississippi, Puerto Rico

**Printables (9):** one HTML + PDF pair for each kit

## Launch logistics

- **Domain:** hurricanesupplylist.com, owned on Namecheap, parked. DNS update deferred until site is ready.
- **Repo:** Private GitHub repo. GitHub Pages serves a public site from a private repo on Free tier (supported since 2021).
- **Ko-fi URL:** TBD — user needs to change existing URL. Use placeholder / single-point-of-edit until provided.
- **Publisher byline:** "Hurricane Coast." Personal profile details live on Ko-fi, not on-site.
- **Sister-site cross-link:** none.

## Explicitly rejected / not doing

- Interactive check-off with localStorage (checklists are PDFs, not on-page UI)
- Display ads
- Affiliate links
- Third-party analytics or share scripts
- Ko-fi embed widget
- Republished evacuation routes, shelter lists, phone numbers
- Custom `@page` print CSS with running headers, cover pages, or decorative color rules on printables
- Build scripts or `synced-list-id` schemes for web↔printable list sync
- County-level subdivision of state pages
- Hamburger mobile menu

## Open items to resolve before or during implementation

- Ko-fi URL
- Hero and per-page imagery (user supplies later)
- Specific item lists per kit (to be drafted during content phase)
- Specific authoritative-source URLs per state (to be collected during content phase)

---

*Validated via brainstorming dialogue on 2026-04-16. Next step: implementation plan.*
