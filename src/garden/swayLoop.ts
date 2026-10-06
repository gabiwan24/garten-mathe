import { watchTilt } from '../sensors/tilt';
import { smooth, stepSpring, tiltToTarget, type Spring } from './sway';

interface Joint { el: SVGGElement; x: number; y: number; rot: number; stiffness: number; root: boolean; spring: Spring }

// One shared animation frame loop for all visible plants instead of one per plant.
const plants = new Set<Joint[]>();
let gamma = 0;
let stopTilt: (() => void) | null = null;
let frame = 0;
let last = 0;

function tick(t: number): void {
  const dt = last ? (t - last) / 1000 : 1 / 60;
  last = t;
  for (const joints of plants) {
    for (const j of joints) {
      j.spring = stepSpring(j.spring, tiltToTarget(gamma, j.stiffness, j.root), j.stiffness, dt);
      j.el.setAttribute('transform', `translate(${j.x} ${j.y}) rotate(${(j.rot + j.spring.angle).toFixed(2)})`);
    }
  }
  frame = requestAnimationFrame(tick);
}

export function registerSway(svg: SVGSVGElement): () => void {
  const joints: Joint[] = [...svg.querySelectorAll<SVGGElement>('g[data-stiffness]')].map((el) => ({
    el,
    x: Number(el.dataset.x),
    y: Number(el.dataset.y),
    rot: Number(el.dataset.rot),
    stiffness: Number(el.dataset.stiffness),
    root: el.dataset.depth === '0',
    spring: { angle: 0, vel: 0 },
  }));
  plants.add(joints);
  if (plants.size === 1) {
    stopTilt = watchTilt((g) => (gamma = smooth(gamma, g, 0.15)));
    last = 0;
    frame = requestAnimationFrame(tick);
  }
  return () => {
    plants.delete(joints);
    if (plants.size === 0) {
      cancelAnimationFrame(frame);
      stopTilt?.();
      stopTilt = null;
    }
  };
}
