import { describe, expect, it } from 'vitest';
import { itemLabel } from '../../src/tasks/labels';
import { TASK_TYPES } from '../../src/tasks/registry';

describe('registry', () => {
  it('unlocks addBridgeTen only when both basics reach level 2', () => {
    const u = TASK_TYPES.addBridgeTen.unlocked;
    expect(u({ decompose: 1, fillTen: 2, addBridgeTen: 1 })).toBe(false);
    expect(u({ decompose: 2, fillTen: 1, addBridgeTen: 1 })).toBe(false);
    expect(u({ decompose: 2, fillTen: 2, addBridgeTen: 1 })).toBe(true);
    expect(TASK_TYPES.decompose.unlocked({ decompose: 1, fillTen: 1, addBridgeTen: 1 })).toBe(true);
  });
  it('maps families per spec', () => {
    expect(TASK_TYPES.decompose.family).toBe('flower');
    expect(TASK_TYPES.fillTen.family).toBe('fruit');
    expect(TASK_TYPES.addBridgeTen.family).toBe('coral');
  });
});

describe('itemLabel', () => {
  it('renders item keys for parents', () => {
    expect(itemLabel('decompose:7:3')).toBe('7 = 3 + ?');
    expect(itemLabel('fillTen:6')).toBe('6 + ? = 10');
    expect(itemLabel('addBridgeTen:8+5')).toBe('8 + 5');
    expect(itemLabel('weird')).toBe('weird');
  });
});
