// node lab/tests/scene.check.mjs -> static wiring check of the garden scene; prints "SCENE OK"
import { readFileSync, existsSync } from 'node:fs';
const html = readFileSync('lab/blumenweg.html', 'utf8');
let fails = 0; const need = (cond, msg) => { if (!cond) { fails++; console.log('MISSING', msg); } };
for (const f of ['tasks.js', 'icons.js', 'ink.js', 'overlay.js', 'fireworks.js']) { need(html.includes(`<script src="${f}"></script>`), `script tag ${f}`); need(existsSync('lab/' + f), `file lab/${f}`); }
for (const [token, why] of [
  ['ZGUI.runRound', 'long press starts the real exercise overlay'], ['commitResult', 'result is written to progress'], ["'zg_lab_state'", 'progress persists'],
  ['ZGTasks.PLAN[wpPos.indexOf(p)].icon', 'topic glyph on every waypoint'], ['startSeq', 'gate light-up sequence'], ['ZGUI.showTable', 'garden table at the gate'],
  ['ZGFireworks.start', 'final fireworks'], ['ZGUI.showFinale', 'finale card'], ['updateFlies', 'fireflies around the arrow'], ['const HOUSE', 'witch cottage'],
  ['nodeFlash', 'node flash during the sequence']]) need(html.includes(token), why);
need(html.includes('<link rel="stylesheet" href="zg.css">'), 'design system stylesheet linked');
const ui = readFileSync('lab/overlay.js', 'utf8');
for (const [token, why] of [['Ink.matchExpected', 'finger writing uses the recognizer'], ['zg-table', 'table styles'], ["'Hilfe'", 'help button'] ]) need(ui.includes(token.replace(/'/g, '')) || ui.includes(token), why);
// pedagogy guard: no timers, lives or rankings in the UI code; read-aloud was removed on request
for (const bad of ['Leben', 'Bestenliste', 'Rangliste', 'countdown', 'Sekunden übrig', 'speechSynthesis', 'SpeechSynthesis']) need(!ui.includes(bad), `forbidden concept "${bad}"`);
if (fails) { console.log('SCENE FAIL', fails); process.exit(1); }
console.log('SCENE OK');
