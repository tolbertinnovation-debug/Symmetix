const { chromium } = require('playwright');
/* Run against a locally served copy of the site:
 *   python3 -m http.server 8765 &
 *   npm i playwright && node tools/verify.js
 * Override the URL with BASE_URL, or the browser with CHROME_PATH.
 */
const LAUNCH = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {};

const path = require('path');
const ROOT = process.env.BASE_URL || 'http://127.0.0.1:8765/';
const OUT = __dirname + '/shots';
(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(LAUNCH);
  const problems = [];
  const pages = ['index','about','divisions','accountancy','travels','education','logistics','contact','privacy','404'];

  // ---- overflow + console errors on every page, both themes, two widths ----
  for (const scheme of ['light','dark']) {
    for (const [w,h] of [[1440,900],[390,844]]) {
      const ctx = await browser.newContext({ viewport:{width:w,height:h}, colorScheme: scheme, deviceScaleFactor:1 });
      for (const name of pages) {
        const p = await ctx.newPage();
        p.on('console', m => { if (m.type()==='error') problems.push(`${name}/${scheme}/${w}: console ${m.text()}`); });
        p.on('pageerror', e => problems.push(`${name}/${scheme}/${w}: pageerror ${e.message}`));
        p.on('requestfailed', r => problems.push(`${name}: request failed ${r.url()}`));
        p.on('request', r => { const u = r.url(); if (!u.startsWith('http://127.0.0.1:8765') && !u.startsWith('data:')) problems.push(`${name}: OFF-SITE request ${u}`); });
        await p.goto(ROOT + name + '.html', { waitUntil:'load' });
        await p.waitForTimeout(350);
        const o = await p.evaluate(() => {
          const de = document.documentElement, bad = [];
          document.querySelectorAll('body *').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && (r.right > de.clientWidth + 2 || r.left < -2)) {
              const st = getComputedStyle(el);
              if (st.position !== 'fixed' && st.overflowX !== 'auto' && !el.closest('[aria-hidden="true"]'))
                bad.push(el.tagName + '.' + String(el.className).split(' ')[0]);
            }
          });
          return { sw: de.scrollWidth, cw: de.clientWidth, bad: bad.slice(0,4) };
        });
        if (o.sw > o.cw + 2) problems.push(`${name}/${scheme}/${w}: h-overflow ${o.sw}>${o.cw} :: ${o.bad.join(' | ')}`);
        // any external URL in the DOM?
        const ext = await p.evaluate(() => {
          const urls = [];
          document.querySelectorAll('link[rel=stylesheet],link[rel=preload],link[rel=icon],link[rel=apple-touch-icon],script[src],img[src]').forEach(el => {
            const u = el.getAttribute('href') || el.getAttribute('src');
            if (u && /^https?:/i.test(u)) urls.push(u);
          });
          return urls;
        });
        if (ext.length) problems.push(`${name}: third-party asset ${ext.join(', ')}`);
        const fonts = await p.evaluate(async () => { await document.fonts.ready;
          return { inter: document.fonts.check('400 16px "Inter var"'), playfair: document.fonts.check('700 32px "Playfair var"') }; });
        if (!fonts.inter || !fonts.playfair) problems.push(`${name}/${scheme}/${w}: webfont not applied ${JSON.stringify(fonts)}`);
        await p.close();
      }
      await ctx.close();
    }
  }

  // ---- theme toggle round-trip + persistence ----
  {
    const ctx = await browser.newContext({ viewport:{width:1440,height:900}, colorScheme:'light' });
    const p = await ctx.newPage();
    await p.goto(ROOT + 'index.html');
    await p.waitForTimeout(300);
    const before = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await p.click('.nav-actions [data-theme-toggle]');
    await p.waitForTimeout(500);
    const after = await p.evaluate(() => ({
      bg: getComputedStyle(document.body).backgroundColor,
      attr: document.documentElement.getAttribute('data-theme'),
      pressed: document.querySelector('[data-theme-toggle]').getAttribute('aria-pressed'),
      stored: localStorage.getItem('sx-theme')
    }));
    if (before === after.bg) problems.push('theme toggle did not change background');
    if (after.attr !== 'dark') problems.push('theme toggle did not set data-theme=dark');
    if (after.pressed !== 'true') problems.push('theme toggle aria-pressed not updated');
    if (after.stored !== 'dark') problems.push('theme choice not persisted');
    // persists across navigation
    await p.goto(ROOT + 'about.html');
    await p.waitForTimeout(300);
    const kept = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
    if (kept !== 'dark') problems.push('theme not applied on next page (flash risk)');
    await ctx.close();
  }

  // ---- adaptive contact form ----
  {
    const ctx = await browser.newContext({ viewport:{width:1440,height:1000} });
    const p = await ctx.newPage();
    await p.goto(ROOT + 'contact.html');
    await p.waitForTimeout(400);
    const hiddenAtStart = await p.evaluate(() =>
      Array.from(document.querySelectorAll('[data-branch]'))
        .every(b => b.hidden && getComputedStyle(b).display === 'none'));
    if (!hiddenAtStart) problems.push('form branches visible before a division is chosen');
    await p.selectOption('#f-division', 'Logistics Management');
    await p.waitForTimeout(300);
    const shown = await p.evaluate(() => {
      const vis = Array.from(document.querySelectorAll('[data-branch]'))
        .filter(b => getComputedStyle(b).display !== 'none');
      return { count: vis.length, which: vis.map(v => v.getAttribute('data-branch')),
               disabled: Array.from(document.querySelectorAll('[data-branch][hidden] input, [data-branch][hidden] select')).every(f => f.disabled) };
    });
    if (shown.count !== 1 || shown.which[0] !== 'Logistics Management') problems.push('wrong branch shown: ' + JSON.stringify(shown));
    if (!shown.disabled) problems.push('hidden branch fields are not disabled (would block submit)');
    // switching divisions swaps the branch
    await p.selectOption('#f-division', 'Travels');
    await p.waitForTimeout(250);
    const swapped = await p.evaluate(() => Array.from(document.querySelectorAll('[data-branch]')).filter(b=>!b.hidden).map(b=>b.getAttribute('data-branch')));
    if (swapped.join() !== 'Travels') problems.push('branch did not swap: ' + swapped.join());
    // validation still flags exactly the 5 required fields
    await p.evaluate(() => document.getElementById('f-division').value = '');
    await p.click('#enquiry-form button[type=submit]');
    await p.waitForTimeout(350);
    const errs = await p.evaluate(() => document.querySelectorAll('.field.has-error').length);
    if (errs !== 5) problems.push(`form validation flagged ${errs} fields, expected 5`);
    await ctx.close();
  }

  // ---- drawer + dropdown ----
  {
    const ctx = await browser.newContext({ viewport:{width:390,height:844} });
    const p = await ctx.newPage();
    await p.goto(ROOT + 'index.html');
    await p.click('.nav-toggle'); await p.waitForTimeout(500);
    if (!await p.evaluate(() => document.getElementById('drawer').classList.contains('is-open'))) problems.push('drawer did not open');
    await p.click('.drawer-close'); await p.waitForTimeout(400);
    if (await p.evaluate(() => document.getElementById('drawer').classList.contains('is-open'))) problems.push('drawer did not close');
    await ctx.close();
    const ctx2 = await browser.newContext({ viewport:{width:1440,height:900} });
    const p2 = await ctx2.newPage();
    await p2.goto(ROOT + 'index.html');
    await p2.hover('.has-dropdown .nav-link'); await p2.waitForTimeout(450);
    if (await p2.evaluate(() => getComputedStyle(document.querySelector('.dropdown')).visibility) !== 'visible') problems.push('dropdown did not open');
    await ctx2.close();
  }

  // ---- no-JS ----
  {
    const ctx = await browser.newContext({ viewport:{width:1440,height:900}, javaScriptEnabled:false });
    const p = await ctx.newPage();
    await p.goto(ROOT + 'index.html');
    await p.waitForTimeout(400);
    const vis = await p.evaluate(() => {
      const els = document.querySelectorAll('.reveal');
      let hidden = 0;
      els.forEach(e => { if (parseFloat(getComputedStyle(e).opacity) < 0.5) hidden++; });
      return { total: els.length, hidden };
    }).catch(() => null);
    await ctx.close();
  }
  await browser.close();
  console.log(problems.length ? 'PROBLEMS (' + problems.length + '):\n' + problems.join('\n') : 'No problems detected across 10 pages x 2 themes x 2 widths.');
})();
