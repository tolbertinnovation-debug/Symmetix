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
| `contact.html` | Contact methods, validated enquiry form, FAQs |
| `404.html` | Not-found page |

Supporting files: `assets/css/styles.css`, `assets/js/main.js`,
`assets/img/` (logo assets — see below), `robots.txt`, `sitemap.xml`,
`.nojekyll`, `.github/workflows/deploy-pages.yml`.

## Design system

Everything is driven by custom properties at the top of `assets/css/styles.css`,
so the whole site can be re-themed from one block.

| Token | Value | Use |
| --- | --- | --- |
| `--green-700` | `#0B5730` | Primary brand green (from the logo) |
| `--orange-500` | `#F07C1A` | Brand accent (from the logo) |
| `--green-900` | `#05301A` | Hero and footer grounds |
| `--cream` / `--sand` | `#FBF9F5` / `#F4F0E8` | Alternating section backgrounds |

- **Type:** Playfair Display (headings) + Inter (body), loaded from Google Fonts
  with system serif / sans fallbacks. Sizes use `clamp()` so they scale fluidly
  from 360 px to 1440 px+ with no breakpoint jumps.
- **Layout:** intrinsic CSS Grid (`auto-fit` + `minmax`), so sections reflow
  instead of relying on device-specific media queries.
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

- Sticky navigation that gains a shadow on scroll (the contact bar scrolls away).
- Divisions dropdown on desktop: hover, click and keyboard (Escape closes).
- Mobile drawer with focus trapping, Escape to close and scroll lock.
- Reveal-on-scroll and count-up figures via `IntersectionObserver`.
- Accordion FAQs using native `<details>`.
- Enquiry-form validation with inline, per-field messages and a honeypot field.
- `prefers-reduced-motion` is respected throughout — all animation is disabled.

## Accessibility

- Skip link, single `<h1>` per page, landmark elements and labelled breadcrumbs.
- All form fields have real `<label for>` pairs; errors are announced via
  `aria-live` and flagged with `aria-invalid`.
- Icons are `aria-hidden`; icon-only controls carry `aria-label`.
- Visible focus rings (`:focus-visible`) on every interactive element.
- Every colour pair in the design system was measured against WCAG 2.1 AA
  (4.5:1 for text, 3:1 for icons and UI affordances) and passes on light, cream,
  sand and dark grounds. The accent button is therefore deep green on brand
  orange rather than white on orange, which fails at 2.8:1. The one exception is
  the orange `x` in the wordmark, which falls under the logotype exemption.
- Sections are only hidden for the scroll-reveal animation when JavaScript is
  present (`.js .reveal`), so with scripting disabled the whole page renders.

## SEO

Per-page `<title>` and meta description, canonical URLs, Open Graph and Twitter
cards, `sitemap.xml`, `robots.txt`, and JSON-LD structured data
(`Organization` with both phone numbers and opening hours, `Service` per
division, `FAQPage` on the division and contact pages).

---

## Running it locally

No tooling required — open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying

### GitHub Pages (current setup)

`.github/workflows/deploy-pages.yml` publishes `main` to GitHub Pages on every
push. **Pages has to be switched on once by hand before the workflow can
succeed** — the Actions token is not allowed to create a Pages site that has
never existed (`Resource not accessible by integration`).

1. Settings → Pages → **Source: GitHub Actions**
2. Actions → *Deploy site to GitHub Pages* → **Re-run all jobs** (or just push)

The site then serves from:

    https://tolbertinnovation-debug.github.io/Symmetix/

All internal links are relative, so the sub-path works without changes.

### Other hosts

Plain static files, so these work as-is:

- **Netlify / Vercel / Cloudflare Pages** — no build command, publish directory `/`.
- **Any shared host / cPanel** — upload the folder contents to `public_html`.
  (`.nojekyll` only matters on GitHub Pages; it stops Jekyll touching `assets/`.)

### Moving to a custom domain

The canonical URLs, Open Graph tags, `sitemap.xml` and `robots.txt` currently
point at the GitHub Pages URL, because that is where the site is served. When a
real domain is ready:

1. Add a `CNAME` file at the repository root containing just the domain.
2. Point DNS at GitHub Pages (`A` records to GitHub's IPs, or a `CNAME` to
   `tolbertinnovation-debug.github.io`), then set the domain in Settings → Pages.
3. Rewrite the URLs in one pass:

   ```bash
   grep -rl "tolbertinnovation-debug.github.io/Symmetix" . \
     --include="*.html" --include="*.xml" --include="*.txt" \
     | xargs sed -i "s|https://tolbertinnovation-debug.github.io/Symmetix|https://www.yourdomain.com|g"
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
4. **Domain** — the site is canonicalised to the GitHub Pages URL. See
   "Moving to a custom domain" above when a real domain is ready.
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
7. **Claims to verify** — the site states a one-business-day response target,
   free initial consultations, and written quotations before work starts. These
   are commitments; confirm the business can meet them, or edit the wording.
   No client names, testimonials or performance statistics have been invented.
