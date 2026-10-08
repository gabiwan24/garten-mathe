// node lab/tests/spec.check.mjs -> the concept doc has every required section and the measured ink numbers match the benchmark; prints "SPEC OK"
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const doc = readFileSync('docs/superpowers/specs/2026-10-08-zaubergarten-aufgaben.md', 'utf8');
let fails = 0; const need = (c, m) => { if (!c) { fails++; console.log('MISSING', m); } };
for (const h of ['## 2. Regeln für 7-Jährige', '## 3. Aufbau', '## 4. Themenplan', '## 5. Aufgabentypen und Stufen', '## 6. Oberfläche', '## 7. Tor, Feuerwerk, Hexenhäuschen', '## 8. Handschrift', '## 9. Offene Punkte']) need(doc.includes(h), h);
for (let g = 1; g <= 4; g++) need(doc.includes(`**Garten ${g} ·`), `plan table garden ${g}`);
for (const w of ['Feuerwerk', 'Gartentafel', 'Hexenhäuschen', 'Glühwürmchen', 'Bestwert', 'Machbar', 'Grenze der Messung']) need(doc.includes(w), w);
// numbers in the doc must come from the real benchmark, not be copied by hand
const out = execFileSync('node', ['lab/tests/ink.test.mjs'], { encoding: 'utf8', timeout: 170000 });
const row = (name) => out.split('\n').find(l => l.startsWith(name)).trim().split(/\s{2,}/).slice(1).map(Number);
const fmt = n => n.toFixed(1).replace('.', ',');
const top1 = row('top-1 overall %'), trueAcc = row('true-accept %'), falseAcc = row('false-accept %');
need(doc.includes(`${fmt(top1[0])} % | ${fmt(top1[1])} % | ${fmt(top1[2])} %`), 'top-1 row matches benchmark ' + top1);
need(doc.includes(`${fmt(trueAcc[0])} % | ${fmt(trueAcc[1])} % | ${fmt(trueAcc[2])} %`), 'true-accept row matches benchmark ' + trueAcc);
need(doc.includes(`${fmt(falseAcc[0])} % | ${fmt(falseAcc[1])} % | ${fmt(falseAcc[2])} %`), 'false-accept row matches benchmark ' + falseAcc);
if (fails) { console.log('SPEC FAIL', fails); process.exit(1); }
console.log('SPEC OK');
