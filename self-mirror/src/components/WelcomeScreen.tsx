import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Eye, ShieldAlert, ArrowRight, UserX } from 'lucide-react';

interface WelcomeScreenProps {
  onEnter: (userName: string) => void;
}

export default function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
  const [name, setName] = useState('');
  const [isEntering, setIsEntering] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim();
    setIsEntering(true);
    setTimeout(() => {
      onEnter(finalName || 'The subject'); // Use neutral fallback if empty
    }, 800);
  };

  const handleSkip = () => {
    setIsEntering(true);
    setTimeout(() => {
      onEnter('The subject'); // Skipped Name
    }, 800);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#050505] overflow-hidden px-4 py-12">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-40" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isEntering ? { opacity: 0, y: -20 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-md w-full text-center z-10"
      >
        {/* The elegant split circle logo shown in the mockup */}
        <div className="flex justify-center mb-8">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-full border border-red-500/10 animate-ping opacity-30" />
            <div className="absolute inset-1 rounded-full border border-red-500/20" />
            {/* The split brackets symbol from the mockups */}
            <div className="text-4xl font-light text-red-500/90 tracking-widest flex items-center">
              <span className="text-red-500 font-extralight text-5xl mr-2 transform rotate-180">)</span>
              <span className="text-red-500 font-extralight text-5xl ml-2">(</span>
            </div>
          </div>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-widest text-white mb-2 uppercase">
          SELF MIRROR
        </h1>
        <p className="font-mono text-xs tracking-[0.3em] text-red-500 mb-8 uppercase">
          SEE. UNDERSTAND. EVOLVE.
        </p>

        <div className="border-t border-b border-white/5 py-6 px-4 mb-8 bg-black/30 backdrop-blur-sm">
          <p className="text-gray-400 font-sans leading-relaxed text-sm">
            "The mirror doesn't tell you what you want to hear.
            <br />
            It shows you <span className="text-white font-medium">who you are</span> meant to become."
          </p>
        </div>

        <div className="space-y-6">
          <div className="text-left space-y-2">
            <label className="block font-mono text-[10px] tracking-widest text-gray-400 uppercase text-center mb-2">
              What should the mirror call you?
            </label>
            <input
              type="text"
              id="name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#121212] border border-white/10 rounded-none px-4 py-3 font-display text-white focus:outline-none focus:border-red-500/50 transition-colors text-center uppercase tracking-widest text-sm"
              placeholder="ENTER A NAME OR ALIAS"
              maxLength={20}
            />
            <p className="text-[9px] font-mono text-gray-500 text-center tracking-wide">
              You can enter your name, use an alias, or skip below to remain anonymous.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleSubmit}
              id="enter-abyss-btn"
              disabled={!name.trim()}
              className="w-full bg-white hover:bg-red-500 text-black hover:text-white rounded-none py-4 font-mono text-xs tracking-[0.2em] uppercase font-bold transition-all duration-300 flex items-center justify-center space-x-2 border border-white hover:border-red-500 group cursor-pointer disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-black disabled:hover:border-white"
            >
              <span>CONFIRM IDENTITY</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={handleSkip}
              id="skip-identity-btn"
              className="w-full bg-transparent hover:bg-white/5 text-gray-400 hover:text-white rounded-none py-3 font-mono text-[10px] tracking-[0.15em] uppercase transition-all flex items-center justify-center space-x-2 border border-white/10 cursor-pointer"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>SKIP / REMAIN ANONYMOUS</span>
            </button>
          </div>
        </div>

        <p className="mt-8 font-mono text-[9px] text-gray-600 tracking-wider">
          I'LL FACE MYSELF &bull; BURKEONIS DOCTRINE
        </p>
      </motion.div>
    </div>
  );
}

