interface ProModeGateProps {
  mode: 'Mediator' | 'Abyss' | 'Builder';
  signedIn: boolean;
  onUpgrade: () => void;
}

export default function ProModeGate({ mode, signedIn, onUpgrade }: ProModeGateProps) {
  return (
    <section className="mx-auto flex min-h-[65vh] max-w-3xl items-center justify-center">
      <div className="w-full border border-amber-800/50 bg-[#0a0b0b] p-8 text-center sm:p-12">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-500">Pro mode locked</span>
        <h2 className="mt-4 font-display text-4xl font-bold uppercase text-white">{mode}</h2>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-gray-400">{signedIn ? 'Your current entitlement does not include this mode.' : 'Sign in to restore an existing subscription or start Self Mirror Pro.'}</p>
        <button className="mt-8 bg-amber-700 px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-white" onClick={onUpgrade}>{signedIn ? 'View Pro access' : 'Sign in / Upgrade'}</button>
      </div>
    </section>
  );
}
