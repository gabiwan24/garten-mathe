import { describe, expect, it } from 'vitest';
import { generatePlant, walk, type PlantSpec } from '../../src/garden/plant';
import type { PlantFamily, PlantStage } from '../../src/lib/types';

const FAMILIES: PlantFamily[] = ['flower', 'fruit', 'coral'];
const STAGES: PlantStage[] = [2, 3, 4, 5];
const count = (spec: PlantSpec, kind: string) => walk(generatePlant(spec)).filter((n) => n.kind === kind).length;

describe('generatePlant', () => {
  it('is deterministic per seed', () => {
    const spec: PlantSpec = { seed: 123, family: 'flower', stage: 5, pracht: true };
    expect(JSON.stringify(generatePlant(spec))).toBe(JSON.stringify(generatePlant(spec)));
  });
  it('varies between seeds', () => {
    const shapes = new Set(Array.from({ length: 20 }, (_, i) => JSON.stringify(generatePlant({ seed: i, family: 'coral', stage: 5, pracht: false }))));
    expect(shapes.size).toBe(20);
  });
  it('grows leaves and crowns by stage', () => {
    for (const family of FAMILIES) for (let seed = 1; seed <= 20; seed++) {
      expect(count({ seed, family, stage: 2, pracht: false }, 'leaf')).toBe(2);
      expect(count({ seed, family, stage: 3, pracht: false }, 'leaf')).toBe(4);
      expect(count({ seed, family, stage: 4, pracht: false }, 'leaf')).toBe(5);
      expect(count({ seed, family, stage: 5, pracht: false }, 'leaf')).toBe(6);
      expect(count({ seed, family, stage: 2, pracht: false }, 'crown')).toBe(0);
      expect(count({ seed, family, stage: 3, pracht: false }, 'crown')).toBe(0);
      expect(count({ seed, family, stage: 4, pracht: false }, 'crown')).toBe(1);
      expect(count({ seed, family, stage: 5, pracht: false }, 'crown')).toBe(1);
      expect(count({ seed, family, stage: 5, pracht: true }, 'crown')).toBe(2);
      expect(count({ seed, family, stage: 5, pracht: true }, 'bee')).toBe(1);
      expect(count({ seed, family, stage: 5, pracht: false }, 'bee')).toBe(0);
    }
  });
  it('has exactly one gold part on a Prachtpflanze and none otherwise', () => {
    for (const family of FAMILIES) for (let seed = 1; seed <= 40; seed++) {
      for (const stage of STAGES) {
        const nodes = walk(generatePlant({ seed, family, stage, pracht: false }));
        expect(nodes.filter((n) => n.gold)).toHaveLength(0);
      }
      const pracht = walk(generatePlant({ seed, family, stage: 5, pracht: true }));
      expect(pracht.filter((n) => n.gold)).toHaveLength(1);
      expect(pracht.some((n) => n.kind === 'shine')).toBe(true);
    }
  });
  it('produces only finite numbers and a single root at depth 0', () => {
    for (const family of FAMILIES) for (const stage of STAGES) {
      const nodes = walk(generatePlant({ seed: 9, family, stage, pracht: stage === 5 }));
      expect(JSON.stringify(nodes)).not.toMatch(/NaN|Infinity/);
      expect(nodes.filter((n) => n.depth === 0)).toHaveLength(1);
    }
  });
});
