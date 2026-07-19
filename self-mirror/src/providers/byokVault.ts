let volatileKey = '';

export const byokVault = {
  set(key: string) { volatileKey = key; },
  get() { return volatileKey; },
  clear() { volatileKey = ''; },
  has() { return volatileKey.length > 0; },
};
