# WeOne — Responsive Optimization Audit

**Date:** 2026-07-13
**Scope:** all 6 pages (`index.html`, `about.html`, `work.html`, `blog.html`, `blog-detail.html`, `coming-soon.html`)
**Breakpoints in use** (from `assets/css/responsive.css`): 1399 · 1199 · 991 · 767 · 575 · 400px, plus Bootstrap's native grid breakpoints (576/768/992/1200/1400).

## Methodology

- Live browser testing via the project's dev server (`python -m http.server 3000`) at 1920 / 1440 / 1199 / 991 / 800px on every page, checking `document.documentElement.scrollWidth` vs `window.innerWidth` for horizontal overflow, plus screenshots and computed-style inspection of suspect elements.
- Static review of `assets/css/responsive.css` in full (690 lines) and every page's own inline `<style>` block, cross-referenced against each page's HTML structure — used for the sub-768px phone range and to double-check anything live testing couldn't fully confirm.
- Work was parallelized: one pass per page, then a consolidation pass re-verifying the highest-severity findings directly before writing fixes.

### Tool limitations hit during this audit (environment, not site bugs)

1. **Custom viewport widths below ~768px report incorrect `window.innerWidth`/`devicePixelRatio`** in this preview environment (e.g. requesting 400px could report `innerWidth: 878, dpr: 2`). Confirmed via a full dev-server restart — not a stuck session state, a characteristic of the tool itself. Worked around by trusting static CSS analysis for phone-sized breakpoints instead of live pixel measurements.
2. **Exact breakpoint boundaries (991px, 1199px) sometimes evaluate `matchMedia` one pixel off from `window.innerWidth`** — e.g. resizing to exactly `1199` could report `innerWidth: 1199` while `matchMedia('(max-width:1199px)').matches` returns `false`. Worked around by testing 1px below the boundary (990, 1198) whenever a boundary value looked suspicious.
3. Several parallel audit agents briefly shared one browser tab and interfered with each other's navigation. Findings from that window were cross-checked against a second, exclusive-access pass before being treated as confirmed.

None of the above affected the validity of the confirmed findings below — every fix in this report was verified against the actual served CSS/HTML, and the critical one was visually screenshotted before and after.

---

## Findings & Fixes

### 1. 🔴 CRITICAL — Header CTA button wraps to 3 lines, site-wide, 992–1199px

- **Pages affected:** all 6 (shared header markup + `assets/css/main.css` / `assets/css/responsive.css`)
- **Breakpoint:** 992px–1199px (Bootstrap's `lg` grid breakpoint activates `.col-lg-2` for `.header-cta`, but the existing "icon-only" compact treatment for the CTA button didn't kick in until `≤767px`)
- **Root cause:** `.header-cta` sits in a Bootstrap `col-lg-2 col-md-9 col-6` column. Below 768px it uses the roomy `col-md-9` (75% width); above 1199px the container is capped at 1400px giving `col-lg-2` just enough room. But **between 992–1199px**, `col-lg-2`'s ~16.7% share is only ~170–200px — too narrow for "Get A Call Back" + icon on one line. The text wrapped to 2–3 lines, inflating the button to ~102px tall and visually breaking the header.
- **Confirmed:** independently found via static analysis on 2 of 5 parallel page audits (`about.html`, `blog.html`), then reproduced and screenshotted live on `index.html` at 1198px (button height 101.9px → wrapped "Get A / Call / Back").
- **Fix:** `assets/css/responsive.css`, inside the existing `@media (max-width: 1199px)` block — added the same icon-only treatment already used at `≤767px`:
  ```css
  .header-cta .cta-btn { font-size: 0; padding: 10px 10px; min-width: unset; }
  .header-cta .cta-btn .cta-icon { margin-left: 0; }
  ```
- **Verified:** button height dropped to 41.1px (normal single-line pill) at 1198px, confirmed on both `index.html` and `about.html`. ✅ Fixed

### 2. 🟠 MODERATE — `.hero-eyebrow` font-size regression on phones (index.html)

- **Page:** `index.html`
- **Breakpoints:** 767 / 575 / 400px
- **Root cause:** every other large display-text rule in `responsive.css` shrinks progressively as the viewport narrows (e.g. `.hero-title`, `.wetitle`, `.designFuture .wetitle` all step down cleanly at every breakpoint). `.hero-eyebrow` was the one exception — it went `96px (desktop) → 76px (1399) → 56px (991) → 69px (767) → 69px (575) → 69px (400)`: **larger** at the phone breakpoint than at tablet, then flatlined unchanged all the way to the smallest phones. This risked the "DESIGNING IDEAS. DEVELOPING IMPACT." eyebrow wrapping across more lines than the hero's carefully-budgeted vertical space allows on short phones (the 991px block's own comments describe hand-tuning that budget to ~306px).
- **Fix:** corrected the progression to continue shrinking: `767px → 48px`, `575px → 38px`, `400px → 32px`.
- **Verified:** confirmed via computed style at 900px (56px, correct/unaffected) and via direct source reading for the sub-768 values (a straightforward textual fix — no live rendering ambiguity involved). ✅ Fixed

### 3. 🟡 MINOR — `.value-lottie` icon too tight inside its box at 767px (index.html)

- **Page:** `index.html` — hero value cards ("Expert-level design" / "Lightning-fast delivery" / "Creative leadership")
- **Breakpoint:** 767px
- **Root cause:** `.value-lottie` (the Lottie icon added earlier this session) is a fixed 66×66px set in `main.css`. At the `767px` breakpoint, its parent `.value-icon` shrinks to 68×68px — leaving only 1px of clearance on each side, uncomfortably tight and with no margin for rendering variance.
- **Fix:** added an explicit `.value-swiper .value-icon .value-lottie { width: 56px; height: 56px; }` at `≤767px` for proper breathing room.
- **Status:** ✅ Fixed (code-verified; not a breaking bug, a safety-margin improvement)

### 4. 🟡 MINOR — blog-detail.html sidebar / title / article-body gaps

- **Page:** `blog-detail.html`
- **Breakpoints:** 991 / 575px
- **Issues found:**
  - `.sidebar { position: sticky; top: 100px; }` had no reset once the 2-column layout (`col-lg-8` / `col-lg-4`) stacks to a single column below 992px — sticky positioning next to content it's no longer beside serves no purpose.
  - `.detail-title` (56px) jumped straight to 36px at `≤767px` with no intermediate tablet step.
  - `.article-body` heading/paragraph text (`h2`: 30px, `p`/`li`: 17px) had zero mobile-specific downsizing.
- **Fix:** added to `blog-detail.html`'s inline `<style>` block:
  ```css
  @media (max-width: 991px) {
      .sidebar { position: static; top: auto; }
      .detail-title { font-size: 44px; }
  }
  @media (max-width: 575px) {
      .article-body h2 { font-size: 24px; margin: 28px 0 12px; }
      .article-body h3 { font-size: 19px; }
      .article-body p, .article-body ul li { font-size: 15px; }
  }
  ```
- **Status:** ✅ Fixed

### 5. ⚪ Investigated, no fix needed — work.html card aspect-ratio at 991–1199px

- **Page:** `work.html`
- Static analysis flagged that `.work-card`'s width formula (`calc(33.333% - 70px)`) doesn't scale alongside its height override at the `1199px`/`991px` breakpoints, shifting the 3 hero cards from a landscape-ish crop toward portrait. **Live-verified at 900px** — the crop looks intentional/acceptable in practice, since 2 of the 3 source images are phone-mockup screenshots that suit a portrait crop naturally. No change made.

### 6. ⚪ Reviewed, already solid — everything else

The following were checked and found to already have complete, well-considered responsive coverage (extensive breakpoint-specific comments in `responsive.css` indicate this was carefully hand-tuned before this audit):

- `index.html`: hero pin/scrub mechanism, value-card swiper breakpoints (576/768/992 in the Swiper config), studio-banner badge reflow, service-card peek-stack, design-future card fan→stack, testimonial swiper (0/576/768/992 breakpoints), footer stacking.
- `about.html`: stats grid (4→2→1 col), values grid (3→1 col), hero padding.
- `blog.html`: Bootstrap `col-lg-4/col-md-6/col-12` card grid, category filter pill wrapping.
- `coming-soon.html`: fully clean at all 5 tested breakpoints — no changes.
- Project-popup modal (`index.html`'s "Got A Project?" form): already has its own `@media (max-width: 600px)` block handling padding/1-column form fields/title size.

---

## Summary of files changed

| File | Change |
|---|---|
| `assets/css/responsive.css` | Header CTA icon-only fix at ≤1199px · `.hero-eyebrow` progression fix (767/575/400) · `.value-lottie` sizing at ≤767px |
| `blog-detail.html` | Sidebar sticky reset + title/article-body mobile sizing (inline `<style>`) |
| `about.html`, `blog.html`, `blog-detail.html`, `coming-soon.html`, `index.html`, `work.html` | Bumped `responsive.css?v=2` cache-busting param so the fixes actually reach browsers that already cached the old file (it previously had no version param at all) |

## Recommendation for future work

`responsive.css` and `main.css` are both cache-busted with a manual `?v=N` query param that has to be remembered and incremented by hand on every edit, across every page that links it — this has already caused "fix isn't showing up" confusion twice in this project's history. Worth moving to a build-time content hash or at minimum a single shared version constant, if a build step is ever introduced.
