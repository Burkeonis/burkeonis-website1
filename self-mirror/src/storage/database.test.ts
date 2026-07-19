import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearSelfMirrorData, loadLocalState, saveName, saveSessions } from './database';

const unrelatedStorage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => unrelatedStorage.get(key) ?? null,
    setItem: (key: string, value: string) => unrelatedStorage.set(key, value),
    removeItem: (key: string) => unrelatedStorage.delete(key),
  },
});

describe('local database', () => {
  beforeEach(async () => clearSelfMirrorData());

  it('stores conversation sessions in IndexedDB', async () => {
    await saveName('Local subject');
    await saveSessions([{ id: 'session-1', title: 'Test', date: 'today', messages: [], mode: 'mirror' }]);
    const state = await loadLocalState();
    expect(state.name).toBe('Local subject');
    expect(state.sessions).toHaveLength(1);
  });

  it('deletes only Self Mirror database data', async () => {
    localStorage.setItem('unrelated_application', 'preserve');
    await saveName('Delete me');
    await clearSelfMirrorData();
    expect((await loadLocalState()).name).toBe('');
    expect(localStorage.getItem('unrelated_application')).toBe('preserve');
  });
});
