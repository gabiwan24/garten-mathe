import { describe, expect, it } from 'vitest';
import { circlePath, closedCatmullRom, leafPath, polarBlob, ribbonPath, starPath, tulipPath } from '../../src/garden/shapes';

const valid = (d: string) => {
  expect(d.startsWith('M')).toBe(true);
  expect(d.endsWith('Z')).toBe(true);
  expect(d).not.toMatch(/NaN|Infinity/);
};

describe('shapes', () => {
  it('closedCatmullRom emits one cubic segment per point', () => {
    const d = closedCatmullRom([[0, 0], [10, 0], [10, 10], [0, 10]]);
    valid(d);
    expect(d.match(/C/g)).toHaveLength(4);
  });
  it('all primitives produce valid closed paths', () => {
    valid(polarBlob(0, 0, 10, [{ k: 5, amp: 0.3, phase: 1 }]));
    valid(polarBlob(0, 0, 10, [], 16, 2));
    valid(leafPath(24, 12, 5, 0.16));
    valid(ribbonPath(30, 5, 3, 4));
    valid(starPath(0, 0, 10, 4, 7));
    valid(circlePath(5, 5, 3));
    valid(tulipPath(20, 24));
  });
  it('ribbon has 2*(samples+1) outline points', () => {
    expect(ribbonPath(30, 5, 3, 4, 10).split(/[ML]/).filter(Boolean)).toHaveLength(22);
  });
  it('star alternates outer and inner vertices', () => {
    expect(starPath(0, 0, 10, 4, 6).split(/[ML]/).filter(Boolean)).toHaveLength(12);
  });
  it('is deterministic', () => {
    expect(polarBlob(1, 2, 3, [{ k: 3, amp: 0.2, phase: 0.5 }])).toBe(polarBlob(1, 2, 3, [{ k: 3, amp: 0.2, phase: 0.5 }]));
  });
});
