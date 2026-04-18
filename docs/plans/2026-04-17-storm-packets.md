# Storm Packets

The fastest low-cost storm-naming move for this repo is not a full live-updating storm section. It is a forwardable storm packet that can be created in minutes and saved as a PDF.

## Goal

Generate a stand-alone HTML page and optional PDF named like:

- `milton-florida-prep-checklist.html`
- `milton-florida-prep-checklist.pdf`

Each packet should be:

- specific to the storm name
- specific to a coastal guide region
- useful before watches and warnings are local
- easy to email, text, attach, or upload to portals

## Generator

Use:

```bash
node scripts/generate-storm-packet.js --storm "Milton" --region florida --pdf
```

That writes output to `/storms/` by default.

Supported regions:

- `florida`
- `texas`
- `louisiana`
- `gulf-coast`
- `carolinas`
- `georgia`
- `alabama`
- `mississippi`
- `puerto-rico`

## Contents

Each packet includes:

- a storm-name headline
- immediate actions
- region-specific watch-outs
- official links
- the best deeper checklist links to forward with it

## Publishing flow

When a storm is first named:

1. Run the generator for the most relevant coasts.
2. Commit the generated HTML and PDF files under `/storms/`.
3. Push to `main`.
4. Share the PDF filename directly and link the HTML page publicly.

## Why this first

- No build step required
- No third-party service required
- Uses the site’s existing evergreen content as the deeper layer
- Lets the site match storm-name search and private forwarding behavior quickly
