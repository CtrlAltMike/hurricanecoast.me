#!/usr/bin/env node

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SITE_NAME = 'Hurricane Coast';
const DEFAULT_SITE_BASE = 'https://hurricanecoast.me';
const DEFAULT_OUTPUT_DIR = path.join(REPO_ROOT, 'storms');
const DEFAULT_CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const REGION_ALIASES = {
  al: 'alabama',
  alabama: 'alabama',
  carolinas: 'carolinas',
  fl: 'florida',
  florida: 'florida',
  ga: 'georgia',
  georgia: 'georgia',
  gulf: 'gulf-coast',
  gulfcoast: 'gulf-coast',
  'gulf-coast': 'gulf-coast',
  la: 'louisiana',
  louisiana: 'louisiana',
  ms: 'mississippi',
  mississippi: 'mississippi',
  pr: 'puerto-rico',
  puertorico: 'puerto-rico',
  'puerto-rico': 'puerto-rico',
  tx: 'texas',
  texas: 'texas'
};

const COMMON_RESOURCES = [
  {
    label: 'Evacuation checklist',
    description: 'Print this first if leaving may become a real possibility.',
    url: '/printables/evacuation-kit.html'
  },
  {
    label: 'Power outage checklist',
    description: 'The fastest way to close the gap on outages that last days, not hours.',
    url: '/printables/power-outage-kit.html'
  },
  {
    label: 'Food and water checklist',
    description: 'A practical stock-up list before lines and shortages start.',
    url: '/printables/food-water-kit.html'
  },
  {
    label: 'Documents checklist',
    description: 'Insurance, IDs, and claim paperwork before the wind matters.',
    url: '/printables/documents-kit.html'
  }
];

const REGIONS = {
  florida: {
    name: 'Florida',
    guideUrl: '/florida.html',
    emergencyOfficeName: 'Florida Division of Emergency Management',
    emergencyOfficeUrl: 'https://www.floridadisaster.org',
    extraOfficialLinks: [
      { label: 'Florida Shelter Map', url: 'https://floridadisaster.org/publicmapping' },
      { label: 'Florida 511', url: 'https://fl511.com' }
    ],
    watchouts: [
      'Storm surge is the life-safety risk. Know your zone before you read the track too closely.',
      'Rapid intensification near the peninsula is common; do not wait for the perfect forecast before doing the basics.',
      'Heat after outages is a real health issue. Stage water, shade, fans, and medication cooling plans early.'
    ]
  },
  texas: {
    name: 'Texas',
    guideUrl: '/texas.html',
    emergencyOfficeName: 'Texas Division of Emergency Management',
    emergencyOfficeUrl: 'https://tdem.texas.gov',
    extraOfficialLinks: [
      { label: 'DriveTexas', url: 'https://drivetexas.org' }
    ],
    watchouts: [
      'Inland flooding is not secondary in Texas. Rainfall risk can outrun wind risk by a wide margin.',
      'Evacuation distances are long and fuel demand spikes hard. Fuel early and do not assume your first route will stay clear.',
      'Landfalling Gulf storms often throw tornadoes inland. Keep warnings on after the eye has passed.'
    ]
  },
  louisiana: {
    name: 'Louisiana',
    guideUrl: '/louisiana.html',
    emergencyOfficeName: 'Governor’s Office of Homeland Security and Emergency Preparedness',
    emergencyOfficeUrl: 'https://gohsep.la.gov',
    extraOfficialLinks: [
      { label: 'Louisiana 511', url: 'https://www.511la.org' }
    ],
    watchouts: [
      'Storm surge and slow drainage are the core risks. Parish guidance matters more than generic state-level assumptions.',
      'Road access can degrade quickly once water starts moving. Leave margin in your timing.',
      'Long outages in heat and humidity are common; power, fuel, water, and refrigeration planning need more weight here.'
    ]
  },
  'gulf-coast': {
    name: 'Gulf Coast',
    guideUrl: '/gulf-coast.html',
    emergencyOfficeName: 'your state emergency management office',
    emergencyOfficeUrl: 'https://www.ready.gov/local',
    extraOfficialLinks: [],
    watchouts: [
      'Warm water, surge exposure, and high heat make the Gulf Coast unforgiving even when the track shifts late.',
      'Fuel, bottled water, and generators tighten early across the Gulf. Buy time with early prep, not last-minute runs.',
      'Recovery windows are often longer than people expect. Plan for the week after landfall, not only the day of it.'
    ]
  },
  carolinas: {
    name: 'Carolinas',
    guideUrl: '/carolinas.html',
    emergencyOfficeName: 'North Carolina Emergency Management and South Carolina Emergency Management Division',
    emergencyOfficeUrl: 'https://www.readync.gov',
    extraOfficialLinks: [
      { label: 'South Carolina Emergency Management Division', url: 'https://www.scemd.org' }
    ],
    watchouts: [
      'Barrier-island evacuations can close early. If you are on or near the Outer Banks or low-lying coast, timing matters.',
      'The storm does not stop at landfall here. Inland flooding can be the longest and most damaging part of the event.',
      'Tree fall and long power outages extend well inland. Do not frame this as only a beach problem.'
    ]
  },
  georgia: {
    name: 'Georgia',
    guideUrl: '/georgia.html',
    emergencyOfficeName: 'Georgia Emergency Management and Homeland Security Agency',
    emergencyOfficeUrl: 'https://gema.georgia.gov',
    extraOfficialLinks: [],
    watchouts: [
      'Savannah and the Golden Isles have real surge exposure even though Georgia’s coastline is short.',
      'Georgia often gets significant rain and wind from storms that technically make landfall elsewhere.',
      'Post-storm heat, humidity, and mosquito pressure are part of the recovery problem. Plan for them now.'
    ]
  },
  alabama: {
    name: 'Alabama',
    guideUrl: '/alabama.html',
    emergencyOfficeName: 'Alabama Emergency Management Agency',
    emergencyOfficeUrl: 'https://ema.alabama.gov',
    extraOfficialLinks: [],
    watchouts: [
      'Mobile Bay is a surge trap. A short coastline does not mean a small risk.',
      'South Alabama can move from concern to action fast when the forecast tightens along the northern Gulf.',
      'Inland rain and wind reach well beyond the beach communities. Share this outside the immediate coast too.'
    ]
  },
  mississippi: {
    name: 'Mississippi',
    guideUrl: '/mississippi.html',
    emergencyOfficeName: 'Mississippi Emergency Management Agency',
    emergencyOfficeUrl: 'https://www.msema.org',
    extraOfficialLinks: [],
    watchouts: [
      'Mississippi’s surge history is catastrophic for a reason. Do not treat a short coastline as a limited threat.',
      'Flooding and power loss extend inland quickly from Gulf systems.',
      'Cleanup hazards are part of the plan here. Documents, first aid, masks, gloves, and contractor skepticism all matter.'
    ]
  },
  'puerto-rico': {
    name: 'Puerto Rico',
    guideUrl: '/puerto-rico.html',
    emergencyOfficeName: 'NMEAD',
    emergencyOfficeUrl: 'https://www.nmead.pr.gov',
    extraOfficialLinks: [
      { label: 'DTOP Puerto Rico', url: 'https://dtop.pr.gov' },
      { label: 'FEMA Puerto Rico', url: 'https://www.fema.gov/es/locations/puerto-rico' }
    ],
    watchouts: [
      'Two to four weeks of self-sufficiency is a serious planning horizon on the island, not an overreaction.',
      'Grid fragility and mountain terrain can stretch outages and road problems far past mainland expectations.',
      'Flooding, landslides, and coastal impacts can all happen in the same storm. Share official guidance early and in the household language people actually use.'
    ]
  }
};

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '--pdf') {
      args.pdf = true;
      continue;
    }

    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[i + 1];

    if (value === undefined || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`);
    }

    args[key] = value;
    i += 1;
  }

  return args;
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleCaseWords(value) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toAbsoluteUrl(siteBase, urlPath) {
  return new URL(urlPath, siteBase.endsWith('/') ? siteBase : siteBase + '/').toString();
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function buildOfficialLinks(region, siteBase) {
  const links = [
    {
      label: region.emergencyOfficeName,
      description: 'Local evacuation orders, shelters, and state-specific instructions.',
      url: region.emergencyOfficeUrl
    },
    {
      label: 'National Hurricane Center',
      description: 'Storm classification, advisories, cone, watches, and warnings.',
      url: 'https://www.nhc.noaa.gov'
    }
  ];

  region.extraOfficialLinks.forEach((link) => {
    links.push({
      label: link.label,
      description: 'Keep this open in a second tab while the forecast evolves.',
      url: link.url
    });
  });

  links.push({
    label: `${region.name} guide on ${SITE_NAME}`,
    description: 'The longer-form regional context behind this fast checklist.',
    url: toAbsoluteUrl(siteBase, region.guideUrl)
  });

  return links;
}

function buildResourceLinks(siteBase) {
  return COMMON_RESOURCES.map((resource) => ({
    label: resource.label,
    description: resource.description,
    url: toAbsoluteUrl(siteBase, resource.url)
  }));
}

function renderList(items) {
  return items.map((item) => `<li>${item}</li>`).join('\n');
}

function renderLinkList(items) {
  return items.map((item) => (
    `<li><strong><a href="${escapeHtml(item.url)}">${escapeHtml(item.label)}</a></strong> — ${escapeHtml(item.description)}</li>`
  )).join('\n');
}

function buildHtml(data) {
  const {
    createdAt,
    emergencyOfficeName,
    emergencyOfficeUrl,
    fileSlug,
    officialLinks,
    regionGuideUrl,
    regionName,
    resourceLinks,
    siteBase,
    stormName,
    watchouts
  } = data;

  const pageTitle = `${stormName} ${regionName} Prep Checklist — ${SITE_NAME}`;
  const metaDescription = `A fast, sendable checklist for ${stormName} planning in ${regionName}: official links, first actions, and the best hurricane prep checklists to open now.`;
  const canonicalUrl = toAbsoluteUrl(siteBase, `/storms/${fileSlug}.html`);
  const ogImageUrl = toAbsoluteUrl(siteBase, '/assets/img/og-default.png');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(metaDescription)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:image" content="${escapeHtml(ogImageUrl)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(metaDescription)}">
  <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    :root {
      --color-ink: #1F2A33;
      --color-ink-muted: #556270;
      --color-rule: #E6DFD0;
      --color-panel: #F7F3EA;
      --color-accent: #C2742B;
      --color-link: #3A6B83;
      --color-bg: #fff;
    }
    body {
      font-family: Inter, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: var(--color-ink);
      background: var(--color-bg);
      margin: 0;
      padding: 0.25in 0.5in;
      max-width: 7.5in;
    }
    h1, h2 {
      font-family: Fraunces, Georgia, serif;
      color: var(--color-ink);
      line-height: 1.1;
    }
    h1 {
      margin: 0 0 0.08in;
      font-size: 28pt;
    }
    h2 {
      margin: 0.24in 0 0.08in;
      padding-bottom: 4pt;
      border-bottom: 1pt solid var(--color-rule);
      font-size: 16pt;
      page-break-after: avoid;
    }
    p { margin: 0 0 0.12in; }
    a { color: var(--color-link); }
    .lede {
      margin: 0 0 0.22in;
      max-width: 6.5in;
      font-size: 10.5pt;
      color: var(--color-ink-muted);
    }
    .storm-sheet-banner {
      margin: 0 0 0.22in;
      padding: 0.14in 0.16in;
      border: 1pt solid var(--color-rule);
      border-radius: 10px;
      background: linear-gradient(180deg, #F3EDE2 0%, #FBF8F2 100%);
    }
    .storm-sheet-eyebrow {
      margin: 0 0 0.04in;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-ink-muted);
    }
    .storm-sheet-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8pt;
      margin-top: 0.1in;
    }
    .storm-sheet-pill {
      display: inline-flex;
      align-items: center;
      border: 1pt solid rgba(31, 42, 51, 0.1);
      border-radius: 999px;
      padding: 4pt 8pt;
      background: rgba(255, 255, 255, 0.75);
      font-size: 8.5pt;
      color: var(--color-ink-muted);
    }
    .storm-sheet-list,
    .storm-sheet-links {
      margin: 0;
      padding-left: 1.1rem;
    }
    .storm-sheet-list li,
    .storm-sheet-links li {
      margin-bottom: 0.08in;
      page-break-inside: avoid;
    }
    .storm-sheet-note {
      margin-top: 0.18in;
      padding-top: 6pt;
      border-top: 0.5pt solid var(--color-rule);
      font-size: 9pt;
      color: var(--color-ink-muted);
    }
    .print-support-line {
      margin: 0 0 0.22in;
      padding: 0 0 8pt;
      border-bottom: 0.5pt solid var(--color-rule);
      font-size: 9.5pt;
      color: var(--color-ink-muted);
    }
    .print-support-line a {
      color: inherit;
      text-decoration: none;
    }
    .site-line {
      margin-top: 4pt;
      font-size: 9pt;
      color: var(--color-ink-muted);
    }
    .disclaimer {
      margin-top: 0.25in;
      padding-top: 6pt;
      border-top: 0.5pt solid var(--color-rule);
      font-size: 9pt;
      color: var(--color-ink-muted);
    }
    .print-bar {
      display: none;
    }
    @media screen {
      body {
        max-width: 860px;
        margin: 2rem auto;
        padding: 2rem;
        border-radius: 10px;
        box-shadow: 0 2px 24px rgba(0, 0, 0, 0.08);
      }
      .print-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1.4rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--color-rule);
      }
      .print-bar-links,
      .print-bar-actions {
        display: flex;
        align-items: center;
        gap: 0.9rem;
        flex-wrap: wrap;
      }
      .back-link,
      .print-support-link {
        color: var(--color-link);
        text-decoration: none;
        font-size: 0.92rem;
      }
      .print-support-link {
        font-weight: 600;
        color: var(--color-ink-muted);
      }
      .back-link:hover,
      .print-support-link:hover {
        text-decoration: underline;
      }
      .print-bar button {
        border: none;
        border-radius: 6px;
        background: var(--color-accent);
        color: #fff;
        padding: 0.56rem 1.2rem;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
      }
      .print-support-line {
        padding: 0.7rem 0.9rem;
        border: 1px solid var(--color-rule);
        border-radius: 8px;
        background: var(--color-panel);
      }
    }
    @media print {
      .print-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <div class="print-bar-links">
      <a class="back-link" href="${escapeHtml(regionGuideUrl)}" target="_blank" rel="noopener">← Back to coastal guide</a>
      <a class="back-link" href="${escapeHtml(toAbsoluteUrl(siteBase, '/kits.html'))}" target="_blank" rel="noopener">Kit guides</a>
    </div>
    <div class="print-bar-actions">
      <a class="print-support-link" href="https://ko-fi.com/mikehen" target="_blank" rel="noopener">Support</a>
      <button onclick="window.print()">Print / Save as PDF</button>
    </div>
  </div>

  <p class="print-support-line">Better together at <a href="https://ko-fi.com/mikehen">ko-fi.com/mikehen</a></p>

  <p class="storm-sheet-eyebrow">Named storm checklist</p>
  <h1>${escapeHtml(stormName)} ${escapeHtml(regionName)} Prep Checklist</h1>
  <p class="lede">A fast, sendable version for the first hours after a storm is named. Use this to open the right official sources, get the essentials moving, and send the best deeper checklists to the people who need them.</p>

  <section class="storm-sheet-banner" aria-label="Storm checklist summary">
    <p>Do the basics before local watches start. Confirm the storm’s latest classification, track, and timing with <a href="https://www.nhc.noaa.gov" target="_blank" rel="noopener">NHC</a>, then use ${escapeHtml(regionName)} guidance for anything shelter, evacuation, or road-specific.</p>
    <div class="storm-sheet-meta" aria-label="Storm checklist details">
      <span class="storm-sheet-pill">${escapeHtml(regionName)} focus</span>
      <span class="storm-sheet-pill">Forwardable PDF</span>
      <span class="storm-sheet-pill">Generated ${escapeHtml(createdAt)}</span>
    </div>
  </section>

  <h2>Start now</h2>
  <ul class="storm-sheet-list">
    ${renderList([
      'Open the <a href="https://www.nhc.noaa.gov" target="_blank" rel="noopener">National Hurricane Center</a> advisory and your local emergency-management page in separate tabs.',
      'Confirm your evacuation zone, flood exposure, and the trigger that would make you leave. Do not wait to figure that out at warning time.',
      'Fuel the car, charge phones, charge power banks, and pull cash while stores and stations still feel normal.',
      'Refill prescriptions and pull together child, pet, and medical supplies that would be difficult to replace once demand spikes.',
      `Forward or print the evacuation, power outage, food and water, and documents checklists listed below.`
    ])}
  </ul>

  <h2>${escapeHtml(regionName)} watch-outs</h2>
  <ul class="storm-sheet-list">
    ${renderList(watchouts.map(escapeHtml))}
  </ul>

  <h2>Official sources to open now</h2>
  <ul class="storm-sheet-links">
    ${renderLinkList(officialLinks)}
  </ul>

  <h2>Best full checklists to send with this</h2>
  <ul class="storm-sheet-links">
    ${renderLinkList(resourceLinks)}
  </ul>

  <p class="disclaimer">Use this checklist as a fast starting point, not a replacement for local orders. For official warnings, evacuation instructions, and shelter locations, use <a href="${escapeHtml(emergencyOfficeUrl)}" target="_blank" rel="noopener">${escapeHtml(emergencyOfficeName)}</a> and the <a href="https://www.nhc.noaa.gov" target="_blank" rel="noopener">National Hurricane Center</a>.</p>
  <p class="site-line">${SITE_NAME}</p>
</body>
</html>
`;
}

function ensureOutputDir(outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function resolveRegion(input) {
  const canonical = REGION_ALIASES[slugify(input).replace(/-/g, '')] || REGION_ALIASES[slugify(input)] || input;
  const region = REGIONS[canonical];

  if (!region) {
    const valid = Object.keys(REGIONS).join(', ');
    throw new Error(`Unknown region "${input}". Use one of: ${valid}`);
  }

  return { slug: canonical, ...region };
}

function renderPdf(htmlPath, pdfPath, chromePath) {
  if (!fs.existsSync(chromePath)) {
    throw new Error(`Chrome not found at ${chromePath}`);
  }

  execFileSync(chromePath, [
    '--headless=new',
    '--disable-gpu',
    `--print-to-pdf=${pdfPath}`,
    `file://${htmlPath}`
  ], { stdio: 'ignore' });
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.storm || !args.region) {
    throw new Error('Usage: node scripts/generate-storm-packet.js --storm "Milton" --region florida [--pdf] [--output-dir storms]');
  }

  const stormName = titleCaseWords(args.storm);
  const stormSlug = slugify(args.storm);
  const region = resolveRegion(args.region);
  const outputDir = path.resolve(args['output-dir'] || DEFAULT_OUTPUT_DIR);
  const siteBase = args['site-base'] || DEFAULT_SITE_BASE;
  const chromePath = args.chrome || DEFAULT_CHROME_PATH;
  const fileSlug = `${stormSlug}-${region.slug}-prep-checklist`;
  const htmlPath = path.join(outputDir, `${fileSlug}.html`);
  const pdfPath = path.join(outputDir, `${fileSlug}.pdf`);
  const createdAt = formatDate(new Date());

  ensureOutputDir(outputDir);

  const html = buildHtml({
    createdAt,
    emergencyOfficeName: region.emergencyOfficeName,
    emergencyOfficeUrl: region.emergencyOfficeUrl,
    fileSlug,
    officialLinks: buildOfficialLinks(region, siteBase),
    regionGuideUrl: toAbsoluteUrl(siteBase, region.guideUrl),
    regionName: region.name,
    resourceLinks: buildResourceLinks(siteBase),
    siteBase,
    stormName,
    watchouts: region.watchouts
  });

  fs.writeFileSync(htmlPath, html, 'utf8');

  if (args.pdf) {
    renderPdf(htmlPath, pdfPath, chromePath);
  }

  process.stdout.write(`Created HTML: ${htmlPath}\n`);

  if (args.pdf) {
    process.stdout.write(`Created PDF: ${pdfPath}\n`);
  } else {
    process.stdout.write(`PDF not generated. Re-run with --pdf to render ${path.basename(pdfPath)}.\n`);
  }
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
