import { openDB, type DBSchema } from 'idb';
import type { MemoryItem, MirrorTestResult, Session, UserProfile } from '../types';

interface SettingsRecord {
  key: string;
  value: unknown;
}

interface SelfMirrorDatabase extends DBSchema {
  sessions: { key: string; value: Session };
  memory: { key: string; value: MemoryItem };
  settings: { key: string; value: SettingsRecord };
}

const DB_NAME = 'burkeonis-self-mirror';
const DB_VERSION = 1;

const dbPromise = openDB<SelfMirrorDatabase>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions', { keyPath: 'id' });
    if (!db.objectStoreNames.contains('memory')) db.createObjectStore('memory', { keyPath: 'id' });
    if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
  },
});

export interface LocalState {
  name: string;
  sessions: Session[];
  profile: UserProfile | null;
  mirrorTest: MirrorTestResult | null;
  memory: MemoryItem[];
}

const getSetting = async <T>(key: string): Promise<T | null> => {
  const record = await (await dbPromise).get('settings', key);
  return (record?.value as T | undefined) ?? null;
};

const setSetting = async (key: string, value: unknown) => {
  await (await dbPromise).put('settings', { key, value });
};

export async function loadLocalState(): Promise<LocalState> {
  const db = await dbPromise;
  const [sessions, memory, name, profile, mirrorTest] = await Promise.all([
    db.getAll('sessions'),
    db.getAll('memory'),
    getSetting<string>('name'),
    getSetting<UserProfile>('profile'),
    getSetting<MirrorTestResult>('mirrorTest'),
  ]);
  return { name: name ?? '', sessions, profile, mirrorTest, memory };
}

export async function saveSessions(sessions: Session[]) {
  const db = await dbPromise;
  const tx = db.transaction('sessions', 'readwrite');
  await tx.store.clear();
  await Promise.all(sessions.map((session) => tx.store.put(session)));
  await tx.done;
}

export async function saveMemory(memory: MemoryItem[]) {
  const db = await dbPromise;
  const tx = db.transaction('memory', 'readwrite');
  await tx.store.clear();
  await Promise.all(memory.map((item) => tx.store.put(item)));
  await tx.done;
}

export const saveName = (name: string) => setSetting('name', name);
export const saveProfile = (profile: UserProfile) => setSetting('profile', profile);
export const saveMirrorTest = (result: MirrorTestResult | null) => setSetting('mirrorTest', result);
export const saveAppSetting = (key: string, value: unknown) => setSetting(`app:${key}`, value);
export const loadAppSetting = <T>(key: string) => getSetting<T>(`app:${key}`);

export async function clearSelfMirrorData() {
  const db = await dbPromise;
  const tx = db.transaction(['sessions', 'memory', 'settings'], 'readwrite');
  await Promise.all([
    tx.objectStore('sessions').clear(),
    tx.objectStore('memory').clear(),
    tx.objectStore('settings').clear(),
  ]);
  await tx.done;
}

export async function restoreLocalState(state: LocalState) {
  await clearSelfMirrorData();
  await Promise.all([
    saveSessions(state.sessions ?? []),
    saveMemory(state.memory ?? []),
    saveName(state.name ?? ''),
    state.profile ? saveProfile(state.profile) : Promise.resolve(),
    saveMirrorTest(state.mirrorTest ?? null),
  ]);
}

export async function migrateLegacyLocalStorage() {
  const migrated = await getSetting<boolean>('legacyMigrationComplete');
  if (migrated) return;
  try {
    const sessions = JSON.parse(localStorage.getItem('self_mirror_sessions') ?? '[]') as Session[];
    const memory = JSON.parse(localStorage.getItem('self_mirror_memory') ?? '[]') as MemoryItem[];
    const profile = JSON.parse(localStorage.getItem('self_mirror_profile') ?? 'null') as UserProfile | null;
    const mirrorTest = JSON.parse(localStorage.getItem('self_mirror_test') ?? 'null') as MirrorTestResult | null;
    const name = localStorage.getItem('self_mirror_name') ?? '';
    if (sessions.length) await saveSessions(sessions);
    if (memory.length) await saveMemory(memory);
    if (profile) await saveProfile(profile);
    if (mirrorTest) await saveMirrorTest(mirrorTest);
    if (name) await saveName(name);
    for (const key of ['self_mirror_sessions', 'self_mirror_memory', 'self_mirror_profile', 'self_mirror_test', 'self_mirror_name']) {
      localStorage.removeItem(key);
    }
  } finally {
    await setSetting('legacyMigrationComplete', true);
  }
}
