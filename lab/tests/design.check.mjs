// node lab/tests/design.check.mjs -> audits the Zaubergarten UI against the design-system rules (docs/superpowers/specs/2026-10-08-zaubergarten-designsystem.md); prints "DESIGN OK"
import { readFileSync } from 'node:fs';
const css = readFileSync('lab/zg.css', 'utf8'), ui = readFileSync('lab/overlay.js', 'utf8'), icons = readFileSync('lab/icons.js', 'utf8'), tasks = readFileSync('lab/tasks.js', 'utf8'), html = readFileSync('lab/blumenweg.html', 'utf8');
let fails = 0; const bad = m => { fails++; if (fails <= 30) console.log('FAIL', m); };

/* ---- 1. token discipline in the stylesheet ---- */
const tokStart = css.indexOf('.zg, .zg-tip, .zg-fabs {'), tokEnd = css.indexOf('}', tokStart);
const tokens = css.slice(tokStart, tokEnd), body = css.slice(0, tokStart) + css.slice(tokEnd + 1);
const decls = [...body.matchAll(/([a-z-]+)\s*:\s*([^;{}]+);/g)].map(m => [m[1], m[2].trim()]);
const spacingProps = new Set(['padding', 'margin', 'gap', 'row-gap', 'column-gap', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 'margin-top', 'margin-bottom']);
let nDecl = 0;
for (const [prop, val] of decls) {
  nDecl++;
  if (spacingProps.has(prop) && /\b\d*\.?\d+px\b/.test(val)) bad(`raw px in ${prop}: ${val}`);
  if (prop === 'border-radius' && !/^(var\(--r-[a-z0-9]+\)|50%|0)$/.test(val)) bad(`radius not from tokens: ${val}`);
  if (prop === 'font-size' && !/^var\(--t-\d\)$/.test(val)) bad(`font-size not from tokens: ${val}`);
  if (prop === 'font-weight' && !/^var\(--w-[12]\)$/.test(val)) bad(`font-weight not from tokens: ${val}`);
  if (/(^|-)color$|^background$|^fill$|^stroke$|^border(-[a-z]+)?$/.test(prop) && /#[0-9a-f]{3,8}\b|hsl\(|rgb\(/i.test(val)) bad(`raw colour outside the token block: ${prop}: ${val}`);
  if (prop === 'transition' || prop === 'animation') { if (/\b\d+m?s\b/.test(val) && !/var\(--d-/.test(val)) bad(`raw duration: ${val}`); }
}
if (/!important/.test(body.replace('.zg[hidden] { display: none !important; }', ''))) bad('!important is only allowed on [hidden]');
if (!/\.zg-msg \{[^}]*min-height/.test(css)) bad('feedback line must reserve its height (no layout jump)');
if (!/\.zg-body > \* \{ width: min\(100%, var\(--col\)\)/.test(css)) bad('one column rule missing');
for (const tkn of ['--s-1', '--s-2', '--s-3', '--s-4', '--s-5', '--s-6', '--s-7', '--r-1', '--r-2', '--r-3', '--t-1', '--t-2', '--t-3', '--t-4', '--w-1', '--w-2']) if (!tokens.includes(tkn + ':')) bad('token missing ' + tkn);
for (const s of [...tokens.matchAll(/--s-\d: (\d+)px/g)]) if (Number(s[1]) % 4) bad('spacing token off the 4 px grid: ' + s[0]);

/* ---- 2. no inline styles, no emojis, icons exist ---- */
for (const [name, src] of [['overlay.js', ui]]) if (/style="/.test(src)) bad(name + ' contains inline style="..."');
const EMOJI = /[\u{1F000}-\u{1FAFF}←-⇿☀-➿⬀-⯿️]/u;
for (const [name, src] of [['overlay.js', ui], ['icons.js', icons], ['tasks.js', tasks], ['zg.css', css]]) { const m = src.match(EMOJI); if (m) bad(`${name} contains a symbol/emoji character ${m[0]} (U+${m[0].codePointAt(0).toString(16)})`); }
const paths = new Set([...icons.matchAll(/^\s{4}([a-z]+): '/gm)].map(m => m[1]));
const used = new Set([...ui.matchAll(/ico\('([a-z]+)'/g)].map(m => m[1]).concat([...ui.matchAll(/svg\('([a-z]+)'/g)].map(m => m[1]), [...tasks.matchAll(/icon: '([a-z]+)'/g)].map(m => m[1])));
for (const u of used) if (!paths.has(u)) bad('icon id used but not defined: ' + u);
if (paths.size < 15) bad('icon set too small: ' + paths.size);

/* ---- 3. one primary button per screen (static: per template string) ---- */
for (const m of ui.matchAll(/`[^`]*`/g)) { const n = (m[0].match(/zg-btn primary/g) || []).length; if (n > 1) bad('more than one primary button in one template: ' + m[0].slice(0, 60)); }

/* ---- 4. contrast of every text pair for all 8 garden hues ---- */
const HUES = (html.match(/const CLIMATE_BASE = \[([\d., ]+)\]/)[1]).split(',').map(Number).map(h => h * 360);
const hsl2rgb = (h, s, l) => { h = ((h % 360) + 360) % 360; s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return [f(0), f(8), f(4)]; };
const lin = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)), lum = rgb => { const [r, g, b] = rgb.map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const colour = (name, hue) => { const m = tokens.match(new RegExp('--' + name + ': ([^;]+);'))[1].trim();
  if (m.startsWith('#')) return [1, 3, 5].map(i => parseInt(m.slice(i, i + 2), 16) / 255);
  const n = m.replace(/^hsl\(/, '').replace(/\)$/, '').replace('var(--h)', String(hue)).replace(/%/g, '').trim().split(/\s+/).map(Number); return hsl2rgb(...n); };
const PAIRS = [['ink', 'white', 4.5], ['ink', 'tint-1', 4.5], ['ink', 'tint-2', 4.5], ['ink', 'fill', 4.5], ['ink', 'fill-down', 4.5], ['ink-2', 'white', 4.5], ['ink-2', 'tint-1', 4.5], ['ink-2', 'tint-2', 4.5],
  ['accent-ink', 'white', 4.5], ['accent-ink', 'tint-1', 4.5], ['accent-ink', 'tint-2', 4.5], ['star', 'white', 3]];
const worst = [];
for (const [fg, bg, min] of PAIRS) { let low = 1e9, at = 0; for (const h of HUES) { const r = ratio(colour(fg, h), colour(bg, h)); if (r < low) { low = r; at = h; } } worst.push(`${fg}/${bg} ${low.toFixed(1)}`); if (low < min) bad(`contrast ${fg} on ${bg} = ${low.toFixed(2)} < ${min} (hue ${Math.round(at)})`); }

console.log(`declarations checked=${nDecl} icons=${paths.size} used=${used.size}; worst contrast: ${worst.join(' | ')}`);
if (fails) { console.log('DESIGN FAIL', fails); process.exit(1); }
console.log('DESIGN OK');
