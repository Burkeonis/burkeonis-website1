import React from 'react';
import { motion } from 'motion/react';
import { Session, UserProfile } from '../types';
import { 
  Compass, 
  Activity, 
  RefreshCw, 
  Zap, 
  ChevronRight, 
  Flame, 
  Layers, 
  Calendar,
  AlertTriangle,
  Database,
  Search,
  Eye,
  Plus
} from 'lucide-react';

interface DashboardProps {
  userProfile: UserProfile;
  sessions: Session[];
  onSelectSession: (id: string) => void;
  onStartNewSession: () => void;
  onNavigateToAbyss: () => void;
}

export default function Dashboard({ 
  userProfile, 
  sessions, 
  onSelectSession, 
  onStartNewSession,
  onNavigateToAbyss
}: DashboardProps) {
  
  const isEmpty = sessions.length === 0;

  // Compute stats dynamically from sessions rather than using dummy defaults
  const totalReflections = sessions.length;
  
  // Calculate counts based on real session logs (meta triggers, reactions)
  const triggersList = sessions.flatMap(s => 
    s.messages.flatMap(m => m.meta?.contradiction ? [{ text: `Contradiction: ${m.meta.contradiction}`, date: s.date }] : [])
  );
  
  const shadowSwapsList = sessions.flatMap(s => 
    s.messages.flatMap(m => m.meta?.shadowPattern ? [s.messages.map(msg => msg.meta?.shadowPattern).filter(Boolean)] : [])
  ).flat();

  // Find the latest contradiction from real assistant messages
  const getLatestContradiction = () => {
    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      for (let j = session.messages.length - 1; j >= 0; j--) {
        const msg = session.messages[j];
        if (msg.role === 'assistant' && msg.meta && msg.meta.contradiction) {
          return {
            text: msg.meta.contradiction,
            sessionId: session.id,
            sessionTitle: session.title
          };
        }
      }
    }
    return null;
  };

  const latestContradiction = getLatestContradiction();

  // Color helper for Defense Intensity
  const getIntensityColor = (score: number) => {
    if (score >= 75) return 'text-red-500 border-red-500/30';
    if (score >= 50) return 'text-amber-500 border-amber-500/30';
    return 'text-green-500 border-green-500/30';
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto px-1 sm:px-3">
      
      {/* Welcome & Action Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
        <div>
          <span className="font-mono text-[10px] tracking-widest text-red-500 uppercase">CALIBRATING INTERFACE</span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white uppercase mt-0.5">
            {userProfile.name ? userProfile.name : 'THE SUBJECT'}.
          </h2>
          <p className="font-sans text-xs text-gray-400 mt-1">Ready to face the truth?</p>
        </div>
        
        <button
          onClick={onStartNewSession}
          id="new-reflection-btn"
          className="w-full sm:w-auto min-h-[44px] bg-red-950/20 hover:bg-red-500/20 text-red-400 hover:text-white border border-red-500/30 hover:border-red-500 px-6 py-2.5 font-mono text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Flame className="w-4 h-4 shrink-0" />
          <span>NEW REFLECTION</span>
        </button>
      </div>

      {/* True First-Run State Hero Grid */}
      {isEmpty ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Zero-Memory Panel */}
          <div className="md:col-span-2 bg-[#0c0c0c] border border-white/5 p-5 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.03)_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500/40" />
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-500/80 animate-pulse" />
                <span className="font-mono text-[9px] tracking-wider text-red-500 uppercase font-bold">SELF MIRROR ENGINE v1.0</span>
              </div>
              
              <div className="space-y-1.5">
                <h3 className="font-display text-xl font-bold tracking-wider text-white">SYSTEM ONLINE</h3>
                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  “The mirror has no opinion yet. Give it something real.”
                </p>
              </div>

              {/* Requirements & Info */}
              <div className="pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="block font-mono text-[9px] text-gray-400 uppercase tracking-wider">Calibration Phase</span>
                  <p className="text-xs text-gray-300 font-sans font-light">
                    Minimum 3 guided reflections are recommended to calibrate your behavioral blueprint.
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="block font-mono text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Privacy Policy</span>
                  <p className="text-xs text-gray-300 font-sans font-light">
                    All inputs are stored locally on your device unless wiped manually via the Memory console.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={onStartNewSession}
                id="start-first-reflection-btn"
                className="w-full min-h-[44px] bg-white hover:bg-red-500 text-black hover:text-white font-mono text-xs uppercase font-bold tracking-widest transition-all py-3 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>BEGIN FIRST REFLECTION</span>
              </button>
            </div>
          </div>

          {/* Zero-Memory Stats Column */}
          <div className="bg-[#0e0e0e] border border-white/5 p-5 space-y-4 flex flex-col justify-between">
            <div>
              <span className="font-mono text-[9px] tracking-widest text-red-500 uppercase block mb-3 font-semibold">METRIC CALIBRATION</span>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-white/[0.03] pb-2">
                  <span className="text-gray-400 uppercase tracking-tight">Identity:</span>
                  <span className="text-white font-bold tracking-wider">{userProfile.name ? userProfile.name : 'UNKNOWN'}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.03] pb-2">
                  <span className="text-gray-400 uppercase tracking-tight">Memory:</span>
                  <span className="text-red-400 font-bold tracking-wider">EMPTY</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.03] pb-2">
                  <span className="text-gray-400 uppercase tracking-tight">Reflections:</span>
                  <span className="text-white">0</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.03] pb-2">
                  <span className="text-gray-400 uppercase tracking-tight">Patterns:</span>
                  <span className="text-white">0</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.03] pb-2">
                  <span className="text-gray-400 uppercase tracking-tight">Contradictions:</span>
                  <span className="text-white">0</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.03] pb-2">
                  <span className="text-gray-400 uppercase tracking-tight">Recognized Triggers:</span>
                  <span className="text-gray-400">NONE</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.03] pb-2">
                  <span className="text-gray-400 uppercase tracking-tight">Defense Model:</span>
                  <span className="text-red-500/70 font-bold text-[10px]">INSUFFICIENT DATA</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.03] pb-2">
                  <span className="text-gray-400 uppercase tracking-tight">Blueprint Status:</span>
                  <span className="text-red-500/70 font-bold text-[10px]">NOT CALIBRATED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 uppercase tracking-tight">Confidence:</span>
                  <span className="text-white font-bold">0%</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 leading-relaxed font-sans font-light italic border-t border-white/5 pt-3">
              "No personal assumptions, no preloaded behaviors. Your self-honesty is the sole curator of this mirror."
            </p>
          </div>
        </div>
      ) : (
        /* Today's Reflection Active Panel */
        latestContradiction && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-[#0e0e0e] border border-white/5 rounded-none p-5 overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.05)_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
            
            <span className="font-mono text-[9px] tracking-widest text-gray-400 uppercase font-bold">TODAY'S CONTRADICTION REFLECTION</span>
            
            <h3 className="font-display text-md sm:text-lg font-medium text-white leading-relaxed mt-3 mb-4">
              "{latestContradiction.text}"
            </h3>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-white/5 pt-3 gap-2">
              <span className="font-mono text-[9px] text-red-500 uppercase tracking-wider font-semibold">
                BURKEONIS DOCTRINE &bull; PERSISTING PATTERN
              </span>
              <button
                onClick={() => onSelectSession(latestContradiction.sessionId!)}
                className="text-white hover:text-red-500 font-mono text-xs tracking-wider flex items-center space-x-1 group/btn transition-colors cursor-pointer min-h-[44px]"
              >
                <span>Revisit Reflection Log</span>
                <ChevronRight className="w-3.5 h-3.5 transform group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )
      )}

      {/* Pattern Overview Cards Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <h4 className="font-mono text-[9px] tracking-[0.2em] text-gray-400 uppercase font-bold">
            PATTERN OVERVIEW
          </h4>
          <span className="font-mono text-[9px] text-gray-400 uppercase font-semibold">EVIDENCE STATS</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Repeating Triggers', count: userProfile.repeatingTriggersCount, icon: Compass },
            { label: 'Emotional Reactions', count: userProfile.emotionalReactionsCount, icon: Activity },
            { label: 'Core Patterns', count: userProfile.corePatternsCount, icon: RefreshCw },
            { label: 'Breakthroughs', count: userProfile.breakthroughsCount, icon: Zap }
          ].map((stat, i) => (
            <div key={i} className="bg-[#121212]/50 border border-white/5 p-3 flex flex-col justify-between min-h-[90px]">
              <div className="flex justify-between items-start">
                <span className="font-sans text-xs text-gray-400 leading-snug pr-2 font-medium">{stat.label}</span>
                <stat.icon className="w-4 h-4 text-red-500/50" />
              </div>
              <span className="text-2xl font-display font-bold text-white mt-1">{stat.count}</span>
            </div>
          ))}
        </div>

        {isEmpty && (
          <div className="text-center py-4 text-gray-400 bg-[#0c0c0c]/40 border border-dashed border-white/5 p-4">
            <p className="text-xs font-mono text-gray-400">No patterns detected yet.</p>
            <p className="text-[10px] text-gray-400 mt-1">Patterns appear only after repeated evidence.</p>
          </div>
        )}
      </div>

      {/* Layout Split: Recent Entries & Shadow Swaps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Entries List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h4 className="font-mono text-[9px] tracking-[0.2em] text-gray-400 uppercase font-bold">
              RECENT REFLECTIONS
            </h4>
            {!isEmpty && (
              <span className="font-mono text-[9px] text-gray-400 hover:text-red-400 transition-colors cursor-pointer font-bold" onClick={onNavigateToAbyss}>
                EXPLORE TOPICS
              </span>
            )}
          </div>

          {isEmpty ? (
            <div className="bg-[#0e0e0e] border border-dashed border-white/5 p-8 text-center space-y-4">
              <p className="text-xs text-gray-400 font-sans">No reflections yet.</p>
              <button
                onClick={onStartNewSession}
                className="mx-auto min-h-[44px] bg-white hover:bg-red-500 text-black hover:text-white rounded-none px-6 py-2.5 font-mono text-xs uppercase font-bold tracking-widest transition-all cursor-pointer"
              >
                START FIRST REFLECTION
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div 
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className="bg-[#0e0e0e] hover:bg-[#141414] border border-white/5 hover:border-red-500/20 p-3.5 transition-all duration-300 flex justify-between items-center cursor-pointer group"
                >
                  <div className="space-y-1 flex-1 pr-4">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-display font-medium text-sm text-white group-hover:text-red-400 transition-colors">
                        {session.title || 'Untitled Reflection'}
                      </span>
                      {session.activeAbyssTopic && (
                        <span className="font-mono text-[8px] tracking-widest text-red-500/85 border border-red-500/20 px-1.5 py-0.5 uppercase bg-red-950/10">
                          {session.activeAbyssTopic}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-[10px] text-gray-400 font-mono space-x-4">
                      <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {session.date}</span>
                      {session.messages.length > 0 && (
                        <span>{session.messages.length} Exchange{session.messages.length > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {session.intensityMax && (
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[9px] text-gray-400 font-mono uppercase tracking-wider mb-0.5 font-bold">DEFENSIVENESS</span>
                        <div className={`border rounded-none px-2 py-0.5 text-[10px] font-mono font-bold ${getIntensityColor(session.intensityMax)}`}>
                          {session.intensityMax}%
                        </div>
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shadow Swaps & Recent Triggers Panel */}
        <div className="space-y-5">
          
          {/* Recent Triggers */}
          <div className="space-y-3">
            <div className="border-b border-white/5 pb-2">
              <h4 className="font-mono text-[9px] tracking-[0.2em] text-gray-400 uppercase font-bold">
                RECOGNIZED TRIGGERS
              </h4>
            </div>

            <div className="bg-[#0e0e0e] border border-white/5 p-4 rounded-none">
              {userProfile.recentTriggers.length === 0 ? (
                <div className="space-y-1 text-center py-2">
                  <p className="text-xs text-gray-400 font-sans">None detected.</p>
                  <p className="text-[10px] text-gray-400 font-sans leading-relaxed font-light">
                    Triggers are only added after repeated or explicitly confirmed evidence.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {userProfile.recentTriggers.map((trigger, i) => (
                    <div key={i} className="space-y-1 pb-2 border-b border-white/5 last:border-0 last:pb-0">
                      <div className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 bg-red-500 mt-1.5 shrink-0" />
                        <span className="text-xs text-gray-300 font-sans leading-relaxed">{trigger.text}</span>
                      </div>
                      <span className="block text-[8px] font-mono text-gray-400 pl-3.5 uppercase">{trigger.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Shadow Swaps Panel */}
          <div className="space-y-3">
            <div className="border-b border-white/5 pb-2">
              <h4 className="font-mono text-[9px] tracking-[0.2em] text-gray-400 uppercase font-bold">
                WOUND vs. WEAPON (SWAPS)
              </h4>
            </div>

            {userProfile.shadowSwaps.length === 0 ? (
              <div className="bg-[#0e0e0e] border border-white/5 p-4 rounded-none text-center space-y-1.5">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">NOT ENOUGH DATA</p>
                <p className="text-[10px] text-gray-400 font-sans leading-relaxed font-light">
                  Complete reflections before Self Mirror can compare underlying wounds with protective behaviour.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {userProfile.shadowSwaps.map((swap, i) => (
                  <div key={i} className="bg-[#121212]/30 border border-white/5 p-3 relative overflow-hidden">
                    <div className="flex items-center text-[9px] font-mono text-red-500 mb-1.5 uppercase tracking-widest font-semibold">
                      <AlertTriangle className="w-3 h-3 mr-1 text-red-500" />
                      {swap.context}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="border-r border-white/5 pr-2">
                        <span className="text-[9px] text-gray-400 uppercase block font-semibold">Underlying Wound</span>
                        <span className="text-gray-300 font-sans mt-0.5 block leading-tight text-[11px]">{swap.wound}</span>
                      </div>
                      <div className="pl-1">
                        <span className="text-[9px] text-red-500 block font-semibold">Active Weapon</span>
                        <span className="text-white font-sans mt-0.5 block leading-tight text-[11px] font-medium">{swap.weapon}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
