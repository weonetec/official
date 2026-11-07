# WeOne — official website (weone.tech)

Live, public marketing site for WeOne, a web design / development / UI-UX agency in Kolkata, India. Updated frequently. Treat every change as going to production.

## Stack & deployment

- **Plain static HTML + CSS + vanilla JS (jQuery, GSAP).** No build step, no framework, no templating. `package.json` (gsap) is unused at runtime; GSAP is served from `assets/js/` or cdnjs.
- **PHP** only for the lead/email backend (`assets/php/`) and the gated quote page `quote-dmdigitals.php`.
- **Hosting:** Hostinger, Apache. **Git auto-deploy** from `origin` (`github.com/weonetec/official`) on `main`. Pushing to `main` = publishing live. Hostinger re-syncs the deployed folder on every deploy, so any untracked file on the server inside the site folder is wiped.
- `.htaccess` strips `.html` and `index.html` (301) and serves `page` → `page.html`. Internal links and canonical URLs use the clean form (`https://weone.tech/about`, not `about.html`).
- **Local preview:** `.claude/launch.json` → `python -m http.server 3000` (name `weone`). It does not run PHP, so forms and `quote-dmdigitals.php` can't be tested there.

## Pages (repo root)

| File | Purpose |
|---|---|
| `index.html` | Home (largest page, ~195 KB) |
| `about.html`, `work.html`, `pricing.html`, `blog.html` | Main nav pages |
| `blog-detail-<slug>.html` | Six blog posts |
| `coming-soon.html` | Placeholder, `noindex` |
| `quote-photography-website.html` | Client quotation page, `noindex` |
| `quote-dmdigitals.php` | Private quotation behind email-code gate, `noindex` |
| `test.html`, `default.php`, `_reference/` | Scratch / Hostinger default / old reference. Not part of the site. |

**There are no shared includes.** Header, nav, mobile drawer, footer, `<head>` (GA4, fonts, CSS links), and the closing CTA band are copied into every page. A sitewide change (nav item, footer, contact info, tracking) must be applied to **every** page file, including `coming-soon.html`, the quote pages, and `quote-dmdigitals.php`. Check with `grep -L` that none were missed.

## Assets

- CSS: `bootstrap.min.css`, `new.css`, `main.css`, `responsive.css` (breakpoints 1399 / 1199 / 991 / 767 / 575 / 400), `popup.css`. Many pages also have a page-specific inline `<style>` block.
- **Cache busting:** CSS links use `?v=N` (e.g. `main.css?v=57`, `responsive.css?v=60`). When editing a CSS file, bump its `?v=` on every page that links it. Versions are currently inconsistent between pages (some `new.css` links have none).
- JS: `main.js` (GSAP/ScrollTrigger animations), `popup.js`, `logo-animation.js`, `whatsapp-button.js`, `quote-gate.js`.
- Fonts: Satoshi (body) and Morganite (display), self-hosted. Icons: Remixicon (CDN). Swiper from CDN on some pages.
- Lottie JSON in `assets/lottie/`. Images in `assets/images/`; blog images exist as both original and `.webp`, with separate `-listing` (4:3 card) and `-detail` versions.

## Lead capture (forms → email)

- `popup.js` builds two popups injected on every page: **project** (opened by `.js-open-popup`, e.g. "Get A Call Back") and **plan** (opened by `.js-open-plan-popup`, pricing page only; adds plan, billing, industry).
- Flow: `send-verification.php` emails a 6-digit code → `verify-code.php` marks the email verified in the PHP session → `send-mail.php` sends the lead via PHPMailer SMTP (re-checks verification server-side; has a honeypot).
- `phone-validation.php` rejects fake numbers (Indian mobile: 10 digits starting 6–9, optional +91/91/0).
- `email-template.php` is the shared branded HTML email layout (tables + inline CSS on purpose).
- Quote gate: `quote-gate.js` → `quote-request.php` → `quote-verify.php`, which sets `$_SESSION['quote_access']['dmdigitals']`. A separate session bucket from the popup.
- **SMTP credentials:** `mail-config.php` is gitignored and must never be committed. On the server it lives one level above the deployed folder (see `config-loader.php`). Template: `assets/php/mail-config.sample.php`.

## SEO / GEO (keep in sync)

Each public page carries: title, meta description, canonical, Open Graph, JSON-LD (Organization / LocalBusiness entity graph; blog posts add `BlogPosting` and `BreadcrumbList`), and GA4 tag `G-TYH3CKMY6V`.
When you add, remove, or rename a page or blog post, also update:
- `sitemap.xml`
- `llms.txt` (AI-assistant summary of services, pages, pricing, contact)
- `blog.html` listing cards and the related-posts section on other blog posts
- `robots.txt` only if crawl rules change (all AI crawlers are deliberately allowed)

## Business facts used across the site

- Email `info@weone.tech`. WhatsApp `+91 6289 224 534` (`whatsapp-button.js` holds it in wa.me format `916289224534`).
- Address: Spcenex, 361, Purbachal, Kalitala Road, Kolkata 700078.
- Pricing is quoted as "starting from": one-time builds from ₹10,000, monthly plans from ₹1,599/mo.
- Owner/founder names were deliberately removed from all public pages. Don't reintroduce them.

If any of these change, search the whole repo (HTML, PHP, JSON-LD, `llms.txt`, JS) and update every occurrence.

## Working conventions

- Commit messages: short, imperative, describing the user-visible change (see `git log`).
- Verify visual changes in the preview at desktop and phone widths; check for horizontal overflow. `RESPONSIVE-AUDIT.md` records past breakpoint fixes and preview-tool quirks.
- Ask before pushing: a push to `main` deploys to the live site.
