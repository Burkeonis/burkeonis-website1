import { useEffect, useState } from 'react';
import { loadAppSetting, saveAppSetting } from '../storage/database';
import { OllamaProvider } from '../providers/ollamaProvider';
import { byokVault } from '../providers/byokVault';

export default function LocalAiSettings() {
  const [mode, setMode] = useState<'cloud' | 'ollama' | 'byok'>('cloud');
  const [baseUrl, setBaseUrl] = useState('http://localhost:11434');
  const [model, setModel] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [status, setStatus] = useState('Cloud AI selected. Active entries are sent to the Burkeonis Worker.');
  const [busy, setBusy] = useState(false);
  const [byokBaseUrl, setByokBaseUrl] = useState('https://api.openai.com/v1');
  const [byokModel, setByokModel] = useState('');
  const [byokKey, setByokKey] = useState('');

  useEffect(() => { void (async () => {
    setMode(await loadAppSetting<'cloud' | 'ollama' | 'byok'>('processingMode') ?? 'cloud');
    setBaseUrl(await loadAppSetting<string>('ollamaBaseUrl') ?? 'http://localhost:11434');
    setModel(await loadAppSetting<string>('ollamaModel') ?? '');
    setByokBaseUrl(await loadAppSetting<string>('byokBaseUrl') ?? 'https://api.openai.com/v1');
    setByokModel(await loadAppSetting<string>('byokModel') ?? '');
  })(); }, []);

  const chooseMode = async (next: 'cloud' | 'ollama' | 'byok') => {
    await saveAppSetting('processingMode', next);
    setMode(next);
    setStatus(next === 'ollama'
      ? 'Local AI selected. Self Mirror will not silently switch to cloud AI.'
      : next === 'byok'
        ? 'Bring Your Own Key selected. The key stays in memory for this tab and is sent directly to the chosen provider.'
        : 'Cloud AI selected. Active entries are sent to the Burkeonis Worker.');
  };

  const test = async () => {
    setBusy(true);
    setStatus('Testing Ollama on this device…');
    try {
      const found = await new OllamaProvider({ baseUrl, model: model || 'unused' }).testConnection();
      const names = found.map((item) => item.name);
      setModels(names);
      if (!model && names[0]) { setModel(names[0]); await saveAppSetting('ollamaModel', names[0]); }
      await saveAppSetting('ollamaBaseUrl', baseUrl);
      setStatus(names.length ? `Connected. ${names.length} local model${names.length === 1 ? '' : 's'} found.` : 'Ollama connected, but no models are installed.');
    } catch {
      setStatus('Could not connect. Install Ollama, start it, and allow this website origin. No cloud request was made.');
    } finally { setBusy(false); }
  };

  return (
    <section className="space-y-5 border border-white/10 bg-black/40 p-6">
      <div><span className="font-mono text-[9px] uppercase tracking-widest text-amber-500">Processing mode</span><h3 className="mt-2 text-xl font-bold uppercase text-white">Cloud or local</h3></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <button aria-pressed={mode === 'cloud'} className={`border p-4 text-left ${mode === 'cloud' ? 'border-amber-600 bg-amber-950/20' : 'border-white/10'}`} onClick={() => void chooseMode('cloud')}><strong className="block text-white">Burkeonis Cloud</strong><span className="mt-1 block text-xs text-gray-400">Uses cloud quota. Active context leaves this device.</span></button>
        <button aria-pressed={mode === 'ollama'} className={`border p-4 text-left ${mode === 'ollama' ? 'border-amber-600 bg-amber-950/20' : 'border-white/10'}`} onClick={() => void chooseMode('ollama')}><strong className="block text-white">Ollama Local</strong><span className="mt-1 block text-xs text-gray-400">Runs on your computer. Never silently falls back.</span></button>
        <button aria-pressed={mode === 'byok'} className={`border p-4 text-left ${mode === 'byok' ? 'border-amber-600 bg-amber-950/20' : 'border-white/10'}`} onClick={() => void chooseMode('byok')}><strong className="block text-white">Use My Key</strong><span className="mt-1 block text-xs text-gray-400">Session-only key. Direct provider request.</span></button>
      </div>
      <label className="block text-xs text-gray-400">Ollama address<input className="mt-2 w-full border border-white/10 bg-[#080909] p-3 text-white" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} /></label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button disabled={busy} className="border border-amber-700 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-amber-300 disabled:opacity-50" onClick={() => void test()}>Test connection</button>
        <select aria-label="Ollama model" className="flex-1 border border-white/10 bg-[#080909] p-3 text-white" value={model} onChange={(e) => { setModel(e.target.value); void saveAppSetting('ollamaModel', e.target.value); }}><option value="">Select local model</option>{models.map((name) => <option key={name} value={name}>{name}</option>)}</select>
      </div>
      <p role="status" className="text-xs leading-relaxed text-gray-400">{status}</p>
      <div className="space-y-3 border-t border-white/10 pt-5">
        <p className="text-xs leading-relaxed text-gray-400">BYOK supports OpenAI-compatible endpoints. Keys are held only in memory, disappear on reload, and are never stored in IndexedDB or sent to Burkeonis.</p>
        <input aria-label="BYOK provider base URL" className="w-full border border-white/10 bg-[#080909] p-3 text-white" value={byokBaseUrl} onChange={(e) => { setByokBaseUrl(e.target.value); void saveAppSetting('byokBaseUrl', e.target.value); }} />
        <input aria-label="BYOK model" placeholder="Model name" className="w-full border border-white/10 bg-[#080909] p-3 text-white" value={byokModel} onChange={(e) => { setByokModel(e.target.value); void saveAppSetting('byokModel', e.target.value); }} />
        <input aria-label="Session-only API key" placeholder="Session-only API key" type="password" autoComplete="off" className="w-full border border-white/10 bg-[#080909] p-3 text-white" value={byokKey} onChange={(e) => { setByokKey(e.target.value); byokVault.set(e.target.value); }} />
        <button className="border border-white/15 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-gray-300" onClick={() => { byokVault.clear(); setByokKey(''); setStatus('Session-only API key cleared.'); }}>Clear session key</button>
      </div>
    </section>
  );
}
