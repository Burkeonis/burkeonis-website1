import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MemoryItem, UserProfile } from '../types';
import { 
  Database, 
  Trash2, 
  Edit3, 
  EyeOff, 
  Eye, 
  Check, 
  X, 
  AlertOctagon, 
  TrendingUp, 
  Plus, 
  ShieldAlert, 
  RefreshCw, 
  Search,
  BookOpen
} from 'lucide-react';

interface MemoryConsoleProps {
  memoryItems: MemoryItem[];
  userProfile: UserProfile;
  onUpdateMemoryItem: (item: MemoryItem) => void;
  onDeleteMemoryItem: (id: string) => void;
  onToggleMemoryTracking: (enabled: boolean) => void;
  onClearAllData: () => void;
}

export default function MemoryConsole({
  memoryItems,
  userProfile,
  onUpdateMemoryItem,
  onDeleteMemoryItem,
  onToggleMemoryTracking,
  onClearAllData
}: MemoryConsoleProps) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editWhySaved, setEditWhySaved] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const handleStartEdit = (item: MemoryItem) => {
    setEditingItemId(item.id);
    setEditContent(item.content);
    setEditWhySaved(item.whySaved);
  };

  const handleSaveEdit = (item: MemoryItem) => {
    onUpdateMemoryItem({
      ...item,
      content: editContent,
      whySaved: editWhySaved
    });
    setEditingItemId(null);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'trigger': return 'RECOGNIZED TRIGGER';
      case 'contradiction': return 'CONTRADICTION LOG';
      case 'shadow-swap': return 'PSYCHE SWAP';
      case 'observation': return 'VERIFIED OBSERVATION';
      case 'pattern': return 'REPEATING PATTERN';
      default: return 'LOG';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trigger': return <TrendingUp className="w-4 h-4 text-amber-500" />;
      case 'contradiction': return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case 'shadow-swap': return <RefreshCw className="w-4 h-4 text-indigo-400" />;
      case 'observation': return <Check className="w-4 h-4 text-green-400" />;
      default: return <Database className="w-4 h-4 text-gray-400" />;
    }
  };

  const filteredItems = memoryItems.filter(item => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto px-1 sm:px-3">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="font-mono text-[10px] tracking-widest text-red-500 uppercase">DIGITAL FOOTPRINT CONTROL</span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white uppercase mt-0.5">
            MEMORY CONSOLE
          </h2>
          <p className="font-sans text-xs text-gray-400 mt-1">Audit, edit, or purge the behavioral evidence registered by the mirror.</p>
        </div>

        {/* Toggle Tracking */}
        <button
          onClick={() => onToggleMemoryTracking(!userProfile.isMemoryEnabled)}
          className={`min-h-[44px] px-4 py-2.5 font-mono text-[10px] tracking-wider uppercase border transition-all flex items-center space-x-2 cursor-pointer ${
            userProfile.isMemoryEnabled 
              ? 'bg-red-950/10 hover:bg-red-950/20 text-red-400 border-red-500/30 hover:border-red-500' 
              : 'bg-[#121212] hover:bg-[#1a1a1a] text-gray-400 border-white/10'
          }`}
        >
          {userProfile.isMemoryEnabled ? (
            <>
              <Eye className="w-4 h-4" />
              <span>TRACKING: ACTIVE</span>
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4" />
              <span>TRACKING: PAUSED</span>
            </>
          )}
        </button>
      </div>

      {/* Security notice / Warning */}
      <div className="bg-[#0b0b0b] border border-white/5 p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.02)_0%,transparent_70%)] pointer-events-none" />
        <div className="flex items-start space-x-3">
          <AlertOctagon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-mono text-[10px] tracking-widest text-white uppercase font-bold">SOVEREIGN PRIVACY STATEMENT</h4>
            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              Self Mirror operates on local client persistence. The AI model receives historical logs only to prevent repetitive loops. It does not store personal datasets on external servers. Wiping data here clears your record completely.
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Counters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
          {[
            { id: 'all', label: `ALL (${memoryItems.length})` },
            { id: 'observation', label: `VERIFIED (${memoryItems.filter(m => m.type === 'observation').length})` },
            { id: 'trigger', label: `TRIGGERS (${memoryItems.filter(m => m.type === 'trigger').length})` },
            { id: 'contradiction', label: `CONTRADICTIONS (${memoryItems.filter(m => m.type === 'contradiction').length})` },
            { id: 'shadow-swap', label: `SWAPS (${memoryItems.filter(m => m.type === 'shadow-swap').length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 transition-all border cursor-pointer ${
                filterType === tab.id 
                  ? 'bg-white text-black border-white font-bold' 
                  : 'bg-transparent text-gray-400 border-white/5 hover:border-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Clear all triggers */}
        <button
          onClick={() => setShowClearConfirm(true)}
          className="min-h-[40px] bg-red-950/20 hover:bg-red-600 hover:text-white border border-red-500/20 text-red-400 px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer"
        >
          CLEAR ALL DATA
        </button>
      </div>

      {/* Wipe Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0e0e0e] border border-red-500/30 max-w-md w-full p-6 text-center space-y-6">
            <div className="w-12 h-12 bg-red-950/30 border border-red-500/40 rounded-full flex items-center justify-center mx-auto">
              <AlertOctagon className="w-6 h-6 text-red-500" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider">PURGE ENTIRE RECORD?</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                This will erase your name, diagnostic blueprint, all historical dialogue reflection logs, and verified memory traits. Your experience will completely reset to the onboarding phase. This cannot be undone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="min-h-[44px] border border-white/10 text-gray-400 hover:text-white font-mono text-xs uppercase py-2.5 cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  onClearAllData();
                }}
                className="min-h-[44px] bg-red-600 hover:bg-red-700 text-white font-mono text-xs uppercase py-2.5 font-bold cursor-pointer"
              >
                YES, PURGE RECORD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Memory Items List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-[#0c0c0c] border border-dashed border-white/5 space-y-3">
          <Database className="w-8 h-8 text-gray-600 mx-auto" />
          <div className="space-y-1">
            <p className="text-xs font-mono text-gray-400 uppercase font-bold">ZERO MEMORY DETECTED</p>
            <p className="text-[10px] text-gray-400 font-sans max-w-xs mx-auto leading-relaxed">
              No memory slots are calibrated yet. Start a reflection log to generate evidence entries.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-[#0e0e0e] border border-white/5 p-4 space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(item.type)}
                  <span className="font-mono text-[9px] text-red-500 uppercase tracking-widest font-bold">
                    {getTypeLabel(item.type)}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleStartEdit(item)}
                    className="p-1.5 text-gray-500 hover:text-white transition-colors cursor-pointer"
                    title="Edit Item"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this specific memory?')) {
                        onDeleteMemoryItem(item.id);
                      }
                    }}
                    className="p-1.5 text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {editingItemId === item.id ? (
                /* Edit Mode */
                <div className="space-y-3 border-t border-white/5 pt-3">
                  <div className="space-y-1">
                    <label className="block font-mono text-[8px] text-gray-500 uppercase">Extracted Evidence Content</label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-black border border-white/10 p-2 text-xs text-white focus:outline-none focus:border-red-500/50 resize-none min-h-[60px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-mono text-[8px] text-gray-500 uppercase">Reason Saved / Calibration Source</label>
                    <input
                      type="text"
                      value={editWhySaved}
                      onChange={(e) => setEditWhySaved(e.target.value)}
                      className="w-full bg-black border border-white/10 p-2 text-xs text-white focus:outline-none focus:border-red-500/50"
                    />
                  </div>
                  <div className="flex space-x-2 justify-end pt-1">
                    <button
                      onClick={() => setEditingItemId(null)}
                      className="px-3 py-1 font-mono text-[10px] text-gray-400 hover:text-white uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(item)}
                      className="bg-white hover:bg-red-500 text-black hover:text-white px-3 py-1 font-mono text-[10px] uppercase font-bold transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-white leading-relaxed font-sans">{item.content}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-white/[0.03] pt-2.5 text-[9px] font-mono text-gray-400">
                    <div className="space-y-0.5">
                      <span className="text-gray-500 block uppercase">ORIGIN REFLECTION:</span>
                      <span className="text-gray-300 font-sans text-[10px]">{item.sourceSessionTitle}</span>
                    </div>
                    <div className="space-y-0.5 sm:text-right">
                      <span className="text-gray-500 block uppercase">CLASSIFICATION LEVEL:</span>
                      <span className="text-red-400 uppercase font-bold">{item.insightLevel || 'Observation'} ({item.confidence}% confidence)</span>
                    </div>
                  </div>

                  {item.whySaved && (
                    <div className="bg-black/30 p-2 border border-white/[0.02] text-[10px] text-gray-400 leading-relaxed font-sans">
                      <span className="font-mono text-[8px] text-gray-500 block uppercase mb-0.5 font-bold">Calibration Logic:</span>
                      {item.whySaved}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
