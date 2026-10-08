// Benchmark for lab/ink.js. Run: node lab/tests/ink.test.mjs [--scale 0.5] [--set KEY=VAL ...]
// Contains its OWN synthetic "child writer": hold-out styles defined independently of the
// recognizer templates (Catmull-Rom splines through key points, different proportions),
// then perturbed (rotation, shear, non-uniform scale, low-frequency wobble, irregular
// sampling, random stroke order/direction, stroke splitting, random digit spacing).
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Ink = require('../ink.js');

const args = process.argv.slice(2);
let scale = 1;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--scale') scale = parseFloat(args[++i]);
  if (args[i] === '--set') {
    const [k, v] = args[++i].split('=');
    Ink._params[k] = parseFloat(v);
  }
}
Ink._rebuild();
const verbose = args.includes('--verbose');
const fast = args.includes('--fast'); // single digits + 2-digit only (for tuning sweeps)

// ------------------------------------------------------------------ PRNG
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rnd = mulberry32(1);
let lastStyle = '';
let dbgN = 0;
const styleStat = new Map();
const U = (a, b) => a + (b - a) * rnd();
const N01 = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

// ---------------------------------------------------------- hold-out styles
// Strokes are lists of key points [x, y, corner?]; height is 1, x in units of height.
// corner=1 duplicates the point so the spline gets a sharp turn.
const STYLES = {
  0: [
    [[[.30, 0], [.08, .14], [0, .5], [.1, .86], [.32, 1], [.55, .86], [.62, .5], [.55, .14], [.34, .04]]],
    [[[.45, .95], [.12, .85], [0, .5], [.15, .12], [.42, 0], [.66, .15], [.75, .5], [.62, .88], [.38, .99], [.3, .9]]],
    [[[.35, 0], [.05, .3], [.02, .7], [.35, 1]], [[.35, 0], [.65, .3], [.68, .7], [.35, 1]]],
    [[[.3, .05], [.05, .3], [.05, .75], [.3, 1], [.55, .8], [.6, .3], [.4, 0], [.2, .08]]],
    [[[.2, 0], [0, .3], [0, .7], [.2, 1], [.4, .7], [.4, .3], [.2, 0]]]
  ],
  1: [
    [[[0, .22], [.22, 0, 1], [.22, 1]]],
    [[[.18, 0], [.1, .5], [.02, 1]]],
    [[[.2, 0], [.2, 1]], [[.2, 0], [.02, .25]]],
    [[[0, .2], [.2, 0, 1], [.2, 1, 1]], [[-.1, 1], [.5, 1]]],
    [[[.1, 0], [.1, 1]]],
    [[[-.15, .3], [.2, 0, 1], [.2, 1]]]
  ],
  2: [
    [[[.02, .25], [.12, .05], [.35, 0], [.55, .1], [.55, .3], [.35, .55], [0, 1, 1], [.6, 1]]],
    [[[.05, .08], [.5, 0], [.6, .05, 1], [.02, 1, 1], [.65, .98]]],
    [[[.05, .25], [.25, 0], [.55, .1], [.5, .35], [.1, .8], [0, .95], [.25, 1], [.6, .98]]],
    [[[0, .3], [.2, .02], [.5, .05], [.55, .3], [.3, .6], [0, 1], [.3, .9], [.6, 1]]]
  ],
  3: [
    [[[.02, .15], [.25, 0], [.5, .12], [.45, .32], [.2, .47], [.5, .6], [.58, .82], [.3, 1], [0, .88]]],
    [[[0, .02], [.5, 0, 1], [.4, .25], [.2, .45], [.45, .5], [.6, .72], [.45, .95], [.15, 1], [0, .85]]],
    [[[.05, .1], [.3, 0], [.5, .12], [.3, .45]], [[.3, .45], [.55, .6], [.55, .88], [.25, 1], [0, .9]]],
    [[[0, 0], [.5, 0, 1], [.3, .3], [.15, .45], [.4, .45], [.6, .7], [.45, .95], [.15, 1], [0, .9]]],
    [[[.05, .15], [.3, 0], [.5, .15], [.3, .45], [.5, .6], [.55, .85], [.3, 1], [0, .9]]],
    [[[.05, .1], [.3, 0], [.5, .12], [.4, .3], [.15, .5]], [[.15, .5], [.5, .62], [.55, .85], [.3, 1], [0, .88]]],
    [[[0, .1], [.4, 0], [.5, .2], [.25, .45], [.5, .55], [.55, .8], [.3, 1], [0, .95]]]
  ],
  4: [
    [[[.4, 0], [0, .65, 1], [.65, .65]], [[.45, .3], [.45, 1]]],
    [[[.4, 1], [.42, 0, 1], [0, .65, 1], [.65, .68]]],
    [[[0, 0], [.05, .4], [.2, .6], [.55, .6]], [[.55, 0], [.55, 1]]],
    [[[.45, 0], [0, .7, 1], [.7, .72]], [[.45, 0], [.47, 1]]]
  ],
  5: [
    [[[.55, 0], [.1, 0, 1], [.05, .42], [.35, .38], [.58, .55], [.55, .85], [.3, 1], [0, .88]]],
    [[[.1, 0], [.05, .42], [.4, .38], [.6, .58], [.5, .88], [.2, 1], [0, .85]], [[0, 0], [.6, 0]]],
    [[[.55, .02], [.15, 0], [.08, .4], [.45, .4], [.6, .65], [.4, .95], [0, .92]]],
    [[[.6, 0], [.1, .02], [.05, .45], [.5, .4], [.62, .7], [.35, .98], [0, .8]]],
    [[[.1, .05], [.06, .38], [.3, .3], [.5, .4], [.58, .65], [.45, .92], [.2, 1], [0, .9]], [[.1, 0], [.55, 0]]],
    [[[.55, 0], [.12, .02], [.08, .3], [.25, .3], [.5, .38], [.6, .62], [.48, .9], [.25, 1], [.05, .95]]],
    [[[.55, 0], [.1, 0], [.08, .45]], [[.08, .45], [.4, .38], [.58, .6], [.5, .9], [.15, 1]]]
  ],
  6: [
    [[[.5, 0], [.15, .3], [0, .65], [.1, .95], [.3, 1], [.55, .85], [.55, .6], [.3, .5], [.05, .62]]],
    [[[.4, 0], [.05, .5], [0, .8], [.25, 1], [.5, .9], [.5, .62], [.25, .52], [.02, .7]]],
    [[[.35, 0], [.05, .6]], [[.05, .65], [.1, .95], [.3, 1], [.55, .85], [.5, .6], [.25, .5], [.02, .68]]]
  ],
  7: [
    [[[0, .05], [.6, 0, 1], [.45, .5], [.2, 1]]],
    [[[0, .02], [.6, 0]], [[.6, 0], [.2, 1]], [[.15, .5], [.5, .5]]],
    [[[0, .12], [.1, 0], [.6, .02, 1], [.5, .4], [.3, .75], [.25, 1]]]
  ],
  8: [
    [[[.3, 0], [.05, .12], [.12, .35], [.35, .5], [.6, .68], [.6, .88], [.3, 1], [0, .88], [.05, .65], [.35, .5], [.58, .32], [.55, .1], [.3, 0]]],
    [[[.3, 0], [.05, .12], [.05, .35], [.3, .5], [.55, .35], [.55, .12], [.3, 0]], [[.3, .5], [0, .65], [0, .88], [.3, 1], [.6, .88], [.6, .65], [.3, .5]]],
    [[[.5, .5], [.1, .3], [.15, .05], [.4, 0], [.55, .2], [.1, .75], [.1, .95], [.35, 1], [.6, .92], [.55, .65], [.15, .3]]]
  ],
  9: [
    [[[.5, .3], [.45, .05], [.25, 0], [.05, .15], [.08, .42], [.3, .52], [.5, .4], [.5, .3]], [[.5, .3], [.48, .7], [.42, 1]]],
    [[[.5, .15], [.3, 0], [.08, .15], [.1, .45], [.35, .5], [.55, .35], [.55, .7], [.4, .95], [.1, 1]]],
    [[[.45, .25], [.3, 0], [.05, .12], [.05, .4], [.25, .52], [.5, .4], [.52, .2], [.5, .6], [.45, 1]]],
    [[[.5, .15], [.3, 0], [.05, .2], [.2, .5], [.5, .3], [.52, .6], [.4, .9], [.05, .95]]],
    [[[.5, .35], [.3, .5], [.05, .35], [.15, .05], [.45, .05], [.5, .35], [.45, 1]]],
    [[[.15, .2], [.3, 0], [.5, .15], [.45, .4], [.25, .5], [.08, .35], [.15, .2]], [[.5, .2], [.5, .6], [.48, 1]]],
    [[[.5, .25], [.3, .05], [.08, .2], [.12, .45], [.38, .5], [.52, .3], [.55, .65], [.48, .9], [.3, 1], [.1, .92]]],
    [[[.4, .5], [.55, .3], [.4, .05], [.15, .1], [.05, .3], [.1, .45]], [[.52, .3], [.5, .65], [.5, 1]]],
    [[[.1, .45], [.05, .2], [.25, 0], [.5, .12], [.52, .4], [.35, .5], [.5, .45], [.5, 1]]],
    [[[.45, .2], [.3, .02], [.12, .15], [.15, .35], [.35, .38], [.48, .2], [.48, .6], [.45, 1]]],
    [[[.2, 1], [.35, .6], [.5, .3], [.4, .05], [.2, 0], [.05, .2], [.15, .42], [.38, .4], [.5, .28]]],
    [[[.15, .2], [.3, 0], [.5, .15], [.45, .4], [.25, .5], [.08, .35], [.15, .2]], [[.5, .25], [.52, .7], [.45, .95], [.3, 1], [.2, .93]]],
    [[[.5, .15], [.3, 0], [.1, .12], [.08, .35], [.3, .48], [.5, .35], [.5, .15]], [[.5, .15], [.5, .6], [.46, 1]]]
  ]
};

function catmull(keys, per = 10) {
  const pts = [];
  for (const k of keys) { pts.push([k[0], k[1]]); if (k[2]) pts.push([k[0], k[1]]); }
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < per; s++) {
      const t = s / per, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1].slice());
  return out;
}

const LEVELS = [
  { name: 'mild', amp: 0.022, sample: [0.025, 0.06], jitter: 0.012 },
  { name: 'medium', amp: 0.055, sample: [0.03, 0.09], jitter: 0.022 },
  { name: 'strong', amp: 0.095, sample: [0.04, 0.13], jitter: 0.034 }
];

/** One written digit: array of strokes (arrays of [x,y] dense), height ~1, x starting at 0. */
function writeDigit(d, lv) {
  const style = pick(STYLES[d]);
  lastStyle = d + '/' + STYLES[d].indexOf(style);
  const wScale = U(0.8, 1.2);
  // key-point (proportion) jitter, then dense spline, then smooth warp
  let strokes = style.map((st) =>
    catmull(st.map((k) => [k[0] * wScale + N01() * lv.jitter, k[1] + N01() * lv.jitter, k[2]]))
  );
  const comps = [0, 1, 2].map(() => ({ fx: U(0.5, 2.2), fy: U(0.5, 2.2), ph: U(0, 6.28), ax: N01(), ay: N01() }));
  const warp = (p) => {
    let dx = 0, dy = 0;
    for (const c of comps) {
      const v = Math.sin(2 * Math.PI * (c.fx * p[0] * 1.6 + c.fy * p[1]) + c.ph);
      dx += c.ax * v; dy += c.ay * v;
    }
    return [p[0] + (lv.amp * dx) / 1.7, p[1] + (lv.amp * dy) / 1.7];
  };
  strokes = strokes.map((s) => {
    const off = [N01() * lv.amp * 0.4, N01() * lv.amp * 0.4];
    return s.map((p) => { const q = warp(p); return [q[0] + off[0], q[1] + off[1]]; });
  });
  // occasional small hook at a stroke start (finger lands, flicks)
  strokes = strokes.map((s) => {
    if (rnd() > 0.12) return s;
    const a = s[0], h = [a[0] + U(-0.12, 0.12), a[1] + U(-0.12, 0.12)];
    return [h, [(h[0] + a[0]) / 2, (h[1] + a[1]) / 2]].concat(s);
  });
  // occasional stroke splitting
  const out = [];
  for (const s of strokes) {
    if (s.length > 20 && rnd() < 0.08) {
      const c = 8 + Math.floor(rnd() * (s.length - 16));
      out.push(s.slice(0, c + 1), s.slice(c + 1));
    } else out.push(s);
  }
  // random order and direction
  if (rnd() < 0.5) out.sort(() => rnd() - 0.5);
  return out.map((s) => (rnd() < 0.3 ? s.slice().reverse() : s));
}

function bboxArr(strokes) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const s of strokes) for (const p of s) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  return { x0, x1, y0, y1 };
}

/** Irregular touch-event style sampling of a dense path. */
function sampleIrregular(s, lv) {
  const lens = [0];
  for (let i = 1; i < s.length; i++) lens.push(lens[i - 1] + Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]));
  const total = lens[lens.length - 1];
  const out = [];
  let d = 0, j = 1;
  const step0 = U(lv.sample[0], lv.sample[1]);
  const at = (dist) => {
    while (j < s.length - 1 && lens[j] < dist) j++;
    const a = s[j - 1], b = s[j], seg = lens[j] - lens[j - 1] || 1;
    const t = Math.min(1, Math.max(0, (dist - lens[j - 1]) / seg));
    return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t };
  };
  out.push(at(0));
  while (true) {
    d += step0 * U(0.5, 1.6);
    if (d >= total) break;
    const p = at(d);
    out.push({ x: p.x + N01() * 0.004, y: p.y + N01() * 0.004 });
  }
  out.push(at(total));
  return out;
}

/** Compose a number written left to right with random spacing; returns pixel strokes. */
function writeNumber(text, lv) {
  const digits = [...text].map((c) => writeDigit(+c, lv));
  const placed = [];
  let cursor = 0;
  for (let i = 0; i < digits.length; i++) {
    const hs = U(0.88, 1.1), base = U(-0.06, 0.06), ws = hs * U(0.9, 1.1);
    let st = digits[i].map((s) => s.map((p) => [p[0] * ws, p[1] * hs + base]));
    const b = bboxArr(st);
    const gap = i === 0 ? 0 : U(-0.07, 0.38);
    const dx = cursor + gap - b.x0;
    st = st.map((s) => s.map((p) => [p[0] + dx, p[1]]));
    cursor = b.x1 + dx;
    placed.push(...st);
  }
  // global transform: non-uniform scale, shear, rotation
  const sx = U(0.7, 1.4), sh = U(-0.25, 0.25), rot = (U(-12, 12) * Math.PI) / 180;
  const cr = Math.cos(rot), sr = Math.sin(rot);
  const tf = (p) => {
    let x = p[0] * sx, y = p[1];
    x += sh * (0.5 - y);
    return [x * cr - y * sr, x * sr + y * cr];
  };
  const px = U(150, 420), ox = U(20, 300), oy = U(20, 300);
  const strokes = placed.map((s) => sampleIrregular(s.map(tf), lv).map((p) => ({ x: p.x * px + ox, y: p.y * px + oy })));
  // occasional stray dot
  if (rnd() < 0.05) strokes.push([{ x: ox + U(0, px), y: oy + U(0, px) }]);
  return strokes;
}

// -------------------------------------------------------------------- stats
const pct = (a, b) => (b ? (100 * a) / b : 0);
const f1 = (x) => x.toFixed(1);
const SCALE = (n) => Math.max(2, Math.round(n * scale));

function runLevel(lv, seed) {
  rnd = mulberry32(seed);
  const res = { name: lv.name };
  // single digits
  const per = SCALE(150);
  const perDigit = Array(10).fill(0), correct = Array(10).fill(0);
  let top2 = 0, total = 0;
  const nineReads = {}, fiveReads = {}, threeReads = {};
  const conf = new Map();
  let tMs = 0, tN = 0;
  for (let d = 0; d < 10; d++) {
    for (let i = 0; i < per; i++) {
      const st = writeNumber(String(d), lv);
      const sty = lastStyle;
      const t0 = performance.now();
      const r = Ink.recognizeDigit(st);
      { const q = styleStat.get(lv.name + ' ' + sty) || [0, 0, {}]; q[0]++; if (r.digit !== String(d)) { q[1]++; q[2][r.digit] = (q[2][r.digit] || 0) + 1; } styleStat.set(lv.name + ' ' + sty, q); }
      tMs += performance.now() - t0; tN++;
      perDigit[d]++; total++;
      if (d === 9) nineReads[r.digit] = (nineReads[r.digit] || 0) + 1;
      if (args.includes('--dbg5') && d === 5 && r.digit === '9' && lv.name === 'medium' && dbgN++ < 8) console.log(sty, r.ranked.slice(0, 3).map((x) => x.digit + ':' + x.cost.toFixed(3)).join(' '), 'five cost', r.ranked.find((x) => x.digit === '5').cost.toFixed(3), JSON.stringify(st.map((q) => q.length)));
      if (d === 5) fiveReads[r.digit] = (fiveReads[r.digit] || 0) + 1;
      if (d === 3) threeReads[r.digit] = (threeReads[r.digit] || 0) + 1;
      if (r.digit === String(d)) correct[d]++;
      else { const k = d + '>' + r.digit; conf.set(k, (conf.get(k) || 0) + 1); }
      if (r.ranked[0].digit === String(d) || r.ranked[1].digit === String(d)) top2++;
    }
  }
  res.nineReads = nineReads; res.fiveReads = fiveReads; res.threeReads = threeReads; res.per = per;
  res.perDigit = correct.map((c, d) => pct(c, perDigit[d]));
  res.top1 = pct(correct.reduce((a, b) => a + b, 0), total);
  res.top2 = pct(top2, total);
  res.conf = [...conf.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k.replace('>', '->')}:${v}`);
  // two-digit numbers 10..20
  const per2 = SCALE(40);
  let ok2 = 0, n2 = 0;
  const bad2 = new Map();
  for (let v = 10; v <= 20; v++) {
    for (let i = 0; i < per2; i++) {
      const st = writeNumber(String(v), lv);
      const t0 = performance.now();
      const r = Ink.recognizeNumber(st);
      tMs += performance.now() - t0; tN++;
      n2++;
      if (r.text === String(v)) ok2++;
      else if (args.includes('--debug2') && dbgN++ < 12) console.log(lv.name, v, 'read', r.text, 'strokes', st.length, '|', Ink._debug(st), '| want:', Ink.matchExpected(st, String(v)).bestText);
      if (r.text !== String(v)) bad2.set(v + '>' + r.text, (bad2.get(v + '>' + r.text) || 0) + 1);
    }
  }
  res.num2 = pct(ok2, n2);
  res.bad2 = [...bad2.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k.replace('>', '->')}:${v}`);
  if (fast) return res;
  // matchExpected: true accept
  let ta = 0, tn = 0, tAmb = 0;
  const per3 = SCALE(15);
  for (let v = 0; v <= 20; v++) {
    for (let i = 0; i < per3; i++) {
      const m = Ink.matchExpected(writeNumber(String(v), lv), String(v));
      tn++; if (m.accept) ta++; else if (m.ambiguous) tAmb++;
    }
  }
  res.trueAccept = pct(ta, tn);
  // false accept over all ordered pairs of different numbers 0..20
  let fa = 0, fn = 0;
  const per4 = SCALE(2);
  const fas = new Map();
  for (let e = 0; e <= 20; e++) {
    for (let w = 0; w <= 20; w++) {
      if (e === w) continue;
      for (let i = 0; i < per4; i++) {
        const m = Ink.matchExpected(writeNumber(String(w), lv), String(e));
        fn++;
        if (m.accept) { fa++; const k = `${e}<-${w}`; fas.set(k, (fas.get(k) || 0) + 1); }
      }
    }
  }
  res.falseAccept = pct(fa, fn);
  res.fas = [...fas.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}:${v}`);
  res.ms = tMs / tN;
  return res;
}

const results0 = LEVELS.map((lv, i) => runLevel(lv, 1000 + i * 7919));
const results = results0;

if (fast) {
  console.log(results.map((r) => `${r.name[0]} top1=${r.top1.toFixed(1)} n2=${r.num2.toFixed(0)} 9>5=${f1(pct(r.nineReads['5']||0, r.per))} 9>3=${f1(pct(r.nineReads['3']||0, r.per))} 9>1=${f1(pct(r.nineReads['1']||0, r.per))} 5>9=${f1(pct(r.fiveReads['9']||0, r.per))} 7acc=${r.perDigit[7].toFixed(0)}`).join('  '));
  process.exit(0);
}
// ------------------------------------------------------------------- report
const pad = (s, n) => String(s).padEnd(n);
console.log('\nINK benchmark (synthetic hold-out writer, seeded)');
console.log(pad('metric', 26) + results.map((r) => pad(r.name, 10)).join(''));
const row = (label, fn) => console.log(pad(label, 26) + results.map((r) => pad(fn(r), 10)).join(''));
for (let d = 0; d < 10; d++) row(`top-1 digit ${d} %`, (r) => f1(r.perDigit[d]));
row('top-1 overall %', (r) => f1(r.top1));
row('top-2 overall %', (r) => f1(r.top2));
row('2-digit 10..20 %', (r) => f1(r.num2));
row('true-accept %', (r) => f1(r.trueAccept));
row('false-accept %', (r) => f1(r.falseAccept));
row('ms per recognition', (r) => r.ms.toFixed(2));
for (const r of results) {
  console.log(`\n[${r.name}] top confusions (truth->read:count): ${r.conf.join(' ')}`);
  console.log(`[${r.name}] 2-digit errors: ${r.bad2.join(' ')}`);
  if (verbose) console.log(`[${r.name}] false accepts (expected<-written): ${r.fas.join(' ')}`);
}

if (args.includes('--styles')) for (const [k, v] of styleStat) if (v[1] / v[0] > 0.12) console.log('style err', k, v[1] + '/' + v[0], JSON.stringify(v[2]));
// confusion report for truth = 9 (and the reverse directions 5->9, 3->9)
for (const [title, key] of [['truth 9', 'nineReads'], ['truth 5', 'fiveReads'], ['truth 3', 'threeReads']]) {
  console.log(`
${title}: read as (% of samples)`);
  const cols = ['9', '5', '3', '4', '8', '0', '7', '1', '6', '2'].filter((c) => c !== key.slice(0, 0) );
  console.log(pad('level', 9) + cols.map((c) => pad(c, 6)).join(''));
  for (const r of results) console.log(pad(r.name, 9) + cols.map((c) => pad(f1(pct(r[key][c] || 0, r.per)), 6)).join(''));
}
const [mild, med, strong] = results;
const checks = [
  ['top-1 mild >= 95', mild.top1 >= 95, mild.top1],
  ['top-1 medium >= 90', med.top1 >= 90, med.top1],
  ['top-1 strong >= 80', strong.top1 >= 80, strong.top1],
  ['2-digit mild >= 90', mild.num2 >= 90, mild.num2],
  ['false-accept medium <= 3', med.falseAccept <= 3, med.falseAccept],
  ['true-accept medium >= 85', med.trueAccept >= 85, med.trueAccept]
];
console.log('');
for (const [n, ok, v] of checks) console.log(`${ok ? 'pass' : 'FAIL'}  ${n}  (measured ${v.toFixed(1)})`);
if (checks.every((c) => c[1])) {
  console.log('INK OK');
} else {
  console.log('INK FAIL ' + checks.filter((c) => !c[1]).map((c) => `${c[0]} => ${c[2].toFixed(1)}`).join('; '));
  process.exitCode = 1;
}
