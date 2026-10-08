/* Zaubergarten tasks: pure logic, no DOM. UMD: window.ZGTasks / module.exports.
 * 32 waypoints = 4 gardens x 8. Every waypoint is one "Uebung" of 5 questions.
 * Topics are MIXED inside every garden; difficulty (level 1..4) rises with the garden. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ZGTasks = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- seeded RNG ---------- */
  function makeRng(seed) {
    let a = seed >>> 0;
    const next = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
    const pick = arr => arr[int(0, arr.length - 1)];
    const chance = p => next() < p;
    const shuffle = arr => { const r = arr.slice(); for (let i = r.length - 1; i > 0; i--) { const j = int(0, i); [r[i], r[j]] = [r[j], r[i]]; } return r; };
    return { next, int, pick, chance, shuffle };
  }

  /* ---------- text helpers ---------- */
  const unk = '□';

  /* ---------- step / task constructors ---------- */
  // eq = [lhs, rhs] with '?' for the unknown; used for the independent self-check in tests
  const num = (prompt, answer, o) => Object.assign({ prompt, answer, input: 'num' }, o);
  const task = (type, ctx, steps, extra) => {
    const t = Object.assign({ type, ctx: ctx || '', steps }, extra);
    return t;
  };
  const dots = (a, b) => ({ kind: 'tenframe', a, b: b || 0 });

  /* ---------- generators: (level 1..4, rng) -> task ---------- */
  const GEN = {};

  GEN.pairs10 = (L, r) => {
    if (L === 1) { const n = r.int(1, 9), s = 10; return task('pairs10', 'Verliebte Zahlen ergeben zusammen 10.', [num(`${n} + ${unk} = ${s}`, s - n, { eq: [`${n}+?`, '10'], visual: dots(n), explain: `${n} und ${s - n} sind verliebt: ${n} + ${s - n} = 10.` })], { max: 10 }); }
    if (L === 2) { const big = r.chance(0.5), n = big ? r.int(11, 19) : r.int(1, 9), s = big ? 20 : 10;
      return task('pairs10', `Verliebte Zahlen ergeben zusammen ${s}.`, [num(`${n} + ${unk} = ${s}`, s - n, { eq: [`${n}+?`, String(s)], visual: dots(n), explain: `${n} + ${s - n} = ${s}.` })], { max: s }); }
    if (L === 3) { const n = r.int(1, 9);
      return task('pairs10', 'Zehner ändern das Paar nicht!', [
        num(`${n} + ${unk} = 10`, 10 - n, { eq: [`${n}+?`, '10'], visual: dots(n), explain: `${n} + ${10 - n} = 10.` }),
        num(`${10 + n} + ${unk} = 20`, 10 - n, { eq: [`${10 + n}+?`, '20'], visual: dots(10 + n), explain: `Gleiches Paar: ${10 + n} + ${10 - n} = 20.` })], { max: 20 }); }
    const n = r.int(1, 19), s = n <= 10 && r.chance(0.5) ? 10 : 20, nn = n === s ? n - 1 : n, front = r.chance(0.5);
    return task('pairs10', 'Finde die verliebte Zahl.', [num(front ? `${unk} + ${nn} = ${s}` : `${nn} + ${unk} = ${s}`, s - nn, { eq: [front ? `?+${nn}` : `${nn}+?`, String(s)], explain: `${nn} + ${s - nn} = ${s}.` })], { max: s });
  };

  GEN.plus = (L, r) => {
    if (L === 1) { // no bridge, sum 11..19
      const a = r.int(11, 16), room = 9 - (a % 10), b = r.int(2, Math.max(2, Math.min(room, 20 - a)));
      return task('plus', '', [num(`${a} + ${b} = ?`, a + b, { eq: [`${a}+${b}`, '?'], visual: dots(a, b), explain: `${a} + ${b} = ${a + b}.` })], { max: a + b }); }
    if (L === 2) { // guided bridge over ten, three steps
      const a = r.int(7, 9), b = r.int(11 - a, 9), to = 10 - a, rest = b - to;
      return task('plus', `${a} + ${b}: über die 10!`, [
        num(`${a} + ${unk} = 10`, to, { eq: [`${a}+?`, '10'], visual: dots(a), explain: `${a} + ${to} = 10.` }),
        num(`${b} sind ${to} und ${unk}`, rest, { eq: [`${to}+?`, String(b)], explain: `${b} = ${to} + ${rest}.` }),
        num(`10 + ${rest} = ?`, a + b, { eq: [`10+${rest}`, '?'], visual: dots(10, rest), explain: `10 + ${rest} = ${a + b}.` })], { max: a + b }); }
    if (L === 3) { let a, b;
      if (r.chance(0.7)) { a = r.int(2, 9); b = r.int(Math.max(2, 11 - a), 9); } else { b = r.int(2, 8); a = 20 - b - r.int(0, 3); a = Math.max(12, a); }
      return task('plus', '', [num(`${a} + ${b} = ?`, a + b, { eq: [`${a}+${b}`, '?'], visual: dots(a, b), explain: `Erst zur 10, dann den Rest: ${a} + ${b} = ${a + b}.` })], { max: a + b }); }
    if (r.chance(0.5)) { // three terms with a ten-friend pair
      const a = r.int(3, 9), c = 10 - a, b = r.int(2, 20 - 10 - 1); const order = r.chance(0.5);
      const t1 = order ? [a, b, c] : [a, c, b];
      const s = a + b + c;
      return task('plus', 'Suche das verliebte Paar!', [num(`${t1.join(' + ')} = ?`, s, { eq: [t1.join('+'), '?'], explain: `${a} + ${c} = 10, dann + ${b} = ${s}.` })], { max: s }); }
    const a = r.int(6, 9), b = r.int(Math.max(6, 11 - a), 9);
    return task('plus', '', [num(`${a} + ${b} = ?`, a + b, { eq: [`${a}+${b}`, '?'], explain: `${a} + ${b} = ${a + b}.` })], { max: a + b });
  };

  GEN.minus = (L, r) => {
    if (L === 1) { const a = r.int(12, 19), b = r.int(2, Math.max(2, a % 10 || 2)); const bb = Math.min(b, a % 10 || 1) || 1;
      return task('minus', '', [num(`${a} − ${bb} = ?`, a - bb, { eq: [`${a}-${bb}`, '?'], explain: `${a} − ${bb} = ${a - bb}.` })], { max: a }); }
    if (L === 2) { const a = r.int(12, 16), b = r.int((a % 10) + 1, 9), to = a - 10, rest = b - to;
      return task('minus', `${a} − ${b}: über die 10 zurück!`, [
        num(`${a} − ${unk} = 10`, to, { eq: [`${a}-?`, '10'], explain: `${a} − ${to} = 10.` }),
        num(`${b} sind ${to} und ${unk}`, rest, { eq: [`${to}+?`, String(b)], explain: `${b} = ${to} + ${rest}.` }),
        num(`10 − ${rest} = ?`, a - b, { eq: [`10-${rest}`, '?'], explain: `10 − ${rest} = ${a - b}.` })], { max: a }); }
    if (L === 3) { const a = r.int(11, 18), b = r.int((a % 10) + 1, 9);
      return task('minus', '', [num(`${a} − ${b} = ?`, a - b, { eq: [`${a}-${b}`, '?'], explain: `Erst bis 10, dann den Rest: ${a} − ${b} = ${a - b}.` })], { max: a }); }
    const kind = r.int(0, 2);
    if (kind === 0) { const a = r.int(14, 20), b = r.int(2, 6), c = r.int(2, 6); if (a - b - c < 2) return GEN.minus(4, r);
      return task('minus', '', [num(`${a} − ${b} − ${c} = ?`, a - b - c, { eq: [`${a}-${b}-${c}`, '?'], explain: `${a} − ${b} = ${a - b}, dann − ${c} = ${a - b - c}.` })], { max: a }); }
    if (kind === 1) { const b = r.int(3, 9), a = 20; return task('minus', '', [num(`20 − ${b} = ?`, a - b, { eq: [`20-${b}`, '?'], explain: `20 − ${b} = ${a - b}.` })], { max: 20 }); }
    const a = r.int(12, 19), b = r.int((a % 10) + 1, 9);
    return task('minus', '', [num(`${a} − ${b} = ?`, a - b, { eq: [`${a}-${b}`, '?'], explain: `${a} − ${b} = ${a - b}.` })], { max: a });
  };

  GEN.gap = (L, r) => {
    const mk = (txt, ans, lhs, rhs, mx, ex) => task('gap', 'Welche Zahl fehlt?', [num(txt, ans, { eq: [lhs, rhs], explain: ex })], { max: mx });
    if (L === 1) { const c = r.int(11, 15), a = r.int(3, c - 3); return mk(`${a} + ${unk} = ${c}`, c - a, `${a}+?`, String(c), c, `${a} + ${c - a} = ${c}.`); }
    if (L === 2) { const c = r.int(12, 20), a = r.int(3, c - 3);
      return r.chance(0.5) ? mk(`${a} + ${unk} = ${c}`, c - a, `${a}+?`, String(c), c, `${a} + ${c - a} = ${c}.`) : mk(`${unk} + ${a} = ${c}`, c - a, `?+${a}`, String(c), c, `${c - a} + ${a} = ${c}.`); }
    if (L === 3) { const c = r.int(6, 12), b = r.int(Math.max(3, 10 - c), 8);
      return r.chance(0.5) ? mk(`${unk} − ${b} = ${c}`, c + b, `?-${b}`, String(c), c + b, `${c + b} − ${b} = ${c}.`)
        : (() => { const a = r.int(12, 19), d = r.int(3, 9); return mk(`${a} − ${unk} = ${a - d}`, d, `${a}-?`, String(a - d), a, `${a} − ${d} = ${a - d}.`); })(); }
    const x = r.int(5, 9), y = r.int(6, 9), z = r.int(3, 8);
    if (r.chance(0.5)) { const ans = x + y - z; if (ans < 2) return GEN.gap(4, r); return mk(`${z} + ${unk} = ${x} + ${y}`, ans, `${z}+?`, `${x}+${y}`, x + y, `${x} + ${y} = ${x + y}, und ${z} + ${ans} = ${x + y}.`); }
    const c = r.int(14, 20), a = r.int(5, 11); return mk(`${unk} + ${a} = ${c}`, c - a, `?+${a}`, String(c), c, `${c - a} + ${a} = ${c}.`);
  };

  GEN.line = (L, r) => {
    if (L === 1) { const n = r.int(11, 19); return task('line', 'Ziehe die Kugel auf die richtige Linie.', [{ prompt: `Wo liegt die ${n}?`, answer: n, input: 'line', visual: { kind: 'line', from: 10, to: 20, labels: [10, 20] }, explain: `Hier liegt die ${n}.` }], { max: n }); }
    if (L === 2) { const a = r.int(6, 12), b = r.int(Math.max(3, 10 - a), Math.min(8, 20 - a));
      return task('line', 'Hüpfe auf dem Zahlenstrahl.', [{ prompt: `Start ${a}. Hüpfe ${b} vor. Wo landest du?`, answer: a + b, input: 'line', visual: { kind: 'line', from: 0, to: 20, start: a, jump: b, labels: [0, a] }, explain: `${a} + ${b} = ${a + b}.`, eq: [`${a}+${b}`, '?'] }], { max: a + b }); }
    if (L === 3) { const n = r.int(11, 19), before = r.chance(0.5);
      return task('line', '', [num(before ? `Welche Zahl kommt direkt vor ${n}?` : `Welche Zahl kommt direkt nach ${n}?`, before ? n - 1 : n + 1, { explain: before ? `Vor ${n} kommt ${n - 1}.` : `Nach ${n} kommt ${n + 1}.`, visual: { kind: 'line', from: n - 3, to: n + 3, labels: [n] } })], { max: n + 1 }); }
    const half = r.int(2, 4), a = r.int(6, 12), b = a + 2 * half; // b >= 10
    return task('line', 'Finde die Mitte.', [num(`Welche Zahl liegt genau in der Mitte von ${a} und ${b}?`, a + half, { explain: `Von ${a} bis ${b} sind es ${2 * half} Schritte, die Hälfte ist ${half}: ${a + half}.`, visual: { kind: 'line', from: a - 1, to: b + 1, labels: [a, b] } })], { max: b });
  };

  GEN.wall = (L, r) => {
    const step = (p, a, eq, ex, vis) => num(p, a, { eq, explain: ex, visual: vis });
    if (L === 1) { const a = r.int(4, 10), b = r.int(Math.max(4, 10 - a), 10);
      return task('wall', 'Zahlenmauer: Zwei Steine tragen den Stein darüber.', [step('Welche Zahl gehört nach oben?', a + b, [`${a}+${b}`, '?'], `${a} + ${b} = ${a + b}.`, { kind: 'wall', rows: [[a, b], [null]], cur: [1, 0] })], { max: a + b }); }
    if (L === 2) { let a, b, c; do { a = r.int(2, 5); b = r.int(2, 5); c = r.int(2, 5); } while (a + 2 * b + c < 10); const m1 = a + b, m2 = b + c;
      return task('wall', 'Immer zwei Steine tragen einen.', [
        step('Mitte links?', m1, [`${a}+${b}`, '?'], `${a} + ${b} = ${m1}.`, { kind: 'wall', rows: [[a, b, c], [null, null], [null]], cur: [1, 0] }),
        step('Mitte rechts?', m2, [`${b}+${c}`, '?'], `${b} + ${c} = ${m2}.`, { kind: 'wall', rows: [[a, b, c], [m1, null], [null]], cur: [1, 1] }),
        step('Ganz oben?', m1 + m2, [`${m1}+${m2}`, '?'], `${m1} + ${m2} = ${m1 + m2}.`, { kind: 'wall', rows: [[a, b, c], [m1, m2], [null]], cur: [2, 0] })], { max: m1 + m2 }); }
    if (L === 3) { const a = r.int(2, 6), x = r.int(3, 7), c = r.int(2, 6), t = a + 2 * x + c;
      return task('wall', 'Ein Stein unten fehlt.', [step('Welche Zahl fehlt unten in der Mitte?', x, [`${a}+2*?+${c}`, String(t)], `Oben ${t}: ${a} + ${x} + ${x} + ${c} = ${t}.`, { kind: 'wall', rows: [[a, null, c], [null, null], [t]], cur: [0, 1] })], { max: t }); }
    const b = r.int(3, 7), a = r.int(2, 7), c = r.int(2, 7), m1 = a + b, m2 = b + c;
    return task('wall', 'Zwei Steine unten fehlen.', [
      step('Welche Zahl fehlt unten links?', a, [`?+${b}`, String(m1)], `${m1} − ${b} = ${a}.`, { kind: 'wall', rows: [[null, b, null], [m1, m2], [m1 + m2]], cur: [0, 0] }),
      step('Welche Zahl fehlt unten rechts?', c, [`${b}+?`, String(m2)], `${m2} − ${b} = ${c}.`, { kind: 'wall', rows: [[a, b, null], [m1, m2], [m1 + m2]], cur: [0, 2] })], { max: m1 + m2 });
  };

  GEN.double = (L, r) => {
    if (L === 1) { const n = r.int(6, 10); return task('double', 'Verdoppeln heißt: zweimal dieselbe Zahl.', [num(`${n} + ${n} = ?`, 2 * n, { eq: [`${n}+${n}`, '?'], explain: `${n} + ${n} = ${2 * n}.` })], { max: 2 * n }); }
    if (L === 2) { const h = r.int(6, 10); return task('double', 'Halbieren: in zwei gleiche Teile teilen.', [num(`Die Hälfte von ${2 * h} ist ${unk}`, h, { eq: [`2*?`, String(2 * h)], explain: `${h} + ${h} = ${2 * h}.`, visual: dots(h, h) })], { max: 2 * h }); }
    if (L === 3) { const a = r.int(6, 9), up = r.chance(0.5), b = up ? a + 1 : a - 1;
      return task('double', `${a} + ${b}: Fast ein Doppeltes!`, [
        num(`${a} + ${a} = ?`, 2 * a, { eq: [`${a}+${a}`, '?'], explain: `${a} + ${a} = ${2 * a}.` }),
        num(`${up ? '+' : '−'} 1 ergibt ${unk}`, a + b, { eq: [up ? `${2 * a}+1` : `${2 * a}-1`, '?'], explain: `${up ? 'Plus' : 'Minus'} 1: ${a + b}.` })], { max: a + b }); }
    const a = r.int(7, 10), c = r.int(1, 5);
    return task('double', 'Doppelte Zahl, dann ein Stück weg.', [num(`${a} + ${a} − ${c} = ?`, 2 * a - c, { eq: [`${a}+${a}-${c}`, '?'], explain: `${a} + ${a} = ${2 * a}, dann − ${c} = ${2 * a - c}.` })], { max: 2 * a });
  };

  GEN.compare = (L, r) => {
    const cmp = (x, y) => (x < y ? 0 : x === y ? 1 : 2);
    const mk = (txt, x, y, ex, mx) => task('compare', 'Kleiner, gleich oder größer?', [{ prompt: txt, answer: cmp(x, y), input: 'cmp', choices: ['<', '=', '>'], explain: `${x} ${['<', '=', '>'][cmp(x, y)]} ${y}. ${ex || ''}`.trim() }], { max: mx || Math.max(x, y) });
    if (L === 1) { const x = r.int(10, 19), y = r.chance(0.2) ? x : r.int(10, 19); return mk(`${x} ○ ${y}`, x, y); }
    if (L === 2) { const a = r.int(5, 9), b = r.int(5, 9), y = r.chance(0.25) ? a + b : r.int(11, 18); return mk(`${a} + ${b} ○ ${y}`, a + b, y, `${a} + ${b} = ${a + b}.`); }
    if (L === 3) { const a = r.int(5, 9), b = r.int(5, 9), c = r.int(5, 9), d = r.chance(0.3) ? a + b - c : r.int(5, 9); return mk(`${a} + ${b} ○ ${c} + ${d}`, a + b, c + d, `${a + b} und ${c + d}.`); }
    const a = r.int(12, 19), b = r.int(2, 9), c = r.int(5, 9), d = r.int(2, 9); return mk(`${a} − ${b} ○ ${c} + ${d}`, a - b, c + d, `${a - b} und ${c + d}.`, a);
  };

  const HERO = [['Funki', 'er', 'Blüten'], ['Mia', 'sie', 'Tautropfen'], ['Igel Ino', 'er', 'Samen'], ['Eule Ella', 'sie', 'Beeren']];
  GEN.story = (L, r) => {
    const [n, p, o] = r.pick(HERO), P = p === 'er' ? 'Er' : 'Sie';
    if (L === 1) { const a = r.int(6, 12), b = r.int(Math.max(3, 10 - a), Math.min(9, 20 - a)); return task('story', `${n} sammelt ${a} ${o}. Dann findet ${p} noch ${b}.`, [num('Wie viele sind es zusammen?', a + b, { eq: [`${a}+${b}`, '?'], explain: `${a} + ${b} = ${a + b}.` })], { max: a + b }); }
    if (L === 2) { const a = r.int(12, 18), b = r.int(3, 9); return task('story', `${n} hat ${a} ${o}. ${b} davon fliegen weg.`, [num('Wie viele bleiben?', a - b, { eq: [`${a}-${b}`, '?'], explain: `${a} − ${b} = ${a - b}.` })], { max: a }); }
    if (L === 3) { const a = r.int(11, 17); return task('story', `${n} braucht 20 ${o} für den Zaubertrank. Schon ${a} sind im Korb.`, [num('Wie viele fehlen noch?', 20 - a, { eq: [`${a}+?`, '20'], explain: `${a} + ${20 - a} = 20.` })], { max: 20 }); }
    const a = r.int(8, 12), b = r.int(4, 8), c = r.int(3, 7); return task('story', `${n} hat ${a} ${o}. Ein Freund bringt ${b} dazu. Dann verschenkt ${p} ${c}.`, [num('Wie viele hat ' + (p === 'er' ? 'er' : 'sie') + ' jetzt?', a + b - c, { eq: [`${a}+${b}-${c}`, '?'], explain: `${a} + ${b} = ${a + b}, dann − ${c} = ${a + b - c}.` })], { max: a + b });
  };

  GEN.pattern = (L, r) => {
    const seq = (start, step, len, ans) => { const s = []; for (let i = 0; i < len; i++) s.push(start + i * step); return { shown: s.join(', '), next: start + len * step }; };
    let sq, mx;
    if (L === 1) { const d = r.pick([2, 2, 3]), st = r.int(2, 9); sq = seq(st, d, 3); }
    else if (L === 2) { const dn = r.chance(0.5); sq = dn ? seq(20, -r.pick([2, 5]), 3) : seq(r.pick([5, 10]), 5, 3); if (sq.next < 0) sq = seq(2, 2, 3); }
    else if (L === 3) { const st = r.pick([2, 3, 4]), d = r.pick([3, 4]); sq = seq(st, d, 4); }
    else { const k = r.int(0, 1); if (k === 0) { const s = [1, 2, 4, 7]; sq = { shown: s.join(', '), next: 11 }; } else { sq = seq(r.pick([20, 19, 18]), -3, 4); } }
    mx = Math.max(sq.next, 10);
    const first = sq.shown.split(', ').map(Number);
    return task('pattern', 'Welche Zahl kommt als Nächstes?', [num(`${sq.shown}, ${unk}`, sq.next, { explain: `Schau auf die Schritte: nächste Zahl ist ${sq.next}.` })], { max: Math.max(mx, ...first) });
  };

  GEN.tenmath = (L, r) => {
    if (L === 1) { const a = r.int(3, 9); return task('tenmath', 'Die 10 hilft!', [num(r.chance(0.5) ? `10 + ${a} = ?` : `${a} + 10 = ?`, 10 + a, { eq: [`10+${a}`, '?'], explain: `10 + ${a} = ${10 + a}.` })], { max: 10 + a }); }
    if (L === 2) { const a = r.int(12, 19), k = r.chance(0.5); return k ? task('tenmath', 'Zehner und Einer.', [num(`${a} − 10 = ?`, a - 10, { eq: [`${a}-10`, '?'], explain: `${a} − 10 = ${a - 10}.` })], { max: a }) : task('tenmath', 'Zehner und Einer.', [num(`${a} = 10 + ${unk}`, a - 10, { eq: [`10+?`, String(a)], explain: `${a} = 10 + ${a - 10}.` })], { max: a }); }
    if (L === 3) { const e = r.int(2, 8); return task('tenmath', 'Zehner und Einer.', [num(`1 Zehner und ${e} Einer sind die Zahl ${unk}`, 10 + e, { explain: `10 + ${e} = ${10 + e}.` }), num(`20 − 10 + ${e} = ?`, 10 + e, { eq: [`20-10+${e}`, '?'], explain: `20 − 10 = 10, dann + ${e}.` })], { max: 20 }); }
    const a = r.int(12, 16), t = a - 10, c = r.int(3, 6);
    return task('tenmath', 'Erst die 10, dann der Rest.', [num(`${a} − ${t} = ?`, 10, { eq: [`${a}-${t}`, '?'], explain: `${a} − ${t} = 10.` }), num(`10 + ${c} = ?`, 10 + c, { eq: [`10+${c}`, '?'], explain: `10 + ${c} = ${10 + c}.` })], { max: a });
  };

  const FAMILIES = ['pairs10', 'plus', 'minus', 'gap', 'line', 'wall', 'double', 'compare', 'story', 'pattern', 'tenmath'];
  GEN.mix = (L, r) => GEN[r.pick(FAMILIES)](L, r);

  /* ---------- topic catalogue ---------- */
  const TOPIC = {
    pairs10: { icon: 'heart', title: 'Verliebte Zahlen', blurb: 'Welche Zahl passt zu mir?' },
    plus: { icon: 'plus', title: 'Plusaufgaben', blurb: 'Zusammen zählen.' },
    minus: { icon: 'minus', title: 'Minusaufgaben', blurb: 'Wegnehmen.' },
    gap: { icon: 'square', title: 'Welche Zahl fehlt?', blurb: 'Welche Zahl fehlt?' },
    line: { icon: 'arrows', title: 'Zahlenstrahl', blurb: 'Finde den Platz auf dem Strahl.' },
    wall: { icon: 'triangle', title: 'Zahlenmauer', blurb: 'Zwei Steine tragen einen.' },
    double: { icon: 'twice', title: 'Doppelt und halb', blurb: 'Doppelt und halb.' },
    compare: { icon: 'compare', title: 'Größer oder kleiner?', blurb: 'Welche Zahl ist größer?' },
    story: { icon: 'story', title: 'Gartengeschichten', blurb: 'Kleine Geschichten rechnen.' },
    pattern: { icon: 'wave', title: 'Zahlenmuster', blurb: 'Was kommt als Nächstes?' },
    tenmath: { icon: 'tens', title: 'Mit der 10 rechnen', blurb: 'Die 10 hilft dir.' },
    mix: { icon: 'shuffle', title: 'Zaubermix', blurb: 'Von allem etwas!' }
  };

  // 8 slots per garden, topics mixed; every garden holds addition, subtraction, pairs/wall-like and story/mix
  const PLAN_TYPES = [
    ['pairs10', 'plus', 'line', 'wall', 'minus', 'double', 'pattern', 'story'],
    ['plus', 'pairs10', 'gap', 'minus', 'compare', 'wall', 'line', 'mix'],
    ['minus', 'double', 'tenmath', 'plus', 'gap', 'line', 'story', 'mix'],
    ['pairs10', 'wall', 'plus', 'minus', 'compare', 'gap', 'story', 'mix']
  ];
  const ROUND_SIZE = 5;
  const PLAN = [];
  PLAN_TYPES.forEach((types, g) => types.forEach((type, s) => {
    const k = g * 8 + s, tp = TOPIC[type];
    PLAN.push({ k, garden: g, slot: s, level: g + 1, type, icon: tp.icon, title: tp.title, blurb: tp.blurb, write: (g + s) % 3 === 0 }); // ~1/3 by finger
  }));

  /* ---------- rounds ---------- */
  function makeRound(k, seed) {
    const node = PLAN[k], r = makeRng((seed >>> 0) ^ Math.imul(k + 1, 2654435761));
    const tasks = [], seen = new Set();
    let guard = 0;
    while (tasks.length < ROUND_SIZE && guard++ < 200) {
      const fam = node.type === 'mix' ? r.pick(FAMILIES) : node.type;
      const t = GEN[fam](node.level, r), key = JSON.stringify([t.ctx, t.steps.map(s => [s.prompt, s.answer, s.visual && s.visual.rows])]);
      if (seen.has(key)) continue; seen.add(key); t.write = node.write; tasks.push(t);
    }
    return { k, node, tasks };
  }

  /* ---------- scoring: 5 questions = 100 points, never below 10 ---------- */
  function pointsFor(res) { // res: {wrong:number, help:boolean, shown:boolean}
    if (res.shown) return 6;
    return res.wrong === 0 && !res.help ? 20 : 12;
  }
  function scoreRound(results) { const sum = results.reduce((s, x) => s + pointsFor(x), 0); return Math.max(10, Math.min(100, sum)); }
  const dotsForPct = p => (p >= 100 ? 'star' : Math.min(4, 1 + Math.floor((p - 10) / 22.5)));
  /* Praise: short, plain, tied to what the child did (process praise, never "you are clever").
   * Picked by situation and never the same line twice in a row. */
  const PRAISE = {
    right: ['Richtig!', 'Genau!', 'Stimmt!', 'Ja, genau!', 'Passt!', 'Das stimmt!'],
    byType: { line: ['Genau auf der Linie!'], wall: ['Der Stein passt!'], compare: ['Stimmt, so ist es!'], pairs10: ['Das Paar passt!'] },
    write: ['Gut geschrieben!', 'Gut lesbar – und richtig!'],
    help: ['Mit der Hilfe geschafft!', 'Die Hilfe hat geholfen – richtig!'],
    again: ['Beim zweiten Mal genau hingeschaut – richtig!', 'Nochmal probiert – jetzt stimmt es!', 'Dranbleiben lohnt sich – richtig!']
  };
  // c: {wrong:number, help:boolean, ink:boolean, type:string}; last: the previous line (avoided)
  function praise(c, last) {
    const rnd = Math.random;
    let pool = c.wrong > 0 ? PRAISE.again : c.help ? PRAISE.help : PRAISE.right.concat(PRAISE.byType[c.type] || [], c.ink ? PRAISE.write : []);
    pool = pool.filter(x => x !== last);
    return pool[Math.floor(rnd() * pool.length)];
  }
  const END_PRAISE = ['Geschafft! Der Weg geht weiter.', 'Super, du bist drangeblieben!', 'Klasse! Mehr Blumen für den Garten!']; // wording given by the owner

  /* ---------- persistent progress + highscore (personal bests only) ---------- */
  function emptyProgress() { const n = PLAN.length; return { v: 1, done: Array(n).fill(false), pct: Array(n).fill(60), peak: Array(n).fill(0), best: Array(n).fill(0), plays: Array(n).fill(0), perfect: Array(n).fill(0), last: Array(n).fill(0) }; }
  function recordResult(pr, k, pct, perfect) {
    pr.done[k] = true; pr.plays[k]++; pr.last[k] = pct; pr.pct[k] = pct;
    pr.best[k] = Math.max(pr.best[k], pct); pr.peak[k] = Math.max(pr.peak[k], pct); if (perfect) pr.perfect[k]++;
    return pr;
  }
  function gardenComplete(pr, g) { for (let s = 0; s < 8; s++) if (!pr.done[g * 8 + s]) return false; return true; }
  function gardenSummary(pr, g) {
    const rows = []; let sum = 0, stars = 0;
    for (let s = 0; s < 8; s++) { const k = g * 8 + s, n = PLAN[k]; rows.push({ k, nr: k + 1, icon: n.icon, title: n.title, best: pr.best[k], last: pr.last[k], plays: pr.plays[k], dots: pr.done[k] ? dotsForPct(pr.best[k]) : 0 }); sum += pr.best[k]; if (pr.best[k] >= 100) stars++; }
    return { garden: g, rows, total: sum, max: 800, stars };
  }

  return { makeRng, PLAN, TOPIC, ROUND_SIZE, FAMILIES, GEN, makeRound, pointsFor, scoreRound, dotsForPct, PRAISE, praise, END_PRAISE, emptyProgress, recordResult, gardenComplete, gardenSummary };
});
