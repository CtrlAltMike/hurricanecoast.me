# Cascadia Support Pattern

This note captures the transferable support lessons from building `HurricaneSupplyList.com`, plus a concrete implementation checklist for `cascadia.me`.

## Reusable Pattern

The durable lesson is: ask after usefulness, not before it.

Use this support pattern on content-driven sites:

1. Put `Support` in the top nav.
   It should be visible from every page but not styled louder than the main navigation.

2. Add a support card near the end of substantive pages.
   Best after the main content and before share/footer. That is the moment when a reader has enough context to decide whether the site helped.

3. Put support beside high-intent actions.
   Printing, saving, sharing, forwarding, or downloading are the right moments because the user has already decided the page is valuable.

4. Keep the footer clean.
   Footer support links are too weak to matter, and if they are the main ask, they train you to hide the ask instead of designing it.

5. Use one tone consistently.
   Direct, brief, grateful, non-performative.

6. Match the page type.
   Guide page: `If this guide helped...`
   Site landing page: `If this site helped...`
   Printable: short support line near print controls
   About page: fuller explanation of why support matters

7. Make support feel native to the site.
   Same typography, same spacing, same button system, same voice. It should feel like part of the editorial product, not a bolt-on fundraising widget.

## For Cascadia

`cascadia.me` is probably an even better candidate for this than `HurricaneSupplyList.com`, because it already has a stronger authorial voice and mission-driven framing.

Apply the pattern like this:

1. Add `Support` to the top nav across the site.
2. Add an end-of-guide support card on each major guide page.
3. Add a support link near any share/download/print action.
4. Strengthen the support explanation on `The Approach` page rather than hiding it in the footer.
5. Prioritize pages with especially high emotional trust or strong practical value.

The key difference from Hurricane Supply List:

- `cascadia.me` can probably carry a slightly more personal support message.
- The placement strategy should stay the same: after value, not before it.

## Cascadia Implementation Checklist

Use this as the implementation checklist for `cascadia.me`.

1. Add `Support` to the global nav.
   Use the same quiet treatment as other top-level nav items.
   Open Ko-fi in a new tab with `target="_blank" rel="noopener"`.

2. Identify the site’s high-value page types.
   Mark which pages are:
   - major guides
   - landing pages
   - approach/about pages
   - print/download pages
   - share-heavy pages

3. Add an end-of-page support card to every major guide.
   Place it after the main content and before share/footer.
   Reuse one consistent component and only vary the first sentence by page type.

4. Add a site-level support card to the major landing pages.
   Use site wording instead of guide wording.
   Example pattern:
   `If this site helped, keep it going.`

5. Add support near high-intent actions.
   Put a support link or small support cue next to:
   - `Print`
   - `Save as PDF`
   - `Download`
   - `Share`
   - `Copy link`
   Do not make it louder than the primary action.

6. Add a fuller support explanation to `The Approach` page.
   Explain:
   - why the site exists
   - why it stays ad-free
   - why support helps
   Keep it personal, but short.

7. Remove footer-only dependency.
   If support currently lives mainly in the footer, demote or remove that pattern.
   Footer should not be the main support strategy.

8. Standardize support copy.
   Create 3 reusable variants:
   - site-level
   - guide-level
   - print-level
   Keep them all short, direct, and consistent.

9. Add print-header support lines to all hardcopy-oriented pages.
   Anything meant for hardcopy should include a top-of-page line such as:
   `Support me at ko-fi.com/mikehen`
   Put it near the top of the printable page, styled lightly but clearly.
   It should survive both browser print and PDF export.

10. Review print CSS specifically.
    Confirm the print-support line:
    - appears on screen in a reasonable way
    - prints reliably
    - does not collide with titles or margins
    - works across multi-page printouts

11. Keep support visually integrated.
    Reuse existing:
    - typography
    - spacing
    - button styles
    - panel/card styling
    Do not introduce a “donation widget” visual language.

12. Verify page-by-page.
    For each affected template, check:
    - nav support link exists
    - support card placement is correct
    - print support line appears where relevant
    - no page ends up with duplicate support asks stacked too closely together

## Support Copy Set

Use something like this:

- Site card:
  `If this site helped, keep it going.`
  `No ads. No affiliate links. If this made your planning clearer, you can support the project.`

- Guide card:
  `If this guide helped, keep it going.`
  `If this page saved you time or made the decision-making clearer, you can support the work.`

- Print line:
  `Support me at ko-fi.com/mikehen`

- Approach page:
  `This project stays independent because readers support it. If you want to help keep it ad-free and useful, you can support it at ko-fi.com/mikehen.`

## Priority Order

If this is not implemented all at once, do it in this order:

1. Global nav `Support`
2. End-of-guide support cards
3. Print-header support lines
4. Approach-page support section
5. Support near share/download actions

## Recommendation

Think of support as a design system component, not a one-off link. The system is:

1. global visibility in nav
2. contextual ask near value completion
3. reinforcement near high-intent actions
4. mission explanation on the about/approach page
5. no clutter in the footer
