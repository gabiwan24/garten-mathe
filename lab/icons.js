/* Monochrome line icons on a 24x24 grid (2 px round stroke, currentColor). No emojis anywhere in the UI.
 * UMD: window.ZGIcons / module.exports. svg(id,{size,fill,cls}) -> inline SVG string; draw(ctx,id,cx,cy,size,color,lineWidth) -> canvas (Path2D). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ZGIcons = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const P = {
    close: 'M6 6l12 12M18 6L6 18',
    help: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
    keyboard: 'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M19 10h.01M7 14h10',
    pen: 'M4 20l1-4L16 5a2 2 0 0 1 3 3L8 19zM14 7l3 3',
    check: 'M5 12l4 4 10-10',
    backspace: 'M9 6h11v12H9L3 12zM12 10l4 4M16 10l-4 4',
    star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
    house: 'M4 11l8-7 8 7M6 10v10h12V10M10 20v-6h4v6',
    heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    arrows: 'M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4',
    triangle: 'M12 4l9 16H3z',
    twice: 'M8 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0M16 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0',
    compare: 'M10 6l-5 6 5 6M14 6l5 6-5 6',
    story: 'M12 7c-2-2-5-2-8-1v12c3-1 6-1 8 1 2-2 5-2 8-1V6c-3-1-6-1-8 1zM12 7v12',
    wave: 'M3 14c2-6 4-6 6 0s4 6 6 0 4-6 6 0',
    tens: 'M4.5 9h.01M8.25 9h.01M12 9h.01M15.75 9h.01M19.5 9h.01M4.5 15h.01M8.25 15h.01M12 15h.01M15.75 15h.01M19.5 15h.01',
    shuffle: 'M4 8h4l8 8h4M4 16h4l2-2M14 8h6M17 5l3 3-3 3M17 13l3 3-3 3',
    square: 'M5 5h14v14H5z',
    menu: 'M4 7h16M4 12h16M4 17h16',
    sound: 'M4 9h4l5-4v14l-5-4H4zM16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11',
    soundoff: 'M4 9h4l5-4v14l-5-4H4zM17 9l5 6M22 9l-5 6',
    user: 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6',
    trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
    code: 'M9 7l-5 5 5 5M15 7l5 5-5 5'
  };
  const svg = (id, o) => { o = o || {}; const s = o.size || 24;
    return `<svg class="zg-ico${o.cls ? ' ' + o.cls : ''}" viewBox="0 0 24 24" width="${s}" height="${s}" fill="${o.fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[id]}"/></svg>`; };
  const draw = (ctx, id, cx, cy, size, color, lw) => { ctx.save(); ctx.translate(cx - size / 2, cy - size / 2); ctx.scale(size / 24, size / 24); ctx.strokeStyle = color; ctx.lineWidth = lw || 2; ctx.lineCap = ctx.lineJoin = 'round'; ctx.stroke(new Path2D(P[id])); ctx.restore(); };
  return { paths: P, svg, draw, ids: Object.keys(P) };
});
