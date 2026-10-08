/* Big finale fireworks on a transparent full-screen canvas (2D). window.ZGFireworks.start({hues, seconds, onEnd, onSound}) */
(function () {
  'use strict';
  function start(o) {
    const hues = o.hues && o.hues.length ? o.hues : [0.6, 0.9, 0.07, 0.74, 0.99, 0.53, 0.82, 0.13];
    const dur = (o.seconds || 14) * 1000, cv = document.createElement('canvas');
    Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: 25, pointerEvents: 'none' });
    document.body.appendChild(cv);
    const g = cv.getContext('2d'); let W, H, dpr = Math.min(devicePixelRatio || 1, 2);
    const fit = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); }; fit(); addEventListener('resize', fit);
    const rockets = [], sparks = [], t0 = performance.now(); let last = t0, nextLaunch = 0, ended = false, raf = 0;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const col = (h, l) => `hsl(${(h * 360) % 360} 90% ${l}%)`;

    function launch(big) {
      const x = rnd(W * 0.12, W * 0.88), ty = rnd(H * 0.12, H * 0.5);
      rockets.push({ x, y: H + 10, vx: rnd(-40, 40), vy: -rnd(H * 0.9, H * 1.15), ty, hue: hues[Math.floor(Math.random() * hues.length)], big });
    }
    function burst(x, y, hue, big) {
      const n = big ? 150 : 80, shape = Math.random();
      const second = (hue + rnd(0.05, 0.12)) % 1;
      for (let i = 0; i < n; i++) {
        let a = (i / n) * Math.PI * 2, sp = rnd(60, big ? 330 : 230);
        if (shape < 0.3) sp = (big ? 260 : 190) * (1 + 0.15 * Math.sin(i)); // ring
        else if (shape < 0.5) { const th = (i / n) * Math.PI * 2; a = th; sp = (big ? 20 : 14) * (16 * Math.pow(Math.sin(th), 3)) * 0.16 * 12; } // heart-ish
        sparks.push({ x, y, vx: Math.cos(a) * Math.abs(sp), vy: Math.sin(a) * Math.abs(sp) - (shape >= 0.3 && shape < 0.5 ? Math.abs(Math.cos(i)) * 4 : 0), life: rnd(1.2, 2.2), age: 0, hue: Math.random() < 0.7 ? hue : second, size: rnd(1.6, big ? 3.6 : 2.8) });
      }
      o.onSound && o.onSound(big);
    }
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; const el = now - t0, p = el / dur;
      g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
      if (el < dur - 2500 && el >= nextLaunch) { // rhythm: starts calm, builds up, big salvo at the end
        const burstN = p < 0.3 ? 1 : p < 0.7 ? 2 : 3; for (let i = 0; i < burstN; i++) launch(p > 0.8);
        nextLaunch = el + (p < 0.3 ? 900 : p < 0.7 ? 520 : 300);
      }
      if (!ended && el >= dur - 2300 && !rockets.finalDone) { rockets.finalDone = true; for (let i = 0; i < 6; i++) setTimeout(() => launch(true), i * 160); }
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i]; r.x += r.vx * dt; r.y += r.vy * dt; r.vy += 260 * dt;
        g.fillStyle = col(r.hue, 80); g.beginPath(); g.arc(r.x, r.y, 2.4, 0, 6.3); g.fill();
        if (r.y <= r.ty || r.vy > -40) { burst(r.x, r.y, r.hue, r.big); rockets.splice(i, 1); }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]; s.age += dt; if (s.age > s.life) { sparks.splice(i, 1); continue; }
        s.vx *= 0.985; s.vy = s.vy * 0.985 + 90 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
        const a = 1 - s.age / s.life; g.fillStyle = col(s.hue, 55 + 25 * a); g.globalAlpha = Math.max(0, a); g.beginPath(); g.arc(s.x, s.y, s.size * (0.5 + a * 0.6), 0, 6.3); g.fill(); g.globalAlpha = 1;
      }
      if (el >= dur && !rockets.length && !sparks.length) { ended = true; cv.remove(); removeEventListener('resize', fit); o.onEnd && o.onEnd(); return; }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return { stop() { cancelAnimationFrame(raf); cv.remove(); removeEventListener('resize', fit); } };
  }
  window.ZGFireworks = { start };
})();
