/* Ink: finger-handwriting digit recognizer (plain JS, no dependencies).
 *
 * Method: order/direction independent point-cloud matching (symmetric RMS chamfer
 * distance) against procedurally generated template variants, plus soft topology
 * features (aspect ratio, number/position of enclosed holes). Numbers are segmented
 * by testing candidate cuts between x-sorted strokes and scoring them with the
 * recognizer itself.
 *
 * Browser: window.Ink    Node: module.exports
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Ink = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Tunable constants (exposed as Ink._params for the benchmark).
  const P = {
    WT: 0.12,         // weight of tangent orientation in the point distance
    TW: 5,            // tangent window (points each side)
    N: 40,            // points per resampled cloud
    A: 0.6,           // 0 = uniform scaling, 1 = fit each axis to the unit box
    KA: 0.04,         // aspect-ratio penalty weight (per ln-ratio)
    KS: 0.0,          // penalty per unit of template shear (prefers upright readings)
    KE: 0.05,         // template end points should have an input end point nearby
    KH: 0.03,         // hole-count mismatch penalty
    KY: 0.06,         // hole vertical position penalty
    SC: 0.13,         // cost -> score scale
    MIN_STROKE: 0.08, // strokes smaller than this fraction of the biggest stroke are noise
    CUT_GAP: 0.08,    // desired gap between digits (fraction of ink height)
    CUT_PEN: 0.2,     // penalty per unit of missing gap
    SLANTS: [0, -0.25, 0.25, -0.5, 0.5], // writing slants tried when segmenting
    CUT_BASE: 0.004,  // small constant cost per extra digit
    // matchExpected
    TINY: 0.006,      // cost lead a non-top expected text may trail by and still be accepted
    MC: 0.006,        // margin the expected text needs over a confusable runner-up
    MIN_SCORE: 0.25,  // absolute quality floor for acceptance
    AMB: 0.02         // margin below which a decision is flagged ambiguous
  };

  // ---------------------------------------------------------------- geometry
  const G = 24; // hole-detection grid size

  function pathLen(pts) {
    let l = 0;
    for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    return l;
  }

  function bboxOf(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) {
      if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x;
      if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y;
    }
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
  }

  /** k points equally spaced by arc length, endpoints included. */
  function sampleStroke(s, k) {
    const out = [];
    const len = pathLen(s);
    if (len <= 0) { for (let i = 0; i < k; i++) out.push({ x: s[0].x, y: s[0].y }); return out; }
    let seg = 1, acc = 0, segLen = Math.hypot(s[1].x - s[0].x, s[1].y - s[0].y);
    for (let j = 0; j < k; j++) {
      const target = (j / (k - 1)) * len;
      while (seg < s.length - 1 && acc + segLen < target) {
        acc += segLen; seg++;
        segLen = Math.hypot(s[seg].x - s[seg - 1].x, s[seg].y - s[seg - 1].y);
      }
      const t = segLen > 0 ? Math.min(1, Math.max(0, (target - acc) / segLen)) : 0;
      out.push({ x: s[seg - 1].x + (s[seg].x - s[seg - 1].x) * t, y: s[seg - 1].y + (s[seg].y - s[seg - 1].y) * t });
    }
    return out;
  }

  /** Points per stroke proportional to its length; returns array of strokes. */
  function resample(strokes, n) {
    const lens = strokes.map(pathLen);
    const total = lens.reduce((a, b) => a + b, 0) || 1;
    return strokes.map((s, i) => sampleStroke(s, Math.max(2, Math.round((n * lens[i]) / total))));
  }

  /** Normalise resampled strokes into a centred, roughly unit-sized frame. */
  function normalize(rs) {
    const all = [].concat.apply([], rs);
    const b = bboxOf(all);
    const m = Math.max(b.w, b.h, 1e-9);
    const ex = Math.pow(Math.max(b.w / m, 0.2), P.A) * m;
    const ey = Math.pow(Math.max(b.h / m, 0.2), P.A) * m;
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    const strokes = rs.map((s) => s.map((p) => ({ x: (p.x - cx) / ex, y: (p.y - cy) / ey })));
    // 4-D points: position + undirected tangent orientation (doubled angle), so stroke
    // direction is ignored but line orientation still separates look-alike shapes.
    const flat = new Float64Array(all.length * 4);
    let k = 0;
    for (const s of strokes) {
      for (let i = 0; i < s.length; i++) {
        const a = s[Math.max(0, i - P.TW)], c = s[Math.min(s.length - 1, i + P.TW)];
        const th = Math.atan2(c.y - a.y, c.x - a.x);
        flat[k++] = s[i].x; flat[k++] = s[i].y;
        flat[k++] = P.WT * Math.cos(2 * th); flat[k++] = P.WT * Math.sin(2 * th);
      }
    }
    const ar = Math.min(3, Math.max(0.08, b.w / Math.max(b.h, 1e-9)));
    return { strokes, flat, ar, holes: holeInfo(strokes),
      ends: [].concat.apply([], strokes.map((st) => [st[0], st[st.length - 1]])) };
  }

  /** Count enclosed background regions (loops) on a coarse raster; gap tolerant. */
  function holeInfo(strokes) {
    const all = [].concat.apply([], strokes);
    const b = bboxOf(all);
    const sx = (G - 5) / Math.max(b.w, 1e-6), sy = (G - 5) / Math.max(b.h, 1e-6);
    const grid = new Uint8Array(G * G);
    const mark = (x, y) => {
      const ci = Math.round(x), cj = Math.round(y);
      grid[cj * G + ci] = 1; grid[cj * G + ci - 1] = 1; grid[cj * G + ci + 1] = 1;
      grid[(cj - 1) * G + ci] = 1; grid[(cj + 1) * G + ci] = 1;
    };
    for (const s of strokes) {
      for (let i = 0; i < s.length; i++) {
        const ax = (s[i].x - b.x0) * sx + 2.5, ay = (s[i].y - b.y0) * sy + 2.5;
        if (i === 0) mark(ax, ay);
        else {
          const px = (s[i - 1].x - b.x0) * sx + 2.5, py = (s[i - 1].y - b.y0) * sy + 2.5;
          const steps = Math.max(1, Math.ceil(Math.hypot(ax - px, ay - py) / 0.4));
          for (let t = 1; t <= steps; t++) mark(px + ((ax - px) * t) / steps, py + ((ay - py) * t) / steps);
        }
      }
    }
    const seen = new Uint8Array(G * G);
    const fill = (start) => {
      const stack = [start]; seen[start] = 1;
      let area = 0, sxs = 0, sys = 0;
      while (stack.length) {
        const c = stack.pop(); area++;
        const x = c % G, y = (c / G) | 0; sxs += x; sys += y;
        const nb = [x > 0 ? c - 1 : -1, x < G - 1 ? c + 1 : -1, y > 0 ? c - G : -1, y < G - 1 ? c + G : -1];
        for (const q of nb) if (q >= 0 && !grid[q] && !seen[q]) { seen[q] = 1; stack.push(q); }
      }
      return { area, x: sxs / area, y: sys / area };
    };
    fill(0); // outside
    const holes = [];
    for (let c = 0; c < G * G; c++) if (!grid[c] && !seen[c]) { const h = fill(c); if (h.area >= 6) holes.push(h); }
    holes.sort((a, b2) => b2.area - a.area);
    return { n: Math.min(2, holes.length), cy: holes.length ? (holes[0].y - 2.5) / (G - 5) : 0.5 };
  }

  /** Symmetric RMS chamfer distance between two flat point arrays. */
  function chamfer(a, b) {
    const na = a.length >> 2, nb = b.length >> 2;
    const mb = new Float64Array(nb).fill(Infinity);
    let sa = 0;
    for (let i = 0; i < na; i++) {
      const ax = a[4 * i], ay = a[4 * i + 1], at = a[4 * i + 2], au = a[4 * i + 3];
      let m = Infinity;
      for (let j = 0; j < nb; j++) {
        const dx = ax - b[4 * j], dy = ay - b[4 * j + 1], dt = at - b[4 * j + 2], du = au - b[4 * j + 3];
        const d = dx * dx + dy * dy + dt * dt + du * du;
        if (d < m) m = d;
        if (d < mb[j]) mb[j] = d;
      }
      sa += m;
    }
    let sb = 0;
    for (let j = 0; j < nb; j++) sb += mb[j];
    return 0.5 * (Math.sqrt(sa / na) + Math.sqrt(sb / nb));
  }

  // --------------------------------------------------------------- templates
  // Shapes live in a 100x150 box, y down. Angles in degrees: 0=right, 90=down.
  function arc(cx, cy, rx, ry, a0, a1, n) {
    n = n || Math.max(6, Math.round(Math.abs(a1 - a0) / 10));
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
      out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    return out;
  }
  function bez(p0, p1, p2, p3, n) {
    n = n || 16;
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push([
        u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
      ]);
    }
    return out;
  }
  const cat = (...parts) => [].concat(...parts);
  function lissajous8(ampTop, ampBot) {
    const out = [];
    for (let i = 0; i <= 48; i++) {
      const t = (i / 48) * 2 * Math.PI;
      const amp = ampTop + (ampBot - ampTop) * (1 - Math.cos(t)) / 2;
      out.push([50 + amp * Math.sin(2 * t), 75 - 72 * Math.cos(t)]);
    }
    return out;
  }

  const SHEARS = [-0.4, -0.2, 0, 0.2, 0.4];
  const lowerBowl3 = arc(42, 112, 40, 37, 270, 520);
  const DEFS = {
    0: [
      [arc(50, 75, 38, 72, -90, 280)],
      [arc(50, 75, 29, 72, -90, 270)],
      [arc(50, 75, 40, 72, -70, 250)],
      [arc(50, 75, 44, 72, -90, 270)]
    ],
    1: [
      [[[50, 0], [50, 150]]],
      [[[56, 0], [44, 150]]],
      [[[18, 38], [52, 0], [52, 150]]],
      [[[5, 50], [55, 0], [55, 150]]],
      [[[18, 38], [52, 0], [52, 150]], [[15, 150], [85, 150]]],
      [[[50, 0], [50, 150]], [[20, 150], [80, 150]]]
    ],
    2: [
      [cat(arc(48, 42, 36, 40, 180, 400), [[10, 148], [92, 148]])],
      [[[10, 8], [85, 8], [10, 146], [90, 146]]],
      [cat(arc(48, 40, 34, 38, 180, 410), [[22, 118], [10, 138], [28, 148], [90, 146]])]
    ],
    3: [
      [cat(arc(42, 37, 34, 37, 200, 450), lowerBowl3)],
      [cat([[10, 5], [78, 5], [40, 60]], lowerBowl3)],
      [cat(arc(42, 37, 30, 36, 200, 450), arc(42, 112, 44, 37, 270, 520))]
    ],
    4: [
      [[[62, 0], [5, 105], [90, 105]], [[66, 30], [66, 150]]],
      [[[66, 0], [5, 105], [90, 105]], [[66, 0], [66, 150]]],
      [[[10, 0], [10, 100], [85, 100]], [[68, 0], [68, 150]]],
      [bez([8, 0], [5, 60], [20, 100], [85, 100]), [[68, 0], [68, 150]]]
    ],
    5: [
      [cat([[85, 3], [22, 3], [15, 70]], arc(42, 105, 42, 44, 235, 520))],
      [cat([[78, 3], [20, 3], [15, 68]], arc(40, 104, 45, 44, 240, 530))],
      [cat([[85, 3], [20, 3], [12, 62]], arc(44, 106, 44, 44, 225, 510))],
      [cat([[85, 3], [18, 3], [14, 40]], arc(42, 96, 44, 54, 235, 520))]
    ],
    6: [
      [bez([70, 0], [35, 10], [10, 40], [10, 106]), arc(48, 106, 38, 42, 180, 540)],
      [[[55, 0], [10, 110]], arc(48, 106, 38, 42, 180, 540)],
      [cat(bez([75, 0], [35, 20], [8, 60], [8, 112]), arc(46, 112, 38, 36, 180, 540))]
    ],
    7: [
      [[[5, 5], [90, 5], [35, 148]]],
      [[[5, 5], [90, 5], [35, 148]], [[28, 80], [70, 80]]],
      [cat([[5, 5], [88, 5]], bez([88, 5], [70, 50], [45, 100], [35, 148]))],
      [[[3, 20], [10, 4], [88, 5], [35, 148]]],
      [[[15, 5], [68, 5], [22, 148]]],
      [[[5, 8], [70, 3], [92, 4], [60, 80], [38, 148]]]
    ],
    8: [
      [arc(50, 38, 30, 36, 0, 360), arc(50, 112, 38, 38, 0, 360)],
      [lissajous8(34, 40)],
      [lissajous8(26, 42)]
    ],
    9: [
      [arc(48, 40, 36, 38, 0, 360), [[84, 40], [78, 100], [62, 148]]],
      [arc(48, 40, 36, 38, 0, 360), bez([84, 40], [86, 100], [80, 140], [30, 146])],
      [arc(48, 42, 34, 40, 0, 360), [[82, 42], [82, 148]]],
      [cat(arc(46, 40, 36, 38, -40, -340), bez([86, 45], [88, 110], [78, 140], [15, 148]))],
      [arc(46, 40, 36, 38, -170, 130), [[82, 40], [82, 148]]],
      [arc(46, 40, 36, 38, -170, 130), [[84, 38], [76, 148]]],
      [arc(46, 40, 36, 38, 120, 400), [[82, 40], [80, 148]]],
      [arc(50, 26, 28, 26, 0, 360), [[78, 26], [76, 90], [70, 148]]],
      [arc(46, 40, 36, 38, 0, 360), [[84, 40], [84, 110], [76, 138], [58, 148], [44, 142]]]
    ]
  };

  function shearStrokes(strokes, k) {
    return strokes.map((s) => s.map((p) => ({ x: p[0] + k * (75 - p[1]), y: p[1] })));
  }

  const TEMPLATES = []; // {digit, flat, ar, holes}
  function build() {
    TEMPLATES.length = 0;
    for (const d in DEFS) {
      for (const variant of DEFS[d]) {
        for (const k of SHEARS) {
          const cl = normalize(resample(shearStrokes(variant, k), P.N));
          // aspect from the sheared raw box so slanted templates keep their own ratio
          const raw = bboxOf([].concat.apply([], shearStrokes(variant, k)));
          cl.ar = Math.min(3, Math.max(0.08, raw.w / raw.h));
          TEMPLATES.push({ digit: d, flat: cl.flat, ar: cl.ar, holes: cl.holes, shear: k, ends: cl.ends });
        }
      }
    }
  }
  build();

  // ------------------------------------------------------------- recognition
  function cleanStrokes(strokes) {
    const out = [];
    for (const s of strokes || []) {
      const pts = (s || []).filter((p) => p && isFinite(p.x) && isFinite(p.y));
      if (pts.length >= 2) out.push(pts);
    }
    let maxDim = 0;
    const info = out.map((pts) => {
      const b = bboxOf(pts);
      const dim = Math.max(b.w, b.h);
      if (dim > maxDim) maxDim = dim;
      return { pts, b, dim };
    });
    return info
      .filter((s) => s.dim > 0 && s.dim >= P.MIN_STROKE * maxDim)
      .map((s) => ({ pts: s.pts, x0: s.b.x0, x1: s.b.x1, y0: s.b.y0, y1: s.b.y1, cx: (s.b.x0 + s.b.x1) / 2 }));
  }

  /** Cost of the ink (array of point arrays) against each digit. */
  function digitCosts(strokePts) {
    const cl = normalize(resample(strokePts, P.N));
    const all = [].concat.apply([], strokePts);
    const b = bboxOf(all);
    const ar = Math.min(3, Math.max(0.08, b.w / Math.max(b.h, 1e-9)));
    const costs = new Float64Array(10).fill(Infinity);
    for (const t of TEMPLATES) {
      let c = chamfer(cl.flat, t.flat);
      c += P.KA * Math.abs(Math.log(ar / t.ar)) + P.KS * Math.abs(t.shear);
      c += P.KH * Math.abs(cl.holes.n - t.holes.n);
      if (P.KE) {
        let se = 0;
        for (const te of t.ends) { let m = Infinity; for (const ie of cl.ends) { const d = Math.hypot(te.x - ie.x, te.y - ie.y); if (d < m) m = d; } se += m; }
        c += (P.KE * se) / t.ends.length;
      }
      if (cl.holes.n > 0 && t.holes.n > 0) c += P.KY * Math.abs(cl.holes.cy - t.holes.cy);
      if (c < costs[t.digit]) costs[t.digit] = c;
    }
    return { costs, bbox: { x: b.x0, y: b.y0, w: b.w, h: b.h } };
  }

  const toScore = (c) => Math.exp(-Math.pow(c / P.SC, 2));

  function rankFromCosts(costs) {
    const ranked = [];
    for (let d = 0; d < 10; d++) ranked.push({ digit: String(d), score: toScore(costs[d]), cost: costs[d] });
    ranked.sort((a, b) => b.score - a.score || a.cost - b.cost);
    return ranked;
  }

  function recognizeDigit(strokes) {
    const cl = cleanStrokes(strokes);
    if (!cl.length) return { digit: '', score: 0, ranked: [] };
    const { costs } = digitCosts(cl.map((s) => s.pts));
    const ranked = rankFromCosts(costs);
    return { digit: ranked[0].digit, score: ranked[0].score, ranked };
  }

  // ------------------------------------------------------------ segmentation
  // Pairs a child tends to mix up; used to refuse "close enough" matches.
  const CONFUSABLE = new Set(['1-7', '0-6', '4-9', '2-7', '3-8', '5-6', '3-5', '6-8', '8-9', '0-8', '6-9', '2-3', '1-4', '0-9']);
  function digitsConfusable(a, b) {
    return a === b || CONFUSABLE.has(a < b ? a + '-' + b : b + '-' + a);
  }
  function textsConfusable(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!digitsConfusable(a[i], b[i])) return false;
    return true;
  }

  /**
   * Enumerates contiguous partitions of the x-sorted strokes (for several assumed writing
   * slants, since slanted digits overlap in raw x) and evaluates them.
   * Returns Map text -> {cost, groups:[{costs,bbox}]} with the best partition per text,
   * including single-digit substitutions (runner-up readings).
   */
  function hypotheses(cl, maxDigits, forceText) {
    const n = cl.length;
    let yMin = Infinity, yMax = -Infinity;
    for (const s of cl) { if (s.y0 < yMin) yMin = s.y0; if (s.y1 > yMax) yMax = s.y1; }
    const H = Math.max(yMax - yMin, 1e-9), yMid = (yMin + yMax) / 2;
    const cache = new Map();
    const segment = (idxs) => {
      const key = idxs.slice().sort((a, b) => a - b).join(',');
      let v = cache.get(key);
      if (!v) { v = digitCosts(idxs.map((i) => cl[i].pts)); cache.set(key, v); }
      return v;
    };
    const best = new Map();
    const record = (text, cost, groups) => {
      const cur = best.get(text);
      if (!cur || cost < cur.cost) best.set(text, { cost, groups });
    };
    const lo = forceText ? forceText.length : 1, hi = forceText ? forceText.length : Math.min(maxDigits, n);
    const slants = n > 1 && hi > 1 ? P.SLANTS : [0];

    for (const slant of slants) {
      // x in the de-slanted frame
      const ext = cl.map((s, i) => {
        let x0 = Infinity, x1 = -Infinity;
        for (const p of s.pts) { const x = p.x + slant * (yMid - p.y); if (x < x0) x0 = x; if (x > x1) x1 = x; }
        return { i, x0, x1, cx: (x0 + x1) / 2 };
      }).sort((a, b) => a.cx - b.cx);
      let cuts = [];
      for (let i = 1; i < n; i++) {
        let lmax = -Infinity, rmin = Infinity;
        for (let q = 0; q < i; q++) if (ext[q].x1 > lmax) lmax = ext[q].x1;
        for (let q = i; q < n; q++) if (ext[q].x0 < rmin) rmin = ext[q].x0;
        cuts.push({ i, gap: (rmin - lmax) / H });
      }
      if (cuts.length > 8) cuts = cuts.sort((a, b) => b.gap - a.gap).slice(0, 8).sort((a, b) => a.i - b.i);

      const evalPartition = (bounds, gaps) => {
        const k = bounds.length - 1;
        const segs = [];
        for (let g = 0; g < k; g++) segs.push(segment(ext.slice(bounds[g], bounds[g + 1]).map((e) => e.i)));
        let pen = 0;
        for (const gp of gaps) pen += P.CUT_PEN * Math.max(0, P.CUT_GAP - gp) + P.CUT_BASE;
        const costsOf = segs.map((sg, g) => {
          if (g === 0 && k > 1) { const c = Float64Array.from(sg.costs); c[0] = Infinity; return c; } // no leading zero
          return sg.costs;
        });
        const groups = segs.map((sg) => ({ costs: sg.costs, bbox: sg.bbox }));
        if (forceText) {
          let sum = 0;
          for (let g = 0; g < k; g++) sum += costsOf[g][forceText[g]];
          if (isFinite(sum)) record(forceText, sum / k + pen / k, groups);
          return;
        }
        // best reading plus single substitutions by the 2nd/3rd best digit of a group
        const order = costsOf.map((c) => Array.from(c.keys()).sort((a, b) => c[a] - c[b]));
        const firsts = order.map((o) => o[0]);
        const baseSum = costsOf.reduce((acc, c, g) => acc + c[firsts[g]], 0);
        record(firsts.join(''), baseSum / k + pen / k, groups);
        for (let g = 0; g < k; g++) {
          for (let r = 1; r <= 2; r++) {
            const digs = firsts.slice(); digs[g] = order[g][r];
            if (!isFinite(costsOf[g][digs[g]])) continue;
            record(digs.join(''), (baseSum - costsOf[g][firsts[g]] + costsOf[g][digs[g]]) / k + pen / k, groups);
          }
        }
      };

      for (let k = lo; k <= hi; k++) {
        const pick = (start, left, chosen) => {
          if (left === 0) {
            evalPartition([0].concat(chosen.map((c) => c.i), [n]), chosen.map((c) => c.gap));
            return;
          }
          for (let q = start; q < cuts.length; q++) pick(q + 1, left - 1, chosen.concat(cuts[q]));
        };
        pick(0, k - 1, []);
      }
    }
    return best;
  }

  function sortedStrokes(strokes) {
    return cleanStrokes(strokes).sort((a, b) => a.cx - b.cx);
  }

  function groupResult(g, costs) {
    const ranked = rankFromCosts(costs);
    return { digit: ranked[0].digit, score: ranked[0].score, ranked, bbox: g.bbox };
  }

  function recognizeNumber(strokes, opts) {
    const maxDigits = (opts && opts.maxDigits) || 2;
    const cl = sortedStrokes(strokes);
    if (!cl.length) return { text: '', digits: [], confidence: 0, ambiguous: true };
    const hyp = hypotheses(cl, maxDigits, null);
    const list = Array.from(hyp.entries()).sort((a, b) => a[1].cost - b[1].cost);
    const [text, top] = list[0];
    const run = list.length > 1 ? list[1] : null;
    const digits = top.groups.map((g, i) => {
      const costs = Float64Array.from(g.costs);
      if (i === 0 && top.groups.length > 1) costs[0] = Infinity;
      const r = groupResult(g, costs);
      // keep the reported digit consistent with the winning text
      if (r.digit !== text[i]) {
        const k = r.ranked.findIndex((x) => x.digit === text[i]);
        const [e] = r.ranked.splice(k, 1); r.ranked.unshift(e);
        r.digit = e.digit; r.score = e.score;
      }
      return r;
    });
    const margin = run ? run[1].cost - top.cost : 0.1;
    const worst = Math.min(...digits.map((d) => d.score));
    const confidence = worst * (0.6 + 0.4 * Math.min(1, margin / 0.04));
    const ambiguous = confidence < 0.3 || (margin < P.AMB && !!run && textsConfusable(text, run[0]));
    return { text, digits, confidence, ambiguous };
  }

  /**
   * Expected-aware decision. Accepts only when the expected text is the best
   * reading (with a margin if the runner-up is a classic look-alike), or trails
   * by a tiny margin behind a non-confusable reading.
   */
  function matchExpected(strokes, expectedText) {
    const e = String(expectedText);
    const none = { accept: false, bestText: '', expectedScore: 0, margin: 0, ambiguous: true };
    const cl = sortedStrokes(strokes);
    if (!cl.length || !/^\d{1,3}$/.test(e)) return none;
    const free = hypotheses(cl, Math.max(2, e.length), null);
    const forced = e.length <= cl.length ? hypotheses(cl, e.length, e) : new Map();
    const all = new Map(free);
    for (const [t, v] of forced) { const c = all.get(t); if (!c || v.cost < c.cost) all.set(t, v); }
    const list = Array.from(all.entries()).sort((a, b) => a[1].cost - b[1].cost);
    const ex = all.get(e);
    const bestText = list[0][0];
    if (!ex) return Object.assign({}, none, { bestText });
    const expectedScore = toScore(ex.cost);
    let margin, other;
    if (bestText === e) {
      other = list.length > 1 ? list[1] : null;
      margin = other ? other[1].cost - ex.cost : 0.1;
    } else {
      other = list[0];
      margin = ex.cost - other[1].cost; // > 0 : expected trails
      margin = -margin;
    }
    const conf = other ? textsConfusable(e, other[0]) : false;
    let accept;
    if (bestText === e) accept = margin >= (conf ? P.MC : 0);
    else accept = !conf && margin >= -P.TINY;
    if (expectedScore < P.MIN_SCORE) accept = false;
    const ambiguous = !accept ? (bestText !== e || margin < P.AMB || expectedScore < P.MIN_SCORE) : margin < P.AMB;
    return { accept, bestText, expectedScore, margin, ambiguous };
  }

  return { recognizeDigit, recognizeNumber, matchExpected, _params: P, _rebuild: build,
    _debug: (strokes, max) => Array.from(hypotheses(sortedStrokes(strokes), max || 2, null).entries()).sort((a, b) => a[1].cost - b[1].cost).slice(0, 6).map((e) => e[0] + ':' + e[1].cost.toFixed(3) + '[' + e[1].groups.map((g, i) => g.costs[e[0][i]].toFixed(3)).join('/') + ']').join(' ') };
});
