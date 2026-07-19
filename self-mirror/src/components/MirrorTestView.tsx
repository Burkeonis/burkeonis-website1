import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Session, MirrorTestResult } from '../types';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  Cpu, 
  Brain, 
  Lock, 
  AlertOctagon, 
  Skull, 
  Eye, 
  Target, 
  Flame, 
  Compass, 
  Activity, 
  RefreshCw 
} from 'lucide-react';

interface MirrorTestViewProps {
  sessions: Session[];
  savedResult: MirrorTestResult | null;
  onSaveResult: (result: MirrorTestResult) => void;
  onStartCalibration: () => void;
}

export default function MirrorTestView({ 
  sessions, 
  savedResult, 
  onSaveResult,
  onStartCalibration
}: MirrorTestViewProps) {
  const [isCompiling, setIsCompiling] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [compilationError, setCompilationError] = useState<string | null>(null);

  const totalExchanges = sessions.reduce((acc, s) => acc + s.messages.length, 0);
  const isUncalibrated = sessions.length < 3;
  const calibrationProgress = Math.min(Math.round((sessions.length / 3) * 100), 100);

  const loadingSteps = [
    'Synthesizing verbal history...',
    'Mapping defensive avoidance triggers...',
    'Calculating shadow-swap frequencies...',
    'Peeling away curated social projections...',
    'Isolating core Burkeonis contradictions...',
    'Gazing into the Abyss blueprint...'
  ];

  const triggerTestCompilation = async () => {
    setIsCompiling(true);
    setLoadingStep(0);
    setCompilationError(null);

    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < loadingSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 1800);

    try {
      const response = await fetch('/api/self-mirror/mirror-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions })
      });

      if (!response.ok) {
        throw new Error('Analysis request failed.');
      }

      const resultData = await response.json();
      onSaveResult({
        ...resultData,
        createdAt: new Date().toLocaleDateString()
      });
    } catch (err) {
      console.error('Mirror Test failed without generating analysis.', err);
      setCompilationError('Self Mirror could not compile this test. No conclusions were generated. Your reflections remain stored locally.');
    } finally {
      clearInterval(interval);
      setIsCompiling(false);
    }
  };

  const getPanelIcon = (id: string) => {
    switch (id) {
      case 'strongestTrait': return <Sparkles className="w-4 h-4 text-red-500" />;
      case 'repeatingWeakness': return <Skull className="w-4 h-4 text-red-500" />;
      case 'hiddenFear': return <Eye className="w-4 h-4 text-red-500" />;
      case 'avoidancePattern': return <Target className="w-4 h-4 text-red-500" />;
      case 'unrealizedPotential': return <Flame className="w-4 h-4 text-red-500" />;
      case 'nextEvolution': return <Compass className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto px-1 sm:px-3">
      
      {/* Gated Blueprint Not Calibrated View */}
      {isUncalibrated && !isCompiling && (
        <div className="text-center py-12 px-6 bg-[#0e0e0e] border border-white/5 space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.03)_0%,transparent_70%)] pointer-events-none" />
          
          <div className="flex justify-center">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-red-500/10 animate-spin bg-transparent" style={{ animationDuration: '15s' }} />
              <div className="absolute inset-2 rounded-full border-2 border-dashed border-red-500/10 animate-spin" style={{ animationDuration: '30s' }} />
              <div className="absolute inset-4 rounded-full border border-red-500/5 bg-[#050505] flex items-center justify-center">
                <Brain className="w-8 h-8 text-red-500/30" />
              </div>
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <span className="font-mono text-[9px] tracking-widest text-red-500 uppercase font-bold">STATUS UNLOCK REQUIRED</span>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-white uppercase tracking-wider">
              BLUEPRINT NOT CALIBRATED
            </h3>
            <p className="font-sans text-xs text-gray-400 leading-relaxed font-light">
              “The mirror needs repeated evidence before it can build a reliable behavioural blueprint.”
            </p>
          </div>

          {/* Calibration Progress Bar */}
          <div className="max-w-xs mx-auto space-y-2">
            <div className="flex justify-between font-mono text-[9px] text-gray-400">
              <span className="font-bold">PROGRESS</span>
              <span>{calibrationProgress}%</span>
            </div>
            <div className="h-2 bg-black border border-white/5 overflow-hidden">
              <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${calibrationProgress}%` }} />
            </div>
          </div>

          {/* Core Calibration Requirements List */}
          <div className="border border-white/5 py-4 px-5 max-w-sm mx-auto text-left space-y-3 bg-[#0a0a0a]">
            <span className="block font-mono text-[9px] text-gray-400 uppercase tracking-widest font-semibold border-b border-white/5 pb-1">CALIBRATION PROTOCOL</span>
            <ul className="space-y-1.5 font-mono text-[10px] text-gray-300">
              <li className="flex items-center space-x-2">
                <span className={`w-1.5 h-1.5 ${sessions.length >= 3 ? 'bg-green-500' : 'bg-red-500'} shrink-0`} />
                <span>Minimum 3 reflection sessions ({sessions.length}/3 logged)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className={`w-1.5 h-1.5 ${sessions.length > 1 ? 'bg-green-500' : 'bg-gray-500'} shrink-0`} />
                <span>Logs registered on separate timestamps</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-gray-500 shrink-0" />
                <span>Identification of repeating triggers</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-gray-500 shrink-0" />
                <span>Confirmed user observation feedback</span>
              </li>
            </ul>
          </div>

          <button
            onClick={onStartCalibration}
            id="begin-calibration-btn"
            className="min-h-[44px] bg-white hover:bg-red-500 text-black hover:text-white rounded-none px-6 py-3 font-mono text-xs uppercase font-bold tracking-[0.2em] transition-all flex items-center space-x-2 mx-auto cursor-pointer"
          >
            <Flame className="w-4 h-4" />
            <span>BEGIN CALIBRATION</span>
          </button>
        </div>
      )}

      {/* Gated View (When enough sessions exist but not compiled yet) */}
      {!isUncalibrated && !savedResult && !isCompiling && (
        <div className="text-center py-12 px-6 bg-[#0e0e0e] border border-white/5 space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.02)_0%,transparent_70%)] pointer-events-none" />
          
          <div className="flex justify-center">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-red-500/10 animate-spin bg-transparent" style={{ animationDuration: '10s' }} />
              <div className="absolute inset-2 rounded-full border-2 border-dashed border-red-500/20 animate-spin" style={{ animationDuration: '25s' }} />
              <div className="absolute inset-4 rounded-full border border-red-500/5 bg-[#050505] flex items-center justify-center">
                <Brain className="w-8 h-8 text-red-500/40" />
              </div>
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <span className="font-mono text-[9px] tracking-widest text-red-500 uppercase font-bold">CALIBRATION UNLOCKED</span>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-white uppercase tracking-wider">
              THE MIRROR TEST
            </h3>
            <p className="font-sans text-xs text-gray-400 leading-relaxed font-light">
              Based on your accumulated admissions, defenses, and dialogues, the Mirror can compile a permanent blueprint of your psyche.
            </p>
          </div>

          <div className="border-t border-b border-white/5 py-3 max-w-xs mx-auto flex justify-around font-mono text-[10px] text-gray-400">
            <div>
              <span className="block text-white font-bold">{sessions.length}</span>
              SESSIONS
            </div>
            <div className="border-r border-white/5" />
            <div>
              <span className="block text-white font-bold">{totalExchanges}</span>
              EXCHANGES
            </div>
          </div>

          <button
            onClick={triggerTestCompilation}
            disabled={totalExchanges === 0}
            id="start-mirror-test-btn"
            className="min-h-[44px] bg-white hover:bg-red-500 text-black hover:text-white rounded-none px-8 py-3.5 font-mono text-xs uppercase font-bold tracking-[0.2em] transition-all flex items-center space-x-2 mx-auto disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black cursor-pointer"
          >
            <span>INITIATE THE REFLECTION</span>
          </button>
        </div>
      )}

      {compilationError && !isCompiling && (
        <div role="alert" className="border border-red-900/60 bg-red-950/20 p-5 text-sm text-gray-200">
          <strong className="block font-mono text-[10px] uppercase tracking-widest text-red-400">No analysis generated</strong>
          <p className="mt-2 leading-relaxed">{compilationError}</p>
        </div>
      )}

      {/* Loading Screen */}
      {isCompiling && (
        <div className="text-center py-20 px-6 bg-[#0c0c0c] border border-white/5 space-y-6 min-h-[400px] flex flex-col justify-center items-center">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-red-500 animate-ping opacity-20" />
            <div className="absolute inset-1 rounded-full border border-red-500/40 animate-pulse" />
            <div className="absolute inset-2 rounded-full border-2 border-red-500/20" />
            <Cpu className="w-6 h-6 text-red-500 animate-spin" style={{ animationDuration: '4s' }} />
          </div>

          <div className="space-y-2">
            <span className="block font-mono text-[9px] text-red-500 tracking-[0.3em] uppercase font-bold">DECONSTRUCTING EGO</span>
            <h4 className="font-display text-base font-bold text-white uppercase tracking-wider">
              {loadingSteps[loadingStep]}
            </h4>
            <div className="w-44 h-1 bg-black border border-white/5 mx-auto overflow-hidden relative">
              <motion.div 
                className="absolute top-0 bottom-0 left-0 bg-red-500"
                initial={{ width: 0 }}
                animate={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
                transition={{ duration: 1.5 }}
              />
            </div>
            <p className="font-mono text-[9px] text-gray-500 uppercase tracking-widest pt-1">
              Step {loadingStep + 1} of {loadingSteps.length}
            </p>
          </div>
        </div>
      )}

      {/* Compiled Mirror Test Report */}
      {savedResult && !isCompiling && !isUncalibrated && (
        <div className="space-y-6">
          
          {/* Scanner Header Layout */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 border-b border-white/5 pb-6">
            {/* Stunning Hologram Scanning Ring */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 rounded-full border border-red-500/10 animate-ping opacity-20" />
              <div className="absolute inset-1 rounded-full border-t border-b border-red-500/40 animate-spin" style={{ animationDuration: '6s' }} />
              <div className="absolute inset-3 rounded-full border-2 border-dashed border-red-500/15" />
              
              <div className="absolute inset-5 rounded-full bg-black border border-white/5 flex items-center justify-center">
                <span className="text-red-500 font-extralight text-2xl tracking-widest">)(</span>
              </div>
              
              <motion.div 
                className="absolute left-0 right-0 h-[1px] bg-red-500/45"
                animate={{ top: ['10%', '90%', '10%'] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              />
            </div>

            <div className="space-y-3 text-center md:text-left flex-1">
              <div>
                <span className="font-mono text-[9px] tracking-widest text-red-500 uppercase font-bold">SOVEREIGN BLUEPRINT REPORT</span>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-white uppercase tracking-widest mt-1">
                  BLUEPRINT CALIBRATED
                </h2>
                <div className="flex items-center justify-center md:justify-start gap-3 mt-1 text-[9px] font-mono text-gray-500">
                  <span>COMPILED: {savedResult.createdAt}</span>
                  <span>&bull;</span>
                  <span className="text-red-400 font-bold uppercase">CONFIDENCE: {savedResult.confidence}%</span>
                </div>
              </div>
              <p className="font-sans text-xs sm:text-sm text-gray-300 leading-relaxed italic">
                "{savedResult.summaryText}"
              </p>
            </div>
          </div>

          {/* Deep Deconstruction Expandable Grid */}
          <div className="space-y-2.5">
            {[
              { id: 'strongestTrait', label: 'YOUR STRONGEST TRAIT', data: savedResult.strongestTrait },
              { id: 'repeatingWeakness', label: 'YOUR REPEATING WEAKNESS', data: savedResult.repeatingWeakness },
              { id: 'hiddenFear', label: 'YOUR HIDDEN FEAR', data: savedResult.hiddenFear },
              { id: 'avoidancePattern', label: 'YOUR AVOIDANCE PATTERN', data: savedResult.avoidancePattern },
              { id: 'unrealizedPotential', label: 'YOUR UNREALIZED POTENTIAL', data: savedResult.unrealizedPotential },
              { id: 'nextEvolution', label: 'YOUR NEXT EVOLUTION', data: savedResult.nextEvolution }
            ].map((panel) => {
              const isOpen = activePanel === panel.id;
              return (
                <div 
                  key={panel.id}
                  className={`border rounded-none overflow-hidden transition-all duration-300 ${
                    isOpen ? 'border-red-500/30 bg-[#0c0c0c]' : 'border-white/5 bg-[#0e0e0e] hover:border-white/10'
                  }`}
                >
                  <button
                    onClick={() => setActivePanel(isOpen ? null : panel.id)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left cursor-pointer min-h-[44px]"
                  >
                    <div className="flex items-center space-x-3 pr-4">
                      <div className="w-8 h-8 border border-white/5 flex items-center justify-center bg-black/40 shrink-0">
                        {getPanelIcon(panel.id)}
                      </div>
                      <div>
                        <span className="font-mono text-[8px] text-gray-500 uppercase tracking-widest block leading-none mb-1">
                          {panel.label}
                        </span>
                        <h4 className="font-display font-bold text-xs sm:text-sm text-white uppercase tracking-wider">
                          {panel.data?.title || 'Unknown Blueprint'}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="hidden sm:inline font-mono text-[9px] text-gray-500 uppercase tracking-wider">
                        {isOpen ? 'Collapse' : 'Deconstruct'}
                      </span>
                      {isOpen ? <ChevronDown className="w-4 h-4 text-red-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="px-4 pb-4 pt-1 border-t border-white/[0.03] space-y-2 bg-black/30">
                          <p className="text-xs text-red-400 font-mono uppercase tracking-wider font-bold">
                            Summary &bull; {panel.data?.desc}
                          </p>
                          <p className="text-xs text-gray-400 leading-relaxed font-sans font-light">
                            {panel.data?.detail}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Reset button inside Evolution view */}
          <div className="bg-[#121212]/30 border border-white/5 p-4 text-center space-y-3">
            <h4 className="font-display font-bold text-xs text-white uppercase tracking-widest">
              RESET INTENT
            </h4>
            <p className="font-sans text-[11px] text-gray-400 max-w-md mx-auto leading-relaxed font-light">
              Do you wish to dismantle this compiled model and start a new calibration sequence?
            </p>
            <button
              onClick={() => {
                if (confirm('Do you wish to wipe current reflection logs and recalibrate? This cannot be undone.')) {
                  window.location.reload();
                }
              }}
              className="bg-red-950/20 hover:bg-red-600 hover:text-white text-red-400 border border-red-500/20 px-4 py-2 font-mono text-[9px] tracking-widest uppercase transition-all cursor-pointer min-h-[44px]"
            >
              Recalibrate Blueprint
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
