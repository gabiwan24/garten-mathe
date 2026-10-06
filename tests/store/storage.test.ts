import { describe, expect, it } from 'vitest';
import { defaultState } from '../../src/store/schema';
import { BACKUP_KEY, exportState, importState, loadState, MAIN_KEY, saveState, type StorageLike } from '../../src/store/storage';

class MemoryStorage implements StorageLike {
  map = new Map<string, string>();
  getItem(k: string) { return this.map.get(k) ?? null; }
  setItem(k: string, v: string) { this.map.set(k, v); }
}
class BrokenStorage implements StorageLike {
  getItem(): string | null { throw new Error('blocked'); }
  setItem(): void { throw new Error('blocked'); }
}

function withPlant(id: string) {
  const s = defaultState();
  s.plants.push({ id, seed: 1, family: 'flower', taskType: 'decompose', stage: 3, pracht: false, date: '2026-10-06' });
  return s;
}

describe('storage', () => {
  it('round-trips state', () => {
    const st = new MemoryStorage();
    expect(saveState(st, withPlant('a'))).toBe(true);
    const r = loadState(st);
    expect(r.source).toBe('main');
    expect(r.state.plants[0].id).toBe('a');
  });
  it('keeps the previous valid state as lastGood', () => {
    const st = new MemoryStorage();
    saveState(st, withPlant('a'));
    saveState(st, withPlant('b'));
    expect(JSON.parse(st.map.get(BACKUP_KEY)!).plants[0].id).toBe('a');
  });
  it('falls back to lastGood when main is corrupt', () => {
    const st = new MemoryStorage();
    saveState(st, withPlant('a'));
    saveState(st, withPlant('b'));
    st.map.set(MAIN_KEY, '{broken');
    const r = loadState(st);
    expect(r.source).toBe('lastGood');
    expect(r.state.plants[0].id).toBe('a');
  });
  it('does not overwrite lastGood with a corrupt main', () => {
    const st = new MemoryStorage();
    saveState(st, withPlant('a'));
    saveState(st, withPlant('b'));
    st.map.set(MAIN_KEY, '{broken');
    saveState(st, withPlant('c'));
    expect(JSON.parse(st.map.get(BACKUP_KEY)!).plants[0].id).toBe('a');
  });
  it('returns defaults when nothing is stored or everything is corrupt', () => {
    expect(loadState(new MemoryStorage()).source).toBe('default');
    const st = new MemoryStorage();
    st.map.set(MAIN_KEY, 'x');
    st.map.set(BACKUP_KEY, 'y');
    expect(loadState(st).source).toBe('default');
  });
  it('reports broken storage without throwing', () => {
    const r = loadState(new BrokenStorage());
    expect(r.storageOk).toBe(false);
    expect(r.source).toBe('default');
    expect(saveState(new BrokenStorage(), defaultState())).toBe(false);
    expect(loadState(null).storageOk).toBe(false);
  });
  it('export/import round-trips', () => {
    const r = importState(exportState(withPlant('z')));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.plants[0].id).toBe('z');
  });
  it('import rejects foreign or broken files', () => {
    expect(importState('nope').ok).toBe(false);
    expect(importState(JSON.stringify({ schemaVersion: 1 })).ok).toBe(false);
    expect(importState(JSON.stringify({ app: 'garten-mathe', schemaVersion: 99 })).ok).toBe(false);
  });
});
