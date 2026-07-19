import { describe, expect, it } from 'vitest';
import { decryptBackup, encryptBackup } from './backup';

describe('encrypted backup', () => {
  it('round-trips local data through authenticated encryption', async () => {
    const data = { name: 'Mirror', sessions: [{ id: 'one', private: 'kept encrypted' }] };
    const encrypted = await encryptBackup(data, 'a-long-test-password');
    expect(encrypted).not.toContain('kept encrypted');
    await expect(decryptBackup(encrypted, 'a-long-test-password')).resolves.toEqual(data);
  });

  it('fails safely with the wrong password', async () => {
    const encrypted = await encryptBackup({ private: true }, 'correct-long-password');
    await expect(decryptBackup(encrypted, 'incorrect-password')).rejects.toThrow('incorrect or the backup is damaged');
  });
});
