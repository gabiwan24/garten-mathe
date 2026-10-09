/* Zaubergarten overlay UI: runs one "Uebung" (5 questions) on top of the garden, plus the garden table and finale cards.
 * Styles live in lab/zg.css (design system), icons in lab/icons.js. No inline styles, no emojis.
 * Depends on window.ZGTasks, window.ZGIcons; uses window.Ink (finger writing) when present. No timers shown, no lives, praise for practising. */
(function () {
  'use strict';
  const T = window.ZGTasks, I = window.ZGIcons;
  const $ = (s, el) => (el || document).querySelector(s);
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const ico = (id, fill) => I.svg(id, { fill });

  /* ---------- sound helpers (soft chimes) ---------- */
  let ac = null;
  function audio() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = false; } } return ac || null; }
  function tone(freq, when, dur, vol, type) {
    const a = audio(); if (!a || (window.bg && window.bg.muted)) return;
    const t0 = a.currentTime + (when || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.value = freq; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol || 0.05, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + (dur || 0.5));
    o.connect(g).connect(a.destination); o.start(t0); o.stop(t0 + (dur || 0.5) + 0.05);
  }
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];
  const chime = i => { tone(PENTA[i % PENTA.length], 0, 0.7, 0.05); tone(PENTA[i % PENTA.length] * 2, 0.02, 0.5, 0.02); };
  const fanfare = () => [0, 2, 4, 7].forEach((n, i) => tone(PENTA[n], i * 0.09, 0.9, 0.05));

  // keep a number together with its neighbours so a lone number never wraps onto its own line
  // a lone ? (the unknown) gets the accent colour; a ? at the end of a word (a question) stays plain
  const qmark = txt => txt.replace(/(^|\s)\?(?=\s|$)/g, '$1<span class="zg-q">?</span>');
  const nb = txt => txt.replace(/ (\d+)/g, ' $1').replace(/(\d+) /g, '$1 ');

  /* ---------- pictures (all colours come from zg.css classes) ---------- */
  const cell = (cx, cy, cls, crossed) => `<circle class="zg-d ${cls}${crossed ? ' x' : ''}" cx="${cx}" cy="${cy}" r="${cls === 'o' ? 13 : 11}"/>` + (crossed ? `<path class="zg-xl" d="M${cx - 8} ${cy - 8}L${cx + 8} ${cy + 8}M${cx + 8} ${cy - 8}L${cx - 8} ${cy + 8}"/>` : '');
  const frameCells = v => { let g = ''; const tot = (v.a || 0) + (v.b || 0), cr = v.cross || 0;
    for (let i = 0; i < 20; i++) { const frame = Math.floor(i / 10), j = i % 10, cx = 16 + (j % 5) * 32, cy = 16 + Math.floor(j / 5) * 32 + frame * 76;
      g += cell(cx, cy, i < (v.a || 0) ? 'a' : i < tot ? 'b' : 'o', i < tot && i >= tot - cr); }
    return g; };
  function visualHTML(v, step) {
    if (!v) return '';
    if (v.kind === 'tenframe') { // two ten-frames (20 cells): first a dots (light), then b dots (dark), the last `cross` filled dots are struck out, the rest empty
      let g = frameCells(v);
      return `<svg class="zg-svg zg-frame" viewBox="0 0 160 148" width="176" height="163">${g}</svg>`;
    }
    if (v.kind === 'bars') { // compare: one labelled block of dots per side, ten per line (like a ten-frame), so both sides can be compared at a glance
      let g = '', y = 0;
      v.rows.forEach(r => { const tot = (r.a || 0) + (r.b || 0), lines = Math.max(1, Math.ceil(tot / 10));
        g += `<text class="zg-barlab" x="6" y="${y + 20}">${r.label || ''}</text>`;
        for (let i = 0; i < tot; i++) g += cell(18 + (i % 10) * 30, y + 44 + Math.floor(i / 10) * 30, i < (r.a || 0) ? 'a' : 'b', i >= tot - (r.cross || 0));
        y += 30 + lines * 30 + 14; });
      return `<svg class="zg-svg zg-bars" viewBox="0 0 320 ${y - 10}">${g}</svg>`;
    }
    if (v.kind === 'line') {
      const n = v.to - v.from, W = 520, pad = 30, dx = (W - 2 * pad) / n, y = 78, drag = step.input === 'line', H = v.start != null ? 140 : 110; let s = `<svg class="zg-svg${drag ? ' zg-drag' : ''}" viewBox="0 0 ${W} ${H}" data-pad="${pad}" data-dx="${dx}" data-n="${n}" data-from="${v.from}" data-y="${y}" data-start="${drag && v.start != null ? v.start - v.from : 0}">`;
      s += `<line class="zg-axis" x1="${pad}" y1="${y}" x2="${W - pad}" y2="${y}"/>`;
      for (let i = 0; i <= n; i++) { const x = pad + i * dx, val = v.from + i;
        s += `<line class="zg-mark" x1="${x}" y1="${y - 10}" x2="${x}" y2="${y + 10}"/>`;
        s += `<text class="zg-label${!v.labels || v.labels.indexOf(val) >= 0 ? '' : ' zg-hl'}" x="${x}" y="${y - 24}" text-anchor="middle">${val}</text>`; // numbers sit ABOVE the line so a finger never covers them; few numbers only, the asked one is never printed
      }
      if (v.start != null) { const x0 = pad + (v.start - v.from) * dx, x1 = pad + (v.start + v.jump - v.from) * dx;
        s += `${drag ? '' : `<circle class="zg-start" cx="${x0}" cy="${y}" r="9"/>`}<path class="zg-hop${drag ? ' zg-hid' : ''}" d="M${x0} ${y + 14} Q${(x0 + x1) / 2} ${y + 52} ${x1} ${y + 14}"/>`; }
      if (drag) s += `<g class="zg-ball"><circle class="zg-hit" cx="${pad}" cy="${y}" r="40"/><circle class="zg-knob" cx="${pad}" cy="${y}" r="17"/></g>`; // the ball always lies on the line; the big invisible circle is the finger target
      return s + '</svg>';
    }
    if (v.kind === 'wall') {
      let s = '<div class="zg-wall">';
      for (let r = v.rows.length - 1; r >= 0; r--) { s += '<div class="zg-wall-row">';
        v.rows[r].forEach((val, c) => { const cur = v.cur && v.cur[0] === r && v.cur[1] === c;
          s += `<div class="zg-cell${val == null ? (cur ? ' cur' : ' q') : ''}">${val == null ? '?' : val}</div>`; });
        s += '</div>'; }
      return s + '</div>';
    }
    return '';
  }
  const TIP_UNUSED = { pairs10: 'Wie viele fehlen bis zur vollen Zehn?', plus: 'Mach erst die 10 voll. Dann den Rest dazu.', minus: 'Geh erst bis zur 10 zurück. Dann den Rest.', gap: 'Probiere eine Zahl aus und rechne nach.', line: 'Hüpfe Schritt für Schritt.', wall: 'Zwei Steine nebeneinander ergeben den Stein darüber.', double: 'Doppelt heißt: zweimal dieselbe Zahl.', compare: 'Rechne zuerst beide Seiten aus.', story: 'Male dir die Geschichte im Kopf.', pattern: 'Schau, wie viel jedes Mal dazukommt.', tenmath: 'Die 10 ist dein Helfer.', count: 'Eine volle Reihe sind 5. Ein volles Feld sind 10.', family: 'Die drei Zahlen bleiben gleich. Nur die Reihenfolge ändert sich.' };

  /* ---------- the overlay itself ---------- */
  function open(hue) { const el = h('div', 'zg'); el.style.setProperty('--h', hue); document.body.appendChild(el); return el; }
  const close = el => el.remove();
  let playerName = ''; // shown in the tables and the finale; set by the name card
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const dotsHTML = d => { const f = d === 'star' ? 4 : d; return [0, 1, 2, 3].map(i => `<span class="zg-dot${i < f ? '' : ' off'}"></span>`).join('') + (d === 'star' ? `<span class="zg-star">${ico('star', true)}</span>` : ''); };

  function runRound(k, opts) { // opts: {hue, onFinish(pct, perfect, again), onClose()}
    const node = T.PLAN[k], round = T.makeRound(k, (Date.now() & 0x7fffffff)), root = open(opts.hue); window.__zgRound = round; // exposed for automated checks
    let ti = 0, si = 0, wrong = 0, help = false, shown = false, entry = '', useInk = node.write && !!window.Ink, strokes = [], inkTimer = 0, flashTimer = 0, locked = false;
    const results = [], stepResults = []; let ballReset = null, lastPraise = '';
    root.innerHTML = `<div class="zg-top"><button class="zg-btn ghost icon" data-a="x" aria-label="Zurück">${ico('close')}</button><div class="zg-prog"></div><span class="zg-spacer"></span></div>
      <div class="zg-body"><div class="zg-card"><div class="zg-ctx"></div><div class="zg-prompt"></div><div class="zg-visual"></div></div><div class="zg-input"></div><div class="zg-msg"></div></div>
      <div class="zg-bar"><button class="zg-btn ghost" data-a="help">${ico('help')} Hilfe</button><button class="zg-btn ghost" data-a="alt" hidden></button></div>`;
    const prog = $('.zg-prog', root), ctx = $('.zg-ctx', root), prompt = $('.zg-prompt', root), vis = $('.zg-visual', root), inp = $('.zg-input', root), msg = $('.zg-msg', root), altBtn = $('[data-a=alt]', root);
    const task = () => round.tasks[ti], step = () => task().steps[si];
    const drawProg = () => { prog.innerHTML = round.tasks.map((_, i) => `<i class="${i < ti ? 'done' : i === ti ? 'on' : ''}"></i>`).join(''); };
    const say = (text, bad) => { msg.textContent = text; msg.className = 'zg-msg' + (bad ? ' bad' : ''); };

    function render() {
      locked = false; entry = ''; strokes = []; help = help && si > 0; wrong = 0; shown = false; say(''); helpLabel(false);
      drawProg(); const t = task(), s = step();
      ctx.textContent = nb(t.ctx); prompt.innerHTML = qmark(nb(s.prompt.replace(/ ○ /, ' ? ')));
      $('.zg-card', root).classList.toggle('zg-story', /\d/.test(t.ctx) && !/\d/.test(s.prompt)); // story with numbers: story and question share one size
      vis.innerHTML = s.visual && (s.visual.kind !== 'tenframe' || s.visual.show) ? visualHTML(s.visual, s) : ''; // dot pictures only appear as help (they would give the answer away), unless the picture IS the task
      clearTimeout(flashTimer); if (s.visual && s.visual.flash) flash(); // quick look: the picture is covered after a moment, so the child sees groups instead of counting one by one
      ballReset = null; if (s.input === 'line') attachBall(vis.querySelector('.zg-svg'), v => submit(String(v)));
      inp.innerHTML = ''; inp.hidden = false;
      if (s.input === 'cmp') { const c = h('div', 'zg-choices'); s.choices.forEach((ch, i) => { const b = h('button', 'zg-key', ch); b.onclick = () => submit(String(i)); c.appendChild(b); }); inp.appendChild(c); }
      else if (s.input === 'line') inp.hidden = true;
      else if (useInk && s.input === 'num') buildInk(s);
      else buildPad();
      root.classList.toggle('zg-dense', !!vis.innerHTML.trim() && s.input === 'num'); // picture + keypad: two-row keypad so nothing scrolls
      altBtn.hidden = !(node.write && window.Ink && s.input === 'num');
      altBtn.innerHTML = useInk ? `${ico('keyboard')} Lieber tippen` : `${ico('pen')} Schreiben`;
    }

    // number line: drag the ball sideways and let go over a line; it snaps to the nearest tick and the value is checked
    function attachBall(svg, onDrop) {
      const ball = svg.querySelector('.zg-ball'), pad = +svg.dataset.pad, dx = +svg.dataset.dx, n = +svg.dataset.n, from = +svg.dataset.from;
      const startIdx = +svg.dataset.start || 0; let dragging = false, idx = startIdx; // the ball sits on the start number for hop tasks, else at the left end
      const toX = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()).x; };
      // slides along the line; on release it snaps to the nearest tick
      const place = (x, snap) => { const i = Math.max(0, Math.min(n, Math.round((x - pad) / dx))), cx = snap ? pad + i * dx : Math.max(pad, Math.min(pad + n * dx, x)); idx = i;
        ball.style.transform = `translate(${cx - pad}px, 0)`; };
      ball.addEventListener('pointerdown', e => { if (locked) return; dragging = true; ball.classList.add('drag'); ball.style.transition = 'none'; try { ball.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ } });
      ball.addEventListener('pointermove', e => { if (dragging) place(toX(e), false); });
      const drop = () => { if (!dragging) return; dragging = false; ball.classList.remove('drag'); ball.style.transition = ''; place(pad + idx * dx, true); setTimeout(() => onDrop(from + idx), 160); };
      ball.addEventListener('pointerup', drop); ball.addEventListener('pointercancel', drop);
      ballReset = () => { if (locked) return; idx = startIdx; ball.style.transform = `translate(${startIdx * dx}px, 0)`; };
      ball.style.transition = 'none'; ballReset(); ball.getBoundingClientRect(); ball.style.transition = ''; // appear on the start number without gliding
    }

    function buildPad() {
      const slots = h('div', 'zg-ans'); inp.appendChild(slots);
      const draw = () => { slots.innerHTML = `<div class="zg-slot one${entry ? ' f' : ''}">${entry}</div>`; }; // one field, same width for 1 or 2 digits (does not hint how long the answer is)
      draw();
      const pad = h('div', 'zg-pad');
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].forEach(k => {
        const b = h('button', 'zg-key' + (k === 'ok' ? ' ok' : k === 'del' ? ' del' : ''), k === 'del' ? ico('backspace') : k === 'ok' ? ico('check') : k); b.setAttribute('aria-label', k === 'del' ? 'Löschen' : k === 'ok' ? 'Fertig' : k);
        b.onclick = () => { if (locked) return; if (k === 'del') entry = entry.slice(0, -1); else if (k === 'ok') { if (entry) submit(entry); return; } else if (entry.length < 2) entry += k; draw(); };
        pad.appendChild(b); });
      inp.appendChild(pad);
      pad._reset = draw; inp._draw = draw;
    }

    function buildInk(s) { // finger writing
      const box = h('div', 'zg-ink', '<canvas></canvas><div class="hint">Schreibe die Zahl mit dem Finger</div>'), read = h('div', 'zg-read', ''), row = h('div', 'zg-row');
      const clear = h('button', 'zg-btn ghost', 'Löschen'), go = h('button', 'zg-btn primary', `${ico('check')} Fertig`);
      row.append(clear, go); box.append(read); inp.append(box, row); // the recognised number is shown inside the writing field: no extra row, no layout jump
      const cv = $('canvas', box), g = cv.getContext('2d'); let drawing = false, cur = null;
      const fit = () => { const r = cv.getBoundingClientRect(); cv.width = r.width * devicePixelRatio; cv.height = r.height * devicePixelRatio; g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); paint(); };
      const inkColor = getComputedStyle(root).getPropertyValue('--accent-ink').trim() || '#1f2a44';
      function paint() { const r = cv.getBoundingClientRect(); g.clearRect(0, 0, r.width, r.height); g.lineCap = g.lineJoin = 'round'; g.lineWidth = 11; g.strokeStyle = getComputedStyle(cv).color;
        strokes.forEach(st => { g.beginPath(); st.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); if (st.length === 1) g.lineTo(st[0].x + 0.1, st[0].y); g.stroke(); }); }
      const pos = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      cv.addEventListener('pointerdown', e => { if (locked) return; try { cv.setPointerCapture(e.pointerId); } catch (err) { /* synthetic or already released pointer */ } drawing = true; clearTimeout(inkTimer); cur = [pos(e)]; strokes.push(cur); $('.hint', box).hidden = true; paint(); });
      cv.addEventListener('pointermove', e => { if (!drawing) return; cur.push(pos(e)); paint(); });
      const up = () => { if (!drawing) return; drawing = false; inkTimer = setTimeout(evaluate, 1100); };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      clear.onclick = () => { strokes = []; read.textContent = ''; paint(); $('.hint', box).hidden = false; };
      go.onclick = () => { clearTimeout(inkTimer); evaluate(); };
      function evaluate() {
        if (locked || !strokes.length) return;
        const exp = String(s.answer), r = window.Ink.matchExpected(strokes, exp);
        read.textContent = r.bestText || '';
        if (r.accept) return submit(exp);
        if (r.ambiguous || !r.bestText) { // not sure: ask, never punish
          say(r.bestText ? `Meinst du ${r.bestText}?` : 'Schreib die Zahl noch einmal etwas größer.');
          if (r.bestText) { row.innerHTML = ''; const y = h('button', 'zg-btn primary', `Ja, ${r.bestText}`), n = h('button', 'zg-btn ghost', 'Nochmal schreiben');
            y.onclick = () => submit(r.bestText); n.onclick = () => { strokes = []; read.textContent = ''; say(''); paint(); row.innerHTML = ''; row.append(clear, go); }; row.append(y, n); }
          else { strokes = []; paint(); }
          return; }
        submit(r.bestText);
      }
      requestAnimationFrame(fit); addEventListener('resize', fit);
    }

    function submit(val) {
      if (locked) return; const s = step(), ok = Number(val) === s.answer;
      if (ok) { locked = true; lastPraise = T.praise({ wrong, help, ink: useInk && s.input === 'num', type: task().type }, lastPraise); say(lastPraise); inp.classList.add('zg-flash'); setTimeout(() => inp.classList.remove('zg-flash'), 400); chime(si + ti); if (navigator.vibrate) navigator.vibrate(15); setTimeout(next, 1100); return; }
      if (ballReset) setTimeout(ballReset, 700); // the ball rolls back to the start after a wrong drop
      wrong++; inp.classList.add('zg-shake'); setTimeout(() => inp.classList.remove('zg-shake'), 400); entry = '';
      if (wrong === 1) { say('Fast! Schau noch einmal genau hin.', true); showHelp(); if (inp._draw) inp._draw(); }
      else { shown = true; locked = true; say(`So geht es: ${s.explain}`, true); inp.innerHTML = ''; const ok2 = h('button', 'zg-btn primary', 'Weiter'); inp.appendChild(ok2); inp.hidden = false; ok2.onclick = next; }
    }
    const FLASH_MS = 3000;
    function flash() {
      vis.classList.remove('zg-covered'); vis.classList.add('zg-flash');
      if (!vis.querySelector('.zg-cover')) vis.insertAdjacentHTML('beforeend', `<button class="zg-cover" type="button" data-a="peek">${ico('eye')}<span>Nochmal zeigen</span></button>`);
      clearTimeout(flashTimer); flashTimer = setTimeout(() => vis.classList.add('zg-covered'), FLASH_MS);
    }
    // circle picture for a step: given by the task, or derived from its equation (first number light, second dark, taken-away dots struck out)
    function helpPicture(s) {
      if (s.help) return s.help;
      if (s.eq && typeof s.answer === 'number') {
        const [lhs, rhs] = s.eq;
        if (/\*/.test(lhs)) return { kind: 'tenframe', a: s.answer, b: s.answer, cross: 0 }; // halving: two equal groups
        const terms = (rhs === '?' ? lhs : lhs.replace('?', String(s.answer))).match(/[+-]?\d+/g);
        if (terms) { let pos = [], neg = 0; terms.forEach((x, i) => { const n = Math.abs(Number(x)); if (i === 0 || x[0] !== '-') pos.push(n); else neg += n; });
          const a = pos[0], b = pos.slice(1).reduce((p, q) => p + q, 0); if (a + b <= 20 && neg <= a + b) return { kind: 'tenframe', a, b, cross: neg }; }
      }
      if (s.visual && s.visual.kind === 'tenframe') return s.visual;
      return typeof s.answer === 'number' && s.answer <= 20 && s.input === 'num' ? { kind: 'tenframe', a: s.answer, b: 0, cross: 0 } : null;
    }
    const helpBtn = $('[data-a=help]', root);
    const helpLabel = on => { helpBtn.innerHTML = `${ico('help')} ${on ? 'Hilfe aus' : 'Hilfe'}`; helpBtn.setAttribute('aria-pressed', on ? 'true' : 'false'); };
    const helpShown = () => !!vis.querySelector('.zg-help, [data-hl]');  // flash tasks hide their picture by themselves
    function showHelp() { // `help` stays true for the score even after the picture is hidden again
      help = true; const s = step(), v = s.visual;
      if (v && v.kind === 'line') { vis.querySelectorAll('.zg-hl').forEach(e => { e.dataset.hl = '1'; e.classList.remove('zg-hl'); }); const hop = vis.querySelector('.zg-hop'); if (hop) { hop.dataset.hl = '1'; hop.classList.remove('zg-hid'); } } // number line: print every number, show the jump
      else if (v && v.flash) { flash(); return; } // the picture is the task itself: show it again (it covers itself after a moment)
      else { const pic = helpPicture(s); if (pic && !vis.querySelector('.zg-help')) vis.insertAdjacentHTML('beforeend', `<div class="zg-help">${visualHTML(pic, s)}</div>`); }
      helpLabel(true);
    }
    function hideHelp() {
      vis.querySelectorAll('[data-hl]').forEach(e => { e.classList.add(e.tagName === 'path' ? 'zg-hid' : 'zg-hl'); delete e.dataset.hl; });
      vis.querySelectorAll('.zg-help').forEach(e => e.remove());
      helpLabel(false);
    }
    function next() {
      stepResults.push({ wrong, help, shown }); wrong = 0;
      if (si + 1 < task().steps.length) { si++; render(); return; }
      const part = stepResults.splice(0), res = { wrong: Math.max(...part.map(p => p.wrong)), help: part.some(p => p.help), shown: part.some(p => p.shown) }; // the worst step of a task counts
      results.push(res); ti++; si = 0; help = false;
      if (ti >= round.tasks.length) return finish();
      render();
    }

    function finish() {
      const pct = T.scoreRound(results), perfect = pct >= 100, d = T.dotsForPct(pct);
      root.innerHTML = `<div class="zg-body zg-center"><div class="zg-card"><div class="zg-hero">${I.svg(node.icon, { size: 48 })}</div><div class="zg-title">${T.END_PRAISE[Math.floor(Math.random() * T.END_PRAISE.length)]}</div>
        <div class="zg-dots">${dotsHTML(d)}</div><div class="zg-note">${pct} Punkte für deinen Garten</div></div>
        <div class="zg-row"><button class="zg-btn primary" data-a="ok">Weiter</button><button class="zg-btn ghost" data-a="again">Nochmal üben</button></div></div>`;
      fanfare();
      root.querySelector('[data-a=ok]').onclick = () => { close(root); opts.onFinish && opts.onFinish(pct, perfect); };
      root.querySelector('[data-a=again]').onclick = () => { close(root); opts.onFinish && opts.onFinish(pct, perfect, true); };
    }

    root.addEventListener('click', e => {
      const a = e.target.closest('[data-a]'); if (!a) return; const act = a.getAttribute('data-a');
      if (act === 'x') { clearTimeout(flashTimer); close(root); opts.onClose && opts.onClose(); }
      else if (act === 'help') { if (!locked) { if (helpShown()) hideHelp(); else showHelp(); } }
      else if (act === 'peek') flash(); // as often as wanted, never counts against the child
      else if (act === 'alt') { useInk = !useInk; render(); }
    });
    render();
    return root;
  }

  /* ---------- garden table (personal bests, no ranking) ---------- */
  function showTable(summary, hue, opts) {
    const root = open(hue), rows = summary.rows.map(r => `<tr><td>${r.nr}</td><td class="g">${I.svg(r.icon, { size: 20 })}</td><td>${r.title}</td><td>${r.plays ? `<div class="zg-dots">${dotsHTML(r.dots)}</div>` : '–'}</td><td class="sc">${r.best || '–'}</td></tr>`).join('');
    root.innerHTML = `<div class="zg-body zg-center"><div class="zg-card"><div class="zg-title">Garten ${summary.garden + 1}: ${playerName ? `Bestwerte von ${esc(playerName)}` : 'deine Bestwerte'}</div>
      <table class="zg-table">${rows}</table>
      <div class="zg-total"><span>Gesamt: ${summary.total} von ${summary.max}</span><span class="zg-star">${ico('star', true)} ${summary.stars}</span></div></div>
      <div class="zg-row"><button class="zg-btn primary" data-a="ok">${opts && opts.okText || 'Weiter'}</button></div></div>`;
    root.querySelector('[data-a=ok]').onclick = () => { close(root); opts && opts.onClose && opts.onClose(); };
    return root;
  }
  function showFinale(summaries, hue, onClose) {
    const total = summaries.reduce((s, x) => s + x.total, 0), max = summaries.reduce((s, x) => s + x.max, 0), stars = summaries.reduce((s, x) => s + x.stars, 0), root = open(hue);
    root.innerHTML = `<div class="zg-body zg-center"><div class="zg-card"><div class="zg-hero">${I.svg('house', { size: 48 })}</div><div class="zg-title">Gartenmeister${playerName ? ', ' + esc(playerName) : ''}!</div>
      <p class="zg-text">Du hast alle vier Gärten zum Leuchten gebracht. Das Hexenhäuschen strahlt für dich!</p>
      <table class="zg-table">${summaries.map(s => `<tr><td></td><td>Garten ${s.garden + 1}</td><td class="sc">${s.total} / ${s.max}</td><td class="sc"><span class="zg-star">${ico('star', true)}</span> ${s.stars}</td></tr>`).join('')}</table>
      <div class="zg-total"><span>Gesamt: ${total} von ${max}</span><span class="zg-star">${ico('star', true)} ${stars}</span></div></div>
      <div class="zg-row"><button class="zg-btn primary" data-a="ok">Zum Garten</button></div></div>`;
    root.querySelector('[data-a=ok]').onclick = () => { close(root); onClose && onClose(); };
    return root;
  }

  /* ---------- name card (first start) ---------- */
  function askName(hue, current, onDone, onCancel) {
    const root = open(hue);
    root.innerHTML = `<div class="zg-top">${onCancel ? `<button class="zg-btn ghost icon" data-a="x" aria-label="Zurück">${ico('close')}</button>` : '<span class="zg-spacer"></span>'}<div class="zg-prog"></div><span class="zg-spacer"></span></div>
      <div class="zg-body zg-center"><div class="zg-card"><div class="zg-hero">${I.svg('heart', { size: 48 })}</div><div class="zg-title">Wie heißt du?</div>
      <input class="zg-field" type="text" maxlength="14" autocomplete="off" autocapitalize="words" spellcheck="false" aria-label="Dein Name" value="${esc(current || '')}"></div>
      <div class="zg-row"><button class="zg-btn primary" data-a="ok">Los geht's</button></div></div>`;
    const inp = $('.zg-field', root), ok = $('[data-a=ok]', root), sync = () => { ok.disabled = !inp.value.trim(); };
    const go = () => { const n = inp.value.trim(); if (!n) return; playerName = n; close(root); onDone(n); };
    inp.oninput = sync; inp.onkeydown = e => { if (e.key === 'Enter') go(); }; ok.onclick = go; sync();
    const x = $('[data-a=x]', root); if (x) x.onclick = () => { close(root); onCancel(); };
    setTimeout(() => inp.focus(), 50);
    return root;
  }

  /* ---------- all personal bests, every garden ---------- */
  function showScores(summaries, hue, onClose) {
    const root = open(hue), tbl = s => s.rows.map(r => `<tr><td>${r.nr}</td><td class="g">${I.svg(r.icon, { size: 20 })}</td><td>${r.title}</td><td>${r.plays ? `<div class="zg-dots">${dotsHTML(r.dots)}</div>` : '–'}</td><td class="sc">${r.best || '–'}</td></tr>`).join('');
    root.innerHTML = `<div class="zg-body"><div class="zg-card"><div class="zg-title">Bestwerte${playerName ? ' von ' + esc(playerName) : ''}</div>
      ${summaries.map(s => `<h3 class="zg-section">Garten ${s.garden + 1}</h3><table class="zg-table">${tbl(s)}</table><div class="zg-total"><span>${s.total} von ${s.max}</span><span class="zg-star">${ico('star', true)} ${s.stars}</span></div>`).join('')}</div>
      <div class="zg-row"><button class="zg-btn primary" data-a="ok">Zurück</button></div></div>`;
    $('[data-a=ok]', root).onclick = () => { close(root); onClose && onClose(); };
    return root;
  }

  /* ---------- adult menu: everything that is not for the child lives here ---------- */
  // opts: {name, devOn, onName(), onScores(), onDev(), onWipe()}; each handler is called after the menu closed
  function showMenu(hue, opts) {
    const root = open(hue), item = (a, icon, text, extra, cls) => `<button class="zg-btn ghost${cls ? ' ' + cls : ''}" data-a="${a}">${ico(icon)}<span>${text}</span>${extra ? `<small>${extra}</small>` : ''}</button>`;
    root.innerHTML = `<div class="zg-top"><button class="zg-btn ghost icon" data-a="x" aria-label="Schließen">${ico('close')}</button><div class="zg-prog"></div><span class="zg-spacer"></span></div>
      <div class="zg-body zg-center"><div class="zg-card"><div class="zg-title">Menü für <span data-a="adult">Erwachsene</span></div><p class="zg-sub">Hier ist alles, was nicht zum Spielen gehört.</p>
      <div class="zg-list">${item('name', 'user', 'Name ändern', esc(opts.name || ''))}${item('scores', 'star', 'Bestwerte ansehen')}</div><div class="zg-list" data-hidden hidden>${item('dev', 'code', 'Entwickler-Regler', opts.devOn ? 'an' : 'aus')}${item('wipe', 'trash', 'Fortschritt löschen', '', 'danger')}</div></div>
      <div class="zg-row"><button class="zg-btn primary" data-a="x">Zurück zum Garten</button></div></div>`;
    let taps = 0;
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a;
      if (a === 'x') return close(root);
      if (a === 'adult') { taps++; if (taps >= 4) $('[data-hidden]', root).hidden = false; return; } // 4 taps on "Erwachsene" reveal the developer items
      if (a === 'wipe') { // second tap needed: the child must not delete the garden by accident
        if (!b.classList.contains('armed')) { b.classList.add('armed'); b.querySelector('span').textContent = 'Wirklich alles löschen? Nochmal tippen.'; return; }
      }
      close(root); const fn = { name: opts.onName, scores: opts.onScores, dev: opts.onDev, wipe: opts.onWipe }[a]; fn && fn();
    });
    return root;
  }

  window.ZGUI = { setName: n => { playerName = n || ''; }, askName, showScores, showMenu, runRound, showTable, showFinale, chime, fanfare, tone, audio };
})();
