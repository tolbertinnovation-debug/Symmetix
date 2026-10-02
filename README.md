# Symmetrix Management Holdings LLC — Company Website

A fast, accessible, fully responsive marketing website for **Symmetrix Management
Holdings LLC**, a Liberian management holding company operating four divisions:
**Accountancy**, **Travels**, **Education** and **Logistics Management**.

Static HTML, CSS and vanilla JavaScript — no build step, no dependencies, no
framework. Drop the folder on any web host and it works.

---

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home — positioning, the four divisions, standards, process, sectors served |
| `about.html` | Company story, mission / vision / promise, values, how the group is organised |
| `divisions.html` | Overview of all four divisions + "start from the problem" router |
| `accountancy.html` | Division 01 — services, deliverables, process, FAQs |
| `travels.html` | Division 02 — services, deliverables, process, FAQs |
| `education.html` | Division 03 — services, deliverables, process, FAQs |
| `logistics.html` | Division 04 — services, deliverables, process, FAQs |
| `contact.html` | Contact methods, division-aware enquiry form, FAQs |
| `privacy.html` | What the site and each division collect, who sees it, how to have it removed |
| `404.html` | Not-found page |

Supporting files: `assets/css/styles.css`, `assets/js/main.js`,
`assets/img/` (logo assets — see below), `assets/fonts/` (self-hosted webfonts
and their OFL licences), `robots.txt`, `sitemap.xml`, `.nojekyll`.

## Design system

Everything is driven by custom properties at the top of `assets/css/styles.css`.
Both themes are defined there as token sets, so the whole site can be re-themed
from one block.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--brand-green` | `#0B5730` | same | Primary brand green (from the logo) |
| `--brand-orange` | `#F07C1A` | same | Brand accent (from the logo) |
| `--bg` | `#FFFFFF` | `#071A11` | Page ground |
| `--text` | `#101A14` | `#EDF4EF` | Body text |
| `--accent-ink` | `#AE5207` | `#FBB56B` | Orange that is legible as *text* on that ground |

Brand colours stay fixed across themes; everything else is semantic and flips.
The split matters: `--brand-orange` is a fill colour and fails contrast as small
text, so anything that must be read uses `--accent-ink` instead.

- **Type:** Playfair Display (display) and Inter (body), both as variable fonts,
  **self-hosted** — see Performance. Sizes use `clamp()` so they scale fluidly
  from 360px to 1440px+ with no breakpoint jumps.
- **Layout:** intrinsic CSS Grid (`auto-fit` + `minmax`), so sections reflow
  instead of relying on device-specific media queries.
- **Dark mode:** **light is the default for every visitor**, including those whose
  operating system is set to dark — the OS preference is deliberately not
  followed. Dark applies only once someone chooses it with the header toggle, and
  that choice then persists in `localStorage`. A tiny inline script in `<head>`
  applies the stored theme before first paint, so there is no flash.
  To go back to following the OS, re-add a `@media (prefers-color-scheme: dark)`
  block mirroring the `[data-theme="dark"]` tokens, and let `current()` in
  `main.js` fall back to the media query.
- **Texture:** one fixed SVG grain layer over the page (`body::after`), blend
  mode `multiply` in light and `screen` in dark.
- **Backgrounds:** the site has one photograph, `hero-skyline` (WebP + JPEG, at
  900px and 1672px), and every photographic band reuses it, so it downloads once:
  - the homepage hero (`<picture>`, preloaded);
  - every interior `.page-hero`, cropped per page with an inline
    `style="--pos: x% y%"` on the section;
  - the `.cta-band` that closes each content page;
  - very faintly behind `.section--dark`.
  A brand-green gradient over the photo keeps text contrast; it is heaviest on
  the text side and goes uniform below 900px. Light sections (`--alt`, `--sand`)
  carry a fine architectural grid that fades out from one corner.

### Logo assets

Every mark on the site is the supplied artwork; nothing is redrawn. Each file is
derived from `symmetrix-logo.jpg` and sized for where it is used.

| File | Size | Used for |
| --- | --- | --- |
| `symmetrix-logo.jpg` | 1254px | The full lockup, shown on the About page |
| `symmetrix-mark.png` | 256px | Header, mobile drawer and footer mark (50px on screen) |
| `symmetrix-emblem.jpg` | 640px | The hero, inside the white circle |
| `apple-touch-icon.png` | 180px | iOS home screen and bookmarks |
| `favicon-32.png` | 32px | Browser tab, for browsers without SVG favicon support |
| `favicon.svg` | vector | Browser tab — see the note below |
| `og-image.jpg` | 1200×630 | Social share preview (skyline + logo plate) |
| `hero-skyline*.{webp,jpg}` | 900 / 1672px | The brand photograph — see Backgrounds |

Two details worth knowing before regenerating any of them:

- `symmetrix-mark.png` has its background flattened to pure `#FFFFFF`. The
  original JPEG's background carries compression noise, which shows as a faint
  box around the logo against the white header. The flattening threshold keeps
  the light-grey continents inside the globe intact.
- The header is white and the footer is dark green, so the footer mark sits on a
  white rounded-square tile. A circular tile was rejected because it clips the
  aeroplane and the tail of the orange swoosh.
- `favicon.svg` is the one deliberate exception: a simplified mark (globe ring,
  four quadrants, orange arc) in the brand colours. At 16-32px the full artwork
  reduces to an unreadable blur, so the tab icon uses a simplified derivative —
  standard practice for detailed logos. `apple-touch-icon.png` and every on-page
  mark use the real artwork, because at those sizes it reads properly.

## Behaviour (`assets/js/main.js`)

Progressive enhancement only — every page is fully readable and navigable with
JavaScript disabled.

- Theme toggle (light by default, dark on request), with no flash of the wrong theme.
- Sticky navigation that gains a shadow on scroll (the contact bar scrolls away).
- Divisions dropdown on desktop: hover, click and keyboard (Escape closes).
- Mobile drawer with focus trapping, Escape to close and scroll lock.
- Reveal-on-scroll and count-up figures via `IntersectionObserver`.
- Accordion FAQs using native `<details>`.
- **Division-aware enquiry form:** choosing a division reveals the two or three
  follow-up questions that division actually needs to quote. Hidden branches are
  `disabled` as well as `hidden`, so they can never block validation, and the
  generated email includes whatever was filled in.
- `prefers-reduced-motion` is respected throughout, including view transitions.

## Accessibility

- Skip link, single `<h1>` per page, landmark elements and labelled breadcrumbs.
- All form fields have real `<label for>` pairs; errors are announced via
  `aria-live` and flagged with `aria-invalid`.
- Icons are `aria-hidden`; icon-only controls carry `aria-label`. The theme
  toggle exposes `aria-pressed` and relabels itself.
- Visible focus rings (`:focus-visible`) on every interactive element.
- **Contrast is measured, not assumed.** A script walks every rendered page in
  both themes, computes each text node's effective background through any
  translucent ancestors, and checks the ratio against WCAG AA (4.5:1 for body
  text, 3:1 for large text). All 14 page renders pass with zero failures. Re-run
  it after any colour change (`node tools/contrast-audit.js` — see
  `tools/README.md`). It has caught four real regressions so far, including an
  accent button whose label colour was being overridden inside the mobile
  drawer.
- Reveal animations are scoped to `.js`, so with scripting disabled the whole
  page renders.

## SEO

Per-page `<title>` and meta description, canonical URLs, Open Graph and Twitter
cards, `sitemap.xml`, `robots.txt`, and JSON-LD structured data: `Organization`
with both phone numbers and opening hours, `Service` per division, `FAQPage` on
the division and contact pages, and `BreadcrumbList` on every interior page.

---

## Performance

The site loads **no third-party resources at all** — no font CDN, no analytics,
no tag manager. That is a deliberate choice for an audience largely on Liberian
mobile data, where each extra DNS lookup and TLS handshake is expensive.

Homepage, first visit, gzipped (as GitHub Pages serves it):

| Asset | Transfer |
| --- | --- |
| HTML | ~9 KB |
| CSS | ~10 KB |
| JS | ~4 KB |
| Logo mark (PNG) | 41 KB |
| Fonts (3 woff2) | 123 KB |
| Skyline photo (WebP, 1672px; 52 KB at 900px on phones) | 133 KB |
| **Total** | **~320 KB in 9 requests** |

Interior pages reuse the cached photograph, so after the homepage they add no
image weight. Repeat visits are around 22 KB.

Notes for anyone changing this:

- The fonts are variable, latin-subset woff2 files under `assets/fonts/`, with
  `unicode-range` set so the latin-ext files download only if a page actually
  uses those characters. The two latin files are preloaded.
- Playfair's italic file loads only on pages that use it (the homepage headline).
- `symmetrix-mark.png` is 176px for a 50px mark — enough for a 3x display and no
  more. Regenerating it larger is the easiest way to make the site slower.
- Font licences: Inter and Playfair Display are both SIL Open Font License 1.1.
  The licence texts ship alongside the font files, as the OFL requires. Keep them
  there if you replace or move the fonts.

## Checking your changes

`tools/verify.js` and `tools/contrast-audit.js` re-run the checks behind the
claims above — layout overflow, console errors, off-origin requests, the theme
toggle, the enquiry form, and WCAG contrast in both themes. See
[`tools/README.md`](tools/README.md). They are development-only; the site itself
has no dependencies.

## Running it locally

No tooling required — open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying

### GitHub Pages (current setup)

Served at **https://symmetrixholdings.com** (the `CNAME` file). Canonical URLs,
Open Graph tags, JSON-LD, `sitemap.xml` and `robots.txt` all use that domain.

Pages is configured as **Settings → Pages → Deploy from a branch → `main` /
`(root)`**. GitHub's own builder publishes on every push to `main`; there is no
workflow file and no build step. `.nojekyll` is what stops Jekyll from ignoring
`assets/`.

All internal links are relative, so serving from a sub-path needs no changes.

### Other hosts

Plain static files, so these work as-is:

- **Netlify / Vercel / Cloudflare Pages** — no build command, publish directory `/`.
- **Any shared host / cPanel** — upload the folder contents to `public_html`.
  (`.nojekyll` only matters on GitHub Pages; it stops Jekyll touching `assets/`.)

### Changing the domain

If the domain ever changes:

1. Add a `CNAME` file at the repository root containing just the domain.
2. Point DNS at GitHub Pages (`A` records to GitHub's IPs, or a `CNAME` to
   `tolbertinnovation-debug.github.io`), then set the domain in Settings → Pages.
3. Rewrite the URLs in one pass:

   ```bash
   grep -rl "https://symmetrixholdings.com" . \
     --include="*.html" --include="*.xml" --include="*.txt" \
     | xargs sed -i "s|https://symmetrixholdings.com|https://www.yourdomain.com|g"
   ```

Leaving canonical tags pointing at a domain that does not resolve will keep the
site out of search results, so do step 3 whenever the hosting URL changes.

---

## Before going live — please confirm these details

Everything below is content, not code. The phone numbers are the ones supplied;
the rest are sensible placeholders that should be replaced with the company's
real details.

1. **Email address** — currently `info@symmetrixholdings.com`. Change it in
   `assets/js/main.js` (the `data-mailto` fallback) and across the pages:
   ```bash
   grep -rl "info@symmetrixholdings.com" . --include="*.html" --include="*.js" \
     | xargs sed -i "s/info@symmetrixholdings.com/YOUR@EMAIL/g"
   ```
2. **Street address** — the site currently says only "Monrovia, Liberia" and
   "office visits by appointment". Add the full address (and a map embed on
   `contact.html`) once confirmed.
3. **Business hours** — Mon–Fri 8:30–17:30 and Sat 9:00–13:00 are assumed. They
   appear in the footer, on `contact.html`, and in the JSON-LD
   `openingHoursSpecification`.
4. **Domain** — canonicalised to `https://symmetrixholdings.com`.
5. **Social profiles** — the footer deliberately links only to real, working
   channels (WhatsApp, email, phone). Add Facebook / LinkedIn / Instagram links
   to the `.socials` block in the footer when the accounts exist.
6. **Form delivery** — the enquiry form has no server, so it currently opens the
   visitor's mail client with the enquiry pre-filled. To have it posted instead,
   add an endpoint (Formspree, Netlify Forms, Web3Forms, or your own script) as
   the form's `action`:
   ```html
   <form class="form" id="enquiry-form" method="post" action="https://your-endpoint">
   ```
   `main.js` detects the `action` attribute and steps out of the way.
7. **Photography.** The only photograph is the city skyline used as the brand
   backdrop. It is an atmospheric scene, not a picture of the company's own
   office or people, and the copy never presents it as one. Real photography of
   your people, premises and work is still the biggest visual upgrade left.
8. **Claims to verify** — the site states a one-business-day response target,
   free initial consultations, and written quotations before work starts. These
   are commitments; confirm the business can meet them, or edit the wording.
   No client names, testimonials or performance statistics have been invented.
