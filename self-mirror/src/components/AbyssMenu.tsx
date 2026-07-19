import React from 'react';
import { motion } from 'motion/react';
import { AbyssTopic } from '../types';
import { INITIAL_ABYSS_TOPICS } from '../data';
import { ChevronRight, Compass, Flame, Layers, Link2, ShieldAlert, UserCheck } from 'lucide-react';

interface AbyssMenuProps {
  onSelectTopic: (topic: AbyssTopic) => void;
}

export default function AbyssMenu({ onSelectTopic }: AbyssMenuProps) {
  
  const topicIcons = { ShieldAlert, Link2, UserCheck, Flame, Layers } as const;
  const renderIcon = (name: string) => {
    const IconComponent = topicIcons[name as keyof typeof topicIcons];
    if (!IconComponent) return <Compass className="w-5 h-5 text-red-500" />;
    return <IconComponent className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-3">
        <span className="font-mono text-[10px] tracking-widest text-red-500 uppercase">THE INNER CRATER</span>
        <h2 className="font-display text-3xl font-bold tracking-widest text-white uppercase">
          ENTER THE ABYSS
        </h2>
        <div className="h-0.5 w-12 bg-red-500 mx-auto" />
        <p className="font-sans text-xs text-gray-400 leading-relaxed uppercase">
          "The deeper you go, the clearer the truth."
        </p>
      </div>

      {/* Grid of the 5 Abyss dimensions shown in mockup 3 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 max-w-6xl mx-auto mt-12">
        {INITIAL_ABYSS_TOPICS.map((topic, i) => (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            onClick={() => onSelectTopic(topic)}
            className="bg-[#0e0e0e] hover:bg-[#121212] border border-white/5 hover:border-red-500/30 p-5 rounded-none flex flex-col justify-between h-[320px] transition-all duration-300 group cursor-pointer relative overflow-hidden"
          >
            {/* Corner bracket decorative elements from mockups */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10 group-hover:border-red-500/50 transition-colors" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10 group-hover:border-red-500/50 transition-colors" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/10 group-hover:border-red-500/50 transition-colors" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10 group-hover:border-red-500/50 transition-colors" />

            <div className="space-y-4">
              <div className="w-10 h-10 border border-white/10 group-hover:border-red-500/30 flex items-center justify-center bg-black/40 transition-colors">
                {renderIcon(topic.iconName)}
              </div>
              
              <div>
                <h3 className="font-display font-bold text-base text-white tracking-widest group-hover:text-red-500 transition-colors uppercase">
                  {topic.title}
                </h3>
                <span className="text-[10px] text-gray-500 font-mono tracking-wider block mt-1">
                  {topic.subtitle}
                </span>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed font-sans mt-2 line-clamp-4">
                {topic.description}
              </p>
            </div>

            <div className="border-t border-white/5 pt-3 mt-4 flex items-center justify-between">
              <span className="font-mono text-[9px] text-gray-600 group-hover:text-red-500/70 transition-colors uppercase tracking-widest">
                Explore topic
              </span>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quote Banner */}
      <div className="max-w-xl mx-auto bg-black/30 border border-white/5 py-4 px-6 text-center mt-12 rounded-none">
        <p className="font-mono text-[10px] text-gray-400 tracking-widest leading-relaxed uppercase">
          "The truth is not here to break you. It's here to set you free."
        </p>
      </div>

    </div>
  );
}
