// node lab/tests/colors.check.mjs -> the two dot colours of the help picture stay distinguishable for every garden hue and colour-vision type; prints "COLORS OK"
import { readFileSync } from 'node:fs';
const ui = readFileSync('lab/overlay.js', 'utf8'), html = readFileSync('lab/blumenweg.html', 'utf8');
const css = readFileSync('lab/zg.css', 'utf8');
const tok = name => css.match(new RegExp('--' + name + ': hsl\\(([^;]*)\\);'))[1].replace('var(--h)', '').replace(/%/g, '').trim().split(/\s+/).map(Number);
const A = tok('dot-a'), B = tok('dot-b');
const base = (html.match(/const CLIMATE_BASE = \[([\d., ]+)\]/) || [])[1]?.split(',').map(Number);
let fails = 0; const need = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } };
need(A && A.length === 2 && B && B.length === 3 && base && base.length === 8, 'tokens found');
// Compare colour schemes for the two dot groups across the 8 garden hues, incl. colour-vision deficiency simulation

const HUES = base.map(h => h * 360);

const hsl2rgb = (h, s, l) => { h = ((h % 360) + 360) % 360; s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return [f(0), f(8), f(4)]; };
const lin = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const toLin = rgb => rgb.map(lin);
const lab = rgbLin => { const [r, g, b] = rgbLin; let X = 0.4124 * r + 0.3576 * g + 0.1805 * b, Y = 0.2126 * r + 0.7152 * g + 0.0722 * b, Z = 0.0193 * r + 0.1192 * g + 0.9505 * b;
  X /= 0.95047; Z /= 1.08883; const f = t => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116); return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))]; };
const dE = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const lum = rgbLin => 0.2126 * rgbLin[0] + 0.7152 * rgbLin[1] + 0.0722 * rgbLin[2];
const wcag = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
// Machado et al. 2009 (severity 1.0), applied in linear RGB
const CVD = { normal: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]] };
const sim = (rgbLin, m) => m.map(row => Math.max(0, Math.min(1, row[0] * rgbLin[0] + row[1] * rgbLin[1] + row[2] * rgbLin[2])));


let minDE = 1e9, minW = 1e9, where = '';
const white = toLin([1, 1, 1]);
for (const h of HUES) {
  const c1 = toLin(hsl2rgb(h, A[0], A[1])), c2 = toLin(hsl2rgb(B[0], B[1], B[2]));
  minW = Math.min(minW, wcag(c1, c2));
  for (const [kind, m] of Object.entries(CVD)) { const d = dE(lab(sim(c1, m)), lab(sim(c2, m))); if (d < minDE) { minDE = d; where = Math.round(h) + 'deg/' + kind; } }
}
console.log(`min colour difference (dE76, all hues, normal+deutan+protan+tritan) = ${minDE.toFixed(1)} at ${where}; min luminance contrast = ${minW.toFixed(2)}:1`);
need(minDE >= 30, 'colour difference >= 30');
need(minW >= 3, 'luminance contrast >= 3:1 (readable even in greyscale)');
// control: the old scheme (hue vs hue+40) must FAIL this same measurement
let oldMin = 1e9; for (const h of HUES) { const c1 = toLin(hsl2rgb(h, 75, 55)), c2 = toLin(hsl2rgb(h + 40, 85, 58)); for (const m of Object.values(CVD)) oldMin = Math.min(oldMin, dE(lab(sim(c1, m)), lab(sim(c2, m)))); }
need(oldMin < 30, 'control: old scheme should be below the threshold (is ' + oldMin.toFixed(1) + ')');
if (fails) { console.log('COLORS FAIL', fails); process.exit(1); }
console.log('COLORS OK');
