import { watchTilt } from '../sensors/tilt';
import { isSettled, smooth, stepSpring, tiltToTarget, type Spring } from './sway';

interface Joint {
  el: SVGGElement; x: number; y: number; rot: number; stiffness: number; root: boolean; spring: Spring;
  /** True while the DOM transform already shows the settled spring (no write needed). */
  idle: boolean;
}

// One shared animation frame loop for all visible plants instead of one per plant.
// The loop sleeps when every spring is at rest (no sensor, device lying flat) and wakes on tilt or registration.
const plants = new Set<Joint[]>();
let gamma = 0;
let restGamma = 0;
let stopTilt: (() => void) | null = null;
let frame = 0;
let running = false;
let last = 0;
// Below this tilt change the targets move by less than the settle threshold, so sleeping is safe.
const WAKE_DELTA = 0.1;

function start(): void {
  if (running || plants.size === 0) return;
  running = true;
  last = 0;
  frame = requestAnimationFrame(tick);
}

function tick(t: number): void {
  const dt = last ? (t - last) / 1000 : 1 / 60;
  last = t;
  let allSettled = true;
  for (const joints of plants) {
    for (const j of joints) {
      const target = tiltToTarget(gamma, j.stiffness, j.root);
      const next = stepSpring(j.spring, target, j.stiffness, dt);
      if (isSettled(next, target)) {
        j.spring = { angle: target, vel: 0 };
        if (j.idle) continue;
        j.idle = true;
      } else {
        j.spring = next;
        j.idle = false;
        allSettled = false;
      }
      j.el.setAttribute('transform', `translate(${j.x} ${j.y}) rotate(${(j.rot + j.spring.angle).toFixed(2)})`);
    }
  }
  if (allSettled) {
    running = false;
    restGamma = gamma;
    return;
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
    idle: true,
  }));
  plants.add(joints);
  if (plants.size === 1) {
    stopTilt = watchTilt((g) => {
      gamma = smooth(gamma, g, 0.15);
      if (!running && Math.abs(gamma - restGamma) > WAKE_DELTA) start();
    });
  }
  start();
  return () => {
    plants.delete(joints);
    if (plants.size === 0) {
      cancelAnimationFrame(frame);
      running = false;
      stopTilt?.();
      stopTilt = null;
    }
  };
}
