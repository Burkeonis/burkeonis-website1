import { useEffect, useState } from 'react';
import { loadAppSetting, saveAppSetting } from '../storage/database';

export default function AccessibilityPrivacy() {
  const [dyslexia, setDyslexia] = useState(false);
  useEffect(() => { void loadAppSetting<boolean>('dyslexiaMode').then((enabled) => {
    const value = enabled ?? false;
    setDyslexia(value);
    document.documentElement.classList.toggle('dyslexia-mode', value);
  }); }, []);

  const toggle = async () => {
    const next = !dyslexia;
    setDyslexia(next);
    document.documentElement.classList.toggle('dyslexia-mode', next);
    await saveAppSetting('dyslexiaMode', next);
  };

  return (
    <section className="space-y-5 border border-white/10 bg-black/40 p-6">
      <div><span className="font-mono text-[9px] uppercase tracking-widest text-amber-500">Privacy / Access</span><h3 className="mt-2 text-xl font-bold uppercase text-white">Readable. Local. Explicit.</h3></div>
      <button role="switch" aria-checked={dyslexia} className="flex w-full items-center justify-between border border-white/10 p-4 text-left" onClick={() => void toggle()}><span><strong className="block text-white">Dyslexia-friendly typography</strong><small className="mt-1 block text-gray-400">Wider spacing, simpler letterforms and reduced visual compression.</small></span><span className={dyslexia ? 'text-amber-400' : 'text-gray-600'}>{dyslexia ? 'ON' : 'OFF'}</span></button>
      <dl className="grid gap-3 text-xs sm:grid-cols-2"><div className="border border-white/5 p-4"><dt className="uppercase tracking-widest text-gray-500">Stored here</dt><dd className="mt-2 leading-relaxed text-gray-300">Conversations, memory, settings and Mirror Test results in IndexedDB.</dd></div><div className="border border-white/5 p-4"><dt className="uppercase tracking-widest text-gray-500">Leaves device</dt><dd className="mt-2 leading-relaxed text-gray-300">Only active request context when Cloud or BYOK is selected. Ollama stays local.</dd></div></dl>
    </section>
  );
}
