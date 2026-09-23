# Verification tools

Two Playwright scripts that check the built site. Neither is needed to run or
deploy the site — they exist so the accessibility and quality claims in the main
README can be re-checked after any change, rather than taken on trust.

```bash
python3 -m http.server 8765 &     # serve the site from the repo root
npm i playwright                  # one-off
node tools/verify.js
node tools/contrast-audit.js
```

Set `BASE_URL` to point at another copy, or `CHROME_PATH` to use a browser you
already have installed.

## `verify.js`

Loads every page at two widths in both colour themes and fails on:

- horizontal overflow (anything wider than the viewport)
- console errors, page errors, failed requests
- any request that leaves the origin — the site must load nothing third-party
- webfonts not actually applying
- the theme toggle failing to switch, persist, or survive navigation
- a visitor whose OS is dark being served anything but the light site (light is
  the site default; dark is opt-in only)
- the enquiry form's division branches not showing/hiding correctly, hidden
  fields not being disabled, or validation not flagging the required fields
- the mobile drawer or desktop dropdown failing to open and close

## `contrast-audit.js`

Walks every text node on every page in both themes — dark is reached by seeding
the stored preference, the same way a visitor reaches it, since the site no
longer follows the OS setting — resolves each one's
*effective* background through translucent ancestors, and compares the computed
ratio against WCAG AA — 4.5:1 for body text, 3:1 for large text. Prints every
failing pair with its colours, size and sample text. Should report zero.

It opens all `<details>` and reveals all scroll-animated sections first, so
collapsed content is checked too.
