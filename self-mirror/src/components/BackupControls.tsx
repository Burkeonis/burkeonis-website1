import { useState } from 'react';
import { decryptBackup, encryptBackup } from '../crypto/backup';
import { loadLocalState, restoreLocalState, type LocalState } from '../storage/database';

export default function BackupControls() {
  const [password, setPassword] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('Passwords are never stored. A forgotten backup password cannot be recovered.');
  const [busy, setBusy] = useState(false);

  const exportData = async () => {
    setBusy(true);
    try {
      const encrypted = await encryptBackup(await loadLocalState(), password);
      const url = URL.createObjectURL(new Blob([encrypted], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `self-mirror-backup-${new Date().toISOString().slice(0, 10)}.smbackup`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus('Encrypted backup created. Keep the file and password separate.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Backup failed.'); }
    finally { setBusy(false); }
  };

  const importData = async () => {
    if (!file) { setStatus('Choose a .smbackup file first.'); return; }
    setBusy(true);
    try {
      const restored = await decryptBackup<LocalState>(await file.text(), password);
      await restoreLocalState(restored);
      setStatus('Encrypted backup restored. Reloading Self Mirror…');
      window.location.reload();
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Restore failed.'); }
    finally { setBusy(false); }
  };

  return (
    <section className="space-y-5 border border-white/10 bg-black/40 p-6">
      <div><span className="font-mono text-[9px] uppercase tracking-widest text-amber-500">Local vault</span><h3 className="mt-2 text-xl font-bold uppercase text-white">Encrypted backup</h3><p className="mt-2 text-xs leading-relaxed text-gray-400">AES-256-GCM encryption with PBKDF2-SHA-256 through the browser Web Crypto API.</p></div>
      <label className="block text-xs text-gray-400">Backup password<input className="mt-2 w-full border border-white/10 bg-[#080909] p-3 text-white" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <div className="flex flex-wrap gap-3"><button disabled={busy || password.length < 12} className="border border-amber-700 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-amber-300 disabled:opacity-40" onClick={() => void exportData()}>Export encrypted backup</button><label className="cursor-pointer border border-white/15 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-gray-300">Choose backup<input className="sr-only" type="file" accept=".smbackup,application/json" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label><button disabled={busy || !file || password.length < 12} className="border border-white/15 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-gray-300 disabled:opacity-40" onClick={() => void importData()}>Restore</button></div>
      <p role="status" className="text-xs leading-relaxed text-gray-400">{status}</p>
    </section>
  );
}
