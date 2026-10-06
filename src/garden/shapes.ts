export type Pt = [number, number];
export interface Wave { k: number; amp: number; phase: number }

export function fmt(v: number): string {
  return String(Math.round(v * 100) / 100 || 0);
}

// Catmull-Rom through all points, closed, converted to cubic Béziers: gives the soft cut-paper edge.
export function closedCatmullRom(points: Pt[]): string {
  const n = points.length;
  let d = `M${fmt(points[0][0])},${fmt(points[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n], p1 = points[i], p2 = points[(i + 1) % n], p3 = points[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${fmt(c1x)},${fmt(c1y)} ${fmt(c2x)},${fmt(c2y)} ${fmt(p2[0])},${fmt(p2[1])}`;
  }
  return `${d}Z`;
}

export function polarBlob(cx: number, cy: number, radius: number, waves: readonly Wave[], samples = 48, stretchY = 1): string {
  const pts: Pt[] = [];
  for (let i = 0; i < samples; i++) {
    const a = (i / samples) * Math.PI * 2;
    const m = 1 + waves.reduce((s, w) => s + w.amp * Math.sin(w.k * a + w.phase), 0);
    const r = radius * Math.max(0.15, m);
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a) * stretchY]);
  }
  return closedCatmullRom(pts);
}

export function lobedFlower(cx: number, cy: number, r: number, petals: number, depth: number, phase: number): string {
  return polarBlob(cx, cy, r, [{ k: petals, amp: depth, phase }], Math.max(48, petals * 12));
}

/** Leaf with its base at (0,0), pointing up. */
export function leafPath(length: number, width: number, lobes: number, depth: number): string {
  return polarBlob(0, -length / 2, width / 2, [{ k: lobes, amp: depth, phase: Math.PI / 2 }], 48, length / width);
}

/** Tapered stem from (0,0) to (bend, -length), curving along a parabola. */
export function ribbonPath(length: number, baseWidth: number, tipWidth: number, bend: number, samples = 10): string {
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const cx = bend * t * t, cy = -length * t;
    const tx = 2 * bend * t, ty = -length;
    const len = Math.hypot(tx, ty);
    const nx = -ty / len, ny = tx / len;
    const w = (baseWidth + (tipWidth - baseWidth) * t) / 2;
    left.push(`${fmt(cx - nx * w)},${fmt(cy - ny * w)}`);
    right.push(`${fmt(cx + nx * w)},${fmt(cy + ny * w)}`);
  }
  return `M${[...left, ...right.reverse()].join('L')}Z`;
}

export function starPath(cx: number, cy: number, outer: number, inner: number, points: number): string {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${fmt(cx + r * Math.cos(a))},${fmt(cy + r * Math.sin(a))}`);
  }
  return `M${pts.join('L')}Z`;
}

export function circlePath(cx: number, cy: number, r: number): string {
  return `M${fmt(cx - r)},${fmt(cy)}a${fmt(r)},${fmt(r)} 0 1,0 ${fmt(2 * r)},0a${fmt(r)},${fmt(r)} 0 1,0 ${fmt(-2 * r)},0Z`;
}

/** Three-tipped tulip cup with its base at (0,0). */
export function tulipPath(w: number, h: number): string {
  const x = w / 2;
  return (
    `M${fmt(-x)},${fmt(-h * 0.25)}L${fmt(-x)},${fmt(-h)}L${fmt(-x / 3)},${fmt(-h * 0.72)}L0,${fmt(-h)}` +
    `L${fmt(x / 3)},${fmt(-h * 0.72)}L${fmt(x)},${fmt(-h)}L${fmt(x)},${fmt(-h * 0.25)}` +
    `Q${fmt(x)},0 0,0Q${fmt(-x)},0 ${fmt(-x)},${fmt(-h * 0.25)}Z`
  );
}
