// node lab/tests/tasks.test.mjs  -> prints "TASKS OK" when every check passes
import { createRequire } from 'node:module';
const T = createRequire(import.meta.url)('../tasks.js');
let fails = 0; const bad = (m) => { fails++; if (fails <= 25) console.log('FAIL', m); };

// tiny evaluator for + - * on non-negative ints (no eval)
function ev(s) {
  const tok = s.match(/\d+|[+\-*]/g) || []; let i = 0;
  const term = () => { let v = Number(tok[i++]); while (tok[i] === '*') { i++; v *= Number(tok[i++]); } return v; };
  let v = term(); while (i < tok.length) { const op = tok[i++]; const t = term(); v = op === '+' ? v + t : v - t; } return v;
}

// plan: 32 nodes, 4 gardens, topics mixed (>= 6 distinct per garden), glyph + title everywhere
if (T.PLAN.length !== 32) bad('plan length ' + T.PLAN.length);
for (let g = 0; g < 4; g++) {
  const types = new Set(T.PLAN.filter(n => n.garden === g).map(n => n.type));
  if (types.size < 6) bad(`garden ${g + 1} has only ${types.size} topics`);
  for (const must of ['plus', 'minus']) if (!types.has(must)) bad(`garden ${g + 1} lacks ${must}`);
}
for (const n of T.PLAN) { if (!n.icon || !n.title || !n.blurb) bad('plan entry incomplete ' + n.k); if (!T.GEN[n.type]) bad('unknown type ' + n.type); }
const writeCount = T.PLAN.filter(n => n.write).length;
if (writeCount < 8 || writeCount > 16) bad('writing nodes ' + writeCount);

const ARITH = new Set(['plus', 'minus', 'pairs10', 'gap', 'double', 'tenmath']);
let tasksChecked = 0, stepsChecked = 0, eqChecked = 0, minMax = 99;
for (const n of T.PLAN) {
  for (let seed = 1; seed <= 150; seed++) {
    const round = T.makeRound(n.k, seed * 7919);
    if (round.tasks.length !== T.ROUND_SIZE) { bad(`node ${n.k} seed ${seed}: ${round.tasks.length} tasks`); continue; }
    const keys = new Set();
    for (const t of round.tasks) {
      tasksChecked++;
      const key = JSON.stringify([t.ctx, t.steps.map(s => [s.prompt, s.answer, s.visual && s.visual.rows])]); if (keys.has(key)) bad(`dup in round ${n.k}/${seed}`); keys.add(key);
      if (!(t.max >= 10)) bad(`${t.type} L${n.level} max<10: ${t.steps[0].prompt}`);
      minMax = Math.min(minMax, t.max);
      for (const s of t.steps) {
        stepsChecked++;
        if (!Number.isInteger(s.answer) || s.answer < 0 || s.answer > 30) bad(`bad answer ${s.answer} in ${s.prompt}`);
        if (!s.explain) bad('no explanation for ' + s.prompt);
        if (s.input === 'cmp' && !(s.choices && s.choices.length === 3 && s.answer >= 0 && s.answer <= 2)) bad('cmp malformed');
        if (s.input === 'line' && !(s.visual && s.answer >= s.visual.from && s.answer <= s.visual.to)) bad('line answer outside axis: ' + s.prompt);
        if (s.visual && s.visual.kind === 'line') { // number line: at most 2 printed numbers, the asked / answer number never among them
          const lb = s.visual.labels; if (!lb || lb.length > 2) bad('line labels: ' + JSON.stringify(lb) + ' ' + s.prompt);
          else if (lb.includes(s.answer)) bad('line shows the answer ' + s.answer + ': ' + s.prompt);
          else if (s.input === 'line' && s.prompt.match(/\d+/) && lb.includes(Number(s.prompt.match(/\d+/)[0])) && Number(s.prompt.match(/\d+/)[0]) === s.answer) bad('asked number printed');
        }
        if (s.eq) { // independent check: put the answer in for '?' and evaluate both sides
          eqChecked++;
          const L = s.eq[0].replace(/\?/g, String(s.answer)), R = s.eq[1].replace(/\?/g, String(s.answer));
          if (ev(L) !== ev(R)) bad(`eq wrong: ${s.prompt} -> ${L} != ${R}`);
        }
      }
      // difficulty floor: arithmetic must not live below 10 (the old 'plaettchen in der box' level)
      if (ARITH.has(t.type) && t.max < 10) bad('too easy ' + t.steps[0].prompt);
    }
  }
}

// scoring: 5 x perfect = 100, never below 10, help lowers, solution shown lowers most
const perfect = Array(5).fill({ wrong: 0, help: false, shown: false });
if (T.scoreRound(perfect) !== 100) bad('perfect != 100');
if (T.scoreRound(Array(5).fill({ wrong: 2, help: true, shown: true })) < 10) bad('floor');
if (!(T.scoreRound(Array(5).fill({ wrong: 1, help: false, shown: false })) < 100)) bad('wrong should lower');
if (T.dotsForPct(100) !== 'star' || T.dotsForPct(10) !== 1 || T.dotsForPct(99) !== 4) bad('dots mapping');

// progress / highscore (personal bests only, never decreasing)
const pr = T.emptyProgress();
T.recordResult(pr, 0, 60, false); T.recordResult(pr, 0, 40, false); T.recordResult(pr, 0, 100, true);
if (pr.best[0] !== 100 || pr.last[0] !== 100 || pr.plays[0] !== 3 || pr.perfect[0] !== 1) bad('record');
T.recordResult(pr, 1, 20, false); if (pr.best[1] !== 20) bad('best 2');
T.recordResult(pr, 0, 30, false); if (pr.best[0] !== 100) bad('best must never shrink');
if (T.gardenComplete(pr, 0)) bad('garden should not be complete');
for (let s = 0; s < 8; s++) T.recordResult(pr, s, 50, false);
if (!T.gardenComplete(pr, 0)) bad('garden should be complete');
const sum = T.gardenSummary(pr, 0); if (sum.rows.length !== 8 || sum.max !== 800 || sum.stars !== 1) bad('summary ' + JSON.stringify([sum.rows.length, sum.max, sum.stars]));
// praise: situation-specific, short, process-focused, never the same line twice in a row
const lines = [].concat(T.PRAISE.right, T.PRAISE.write, T.PRAISE.help, T.PRAISE.again, ...Object.values(T.PRAISE.byType));
for (const l of lines) { if (l.length > 48) bad('praise too long: ' + l); if (/klug|schlau|begabt|talent|genial|toll|super/i.test(l)) bad('ability or empty praise: ' + l); }
for (const l of T.END_PRAISE) if (l.length > 48 || /klug|schlau|begabt|talent|genial/i.test(l)) bad('end praise: ' + l); // end lines are the owner's wording
let prev = ''; for (let i = 0; i < 400; i++) { const p = T.praise({ wrong: i % 3 === 0 ? 1 : 0, help: i % 5 === 0, ink: i % 2 === 0, type: ['line', 'wall', 'plus'][i % 3] }, prev); if (!p || p === prev) bad('praise repeated or empty'); prev = p; }
const againSet = new Set(T.PRAISE.again), helpSet = new Set(T.PRAISE.help);
if (!againSet.has(T.praise({ wrong: 1, help: false, ink: false, type: 'plus' }, ''))) bad('wrong-then-right gets the "again" praise');
if (!helpSet.has(T.praise({ wrong: 0, help: true, ink: false, type: 'plus' }, ''))) bad('help gets the "help" praise');
// determinism
const a = JSON.stringify(T.makeRound(5, 123)), b = JSON.stringify(T.makeRound(5, 123)); if (a !== b) bad('rounds not deterministic');

console.log(`tasks=${tasksChecked} steps=${stepsChecked} eqChecked=${eqChecked} minMax=${minMax} writeNodes=${writeCount}`);
if (fails) { console.log('TASKS FAIL', fails); process.exit(1); }
console.log('TASKS OK');
