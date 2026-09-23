const { chromium } = require('playwright');
/* Run against a locally served copy of the site:
 *   python3 -m http.server 8765 &
 *   npm i playwright && node tools/contrast-audit.js
 * Override the URL with BASE_URL, or the browser with CHROME_PATH.
 */
const LAUNCH = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {};

const ROOT = process.env.BASE_URL || 'http://127.0.0.1:8765/';
const PAGES = ['index','about','divisions','accountancy','contact','privacy','404'];

const SCRIPT = () => {
  const parse = (c) => {
    const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
    return m ? { r:+m[1], g:+m[2], b:+m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1
  });
  const effBg = (el) => {
    let node = el, stack = [];
    while (node && node !== document.documentElement) {
      const c = parse(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0) { stack.push(c); if (c.a === 1) break; }
      node = node.parentElement;
    }
    let base = parse(getComputedStyle(document.documentElement).backgroundColor) || {r:255,g:255,b:255,a:1};
    if (base.a === 0) base = {r:255,g:255,b:255,a:1};
    let out = base;
    for (let i = stack.length - 1; i >= 0; i--) out = over(stack[i], out);
    return out;
  };
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
  const lum = (c) => 0.2126*lin(c.r) + 0.7152*lin(c.g) + 0.0722*lin(c.b);
  const ratio = (a, b) => { const L1 = lum(a), L2 = lum(b); const hi = Math.max(L1,L2), lo = Math.min(L1,L2); return (hi+0.05)/(lo+0.05); };

  const out = [];
  const seen = new Set();
  document.querySelectorAll('p, li, h1, h2, h3, h4, a, span, strong, label, dt, dd, summary, button, figcaption, small, em, td, th').forEach(el => {
    if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return;
    const txt = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('');
    if (txt.length < 2) return;
    const st = getComputedStyle(el);
    const fg0 = parse(st.color); if (!fg0) return;
    const bg = effBg(el);
    const fg = fg0.a < 1 ? over(fg0, bg) : fg0;
    const size = parseFloat(st.fontSize);
    const weight = parseInt(st.fontWeight, 10) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3.0 : 4.5;
    const r = ratio(fg, bg);
    const key = st.color + '|' + Math.round(bg.r) + ',' + Math.round(bg.g) + ',' + Math.round(bg.b) + '|' + need;
    if (seen.has(key)) return;
    seen.add(key);
    if (r < need) out.push({
      sample: txt.slice(0, 38), tag: el.tagName.toLowerCase(),
      cls: String(el.className).split(' ')[0],
      color: st.color, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`,
      size: Math.round(size), weight, ratio: +r.toFixed(2), need
    });
  });
  return out;
};

(async () => {
  const b = await chromium.launch(LAUNCH);
  let fails = 0, checked = 0;
  for (const scheme of ['light','dark']) {
    for (const name of PAGES) {
      const ctx = await b.newContext({ viewport:{width:1440,height:1000}, colorScheme: scheme });
      const p = await ctx.newPage();
      await p.goto(ROOT + name + '.html');
      await p.evaluate(async()=>{await document.fonts.ready;});
      await p.evaluate(() => document.querySelectorAll('.reveal').forEach(e=>e.classList.add('is-in')));
      await p.evaluate(() => document.querySelectorAll('details').forEach(d=>d.open = true));
      await p.waitForTimeout(250);
      const bad = await p.evaluate(SCRIPT);
      checked++;
      if (bad.length) {
        fails += bad.length;
        console.log(`\n${scheme.toUpperCase()} / ${name}.html`);
        bad.forEach(x => console.log(`  ${x.ratio}:1 (need ${x.need})  <${x.tag}.${x.cls}> ${x.size}px/${x.weight}  ${x.color} on ${x.bg}  "${x.sample}"`));
      }
      await ctx.close();
    }
  }
  await b.close();
  console.log(`\n${checked} page renders checked — ${fails} distinct colour pairs below WCAG AA.`);
})();
