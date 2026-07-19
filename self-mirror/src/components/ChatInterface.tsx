import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, MessageMeta, GuidedFlow } from '../types';
import { 
  Send, 
  ArrowLeft, 
  ShieldAlert, 
  Flame, 
  Zap, 
  HelpCircle,
  RefreshCw,
  Loader2,
  Check,
  Slash,
  ChevronRight,
  Info
} from 'lucide-react';

interface ChatInterfaceProps {
  sessionTitle: string;
  messages: Message[];
  activeAbyssTopic?: string | null;
  onSendMessage: (text: string) => Promise<void>;
  onBack: () => void;
  isGenerating: boolean;
  intensityScore?: number;
  guidedFlow?: GuidedFlow;
  onUpdateGuidedFlow?: (flow: GuidedFlow) => void;
  onConfirmObservation?: (confirmation: 'yes' | 'partly' | 'no') => void;
}

const GUIDED_QUESTIONS = [
  { key: 'happened', label: 'What happened?', placeholder: 'Describe the situation or event objectively...' },
  { key: 'felt', label: 'What did you feel?', placeholder: 'Describe your underlying emotions (fear, shame, frustration)...' },
  { key: 'did', label: 'What did you do?', placeholder: 'How did you react or respond in the moment?' },
  { key: 'wanted', label: 'What did you want to happen?', placeholder: 'What was your hidden desire or agenda?' },
  { key: 'avoided', label: 'What part of your response are you avoiding responsibility for?', placeholder: 'Be completely honest with yourself...' }
];

export default function ChatInterface({
  sessionTitle,
  messages,
  activeAbyssTopic,
  onSendMessage,
  onBack,
  isGenerating,
  intensityScore = 0,
  guidedFlow,
  onUpdateGuidedFlow,
  onConfirmObservation,
}: ChatInterfaceProps) {
  const [inputText, setInputText] = useState('');
  const [guidedInput, setGuidedInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating, guidedFlow?.currentStepIndex]);

  const getLastMeta = (): MessageMeta | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === 'assistant' && msg.meta) {
        return msg.meta;
      }
    }
    return null;
  };

  const lastMeta = getLastMeta();
  const currentIntensity = lastMeta ? lastMeta.defenseIntensity : intensityScore;

  // Handle standard chat submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    const text = inputText;
    setInputText('');
    onSendMessage(text);
  };

  // Handle guided step submission
  const handleNextGuidedStep = () => {
    if (!guidedFlow || !onUpdateGuidedFlow || !guidedInput.trim()) return;

    const currentStep = GUIDED_QUESTIONS[guidedFlow.currentStepIndex];
    const updatedAnswers = {
      ...guidedFlow.answers,
      [currentStep.key]: guidedInput.trim()
    };

    setGuidedInput('');

    const nextIndex = guidedFlow.currentStepIndex + 1;
    if (nextIndex < GUIDED_QUESTIONS.length) {
      // Move to next step
      onUpdateGuidedFlow({
        ...guidedFlow,
        currentStepIndex: nextIndex,
        answers: updatedAnswers
      });
    } else {
      // Completed all questions. Trigger backend synthesis.
      onUpdateGuidedFlow({
        ...guidedFlow,
        currentStepIndex: 5, // Status value for "Synthesis pending"
        answers: updatedAnswers
      });

      // Format answers into a prompt for synthesis
      const formattedAnswers = `I have completed my guided reflection. Here are my raw answers:
- What happened: ${updatedAnswers.happened}
- What I felt: ${updatedAnswers.felt}
- What I did: ${updatedAnswers.did}
- What I wanted: ${updatedAnswers.wanted}
- What I was avoiding: ${updatedAnswers.avoided}

Please formulate an objective OBSERVATION summarizing this interaction based strictly on my words, and ask me if it is accurate. Do not accuse, just show the facts.`;
      
      onSendMessage(formattedAnswers);
    }
  };

  const handleConfirmation = (value: 'yes' | 'partly' | 'no') => {
    if (!guidedFlow || !onUpdateGuidedFlow) return;

    onUpdateGuidedFlow({
      ...guidedFlow,
      confirmation: value
    });
    onConfirmObservation?.(value);
  };

  // Helper to render deconstructive loading phrases
  const [loadingPhrase, setLoadingPhrase] = useState('Positioning the mirror...');
  useEffect(() => {
    if (!isGenerating) return;
    const phrases = [
      'Deconstructing filters...',
      'Analyzing emotional defenses...',
      'Scanning for contradictions...',
      'Evaluating the mask...',
      'Separating the wound from the weapon...',
      'Testing possible blind spots...'
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % phrases.length;
      setLoadingPhrase(phrases[i]);
    }, 2500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Is guided flow active and not confirmed yet?
  const isGuidedActive = guidedFlow && guidedFlow.currentStepIndex >= 0 && !guidedFlow.confirmation;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[calc(100vh-12rem)] relative max-w-5xl mx-auto px-1">
      
      {/* Left Column: Interactive area */}
      <div className="lg:col-span-3 bg-[#0a0a0a] border border-white/5 flex flex-col h-[60vh] lg:h-[72vh] min-h-[460px]">
        {/* Chat Header */}
        <div className="p-3 border-b border-white/5 flex items-center justify-between bg-black/40">
          <button 
            onClick={onBack}
            className="text-gray-400 hover:text-white flex items-center space-x-1.5 font-mono text-[9px] uppercase tracking-widest transition-colors cursor-pointer min-h-[44px] px-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-red-500" />
            <span>CLOSE</span>
          </button>
          
          <div className="text-center">
            <h3 className="font-display font-semibold text-xs sm:text-sm text-white uppercase tracking-wider leading-none">
              {isGuidedActive ? 'Guided Calibration' : sessionTitle || 'Interactive Dialogue'}
            </h3>
            {activeAbyssTopic && !isGuidedActive && (
              <span className="font-mono text-[8px] text-red-500 uppercase tracking-widest mt-1 block">
                Abyss: {activeAbyssTopic}
              </span>
            )}
          </div>
          <div className="w-12" />
        </div>

        {/* Guided Step-by-Step UI Wizard */}
        {isGuidedActive ? (
          <div className="flex-1 flex flex-col justify-between p-5 bg-[#070707] overflow-y-auto">
            {guidedFlow.currentStepIndex < 5 ? (
              // Question Step
              <div className="space-y-6 max-w-lg mx-auto w-full py-2">
                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-[9px] text-gray-400 uppercase tracking-widest">
                    <span>Guided Inquiry</span>
                    <span>Step {guidedFlow.currentStepIndex + 1} of 5</span>
                  </div>
                  <div className="h-1 bg-black border border-white/5 overflow-hidden">
                    <div 
                      className="h-full bg-red-500 transition-all duration-300"
                      style={{ width: `${((guidedFlow.currentStepIndex + 1) / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Question */}
                <div className="space-y-3">
                  <span className="block font-mono text-[10px] tracking-widest text-red-500 uppercase font-bold">THE INQUIRY:</span>
                  <h4 className="font-display text-lg sm:text-xl font-bold text-white leading-snug">
                    {GUIDED_QUESTIONS[guidedFlow.currentStepIndex].label}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-sans leading-relaxed">
                    Take your time. Deceptions only delay calibration. Answer objectively.
                  </p>
                </div>

                {/* Input Area */}
                <div className="space-y-3 pt-2">
                  <textarea
                    value={guidedInput}
                    onChange={(e) => setGuidedInput(e.target.value)}
                    placeholder={GUIDED_QUESTIONS[guidedFlow.currentStepIndex].placeholder}
                    className="w-full min-h-[100px] bg-[#121212] border border-white/10 rounded-none p-3 font-sans text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/40 transition-colors resize-none"
                    maxLength={1000}
                  />
                  <button
                    onClick={handleNextGuidedStep}
                    disabled={!guidedInput.trim() || isGenerating}
                    className="w-full min-h-[44px] bg-white hover:bg-red-500 text-black hover:text-white font-mono text-xs uppercase font-bold tracking-widest transition-all py-3 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <span>{guidedFlow.currentStepIndex === 4 ? 'COMPILE REFLECTION' : 'CONTINUE'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              // Synthesis Pending / Observation Confirmation State
              <div className="space-y-6 max-w-lg mx-auto w-full py-2 text-center flex flex-col justify-center items-center h-full">
                {isGenerating ? (
                  <div className="space-y-4">
                    <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto" />
                    <div className="space-y-1">
                      <span className="block font-mono text-[9px] text-red-500 tracking-wider uppercase font-bold">COMPILING OBSERVATION</span>
                      <p className="text-xs text-gray-400 font-mono animate-pulse uppercase tracking-wide">
                        {loadingPhrase}
                      </p>
                    </div>
                  </div>
                ) : (
                  // Result Observation Confirmation
                  <div className="space-y-6 text-left w-full">
                    <div className="border border-red-500/10 bg-red-950/5 p-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-1 bg-red-500/10 font-mono text-[7px] text-red-400 uppercase tracking-widest">
                        EVIDENCE OBSERVATION
                      </div>
                      <span className="block font-mono text-[9px] text-red-500 uppercase tracking-wider font-bold mb-2">OBSERVATION</span>
                      <p className="font-sans text-sm text-white leading-relaxed italic">
                        {messages[messages.length - 1]?.content || "No observation generated."}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <span className="block font-mono text-[10px] text-gray-400 uppercase tracking-widest text-center font-bold">
                        IS THIS ACCURATE?
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { val: 'yes', label: 'YES', style: 'bg-white text-black hover:bg-green-500 hover:text-white hover:border-green-500' },
                          { val: 'partly', label: 'PARTLY', style: 'bg-transparent text-gray-300 border border-white/20 hover:bg-amber-500/20 hover:text-white hover:border-amber-500' },
                          { val: 'no', label: 'NO', style: 'bg-transparent text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-white hover:border-red-500' }
                        ].map((btn) => (
                          <button
                            key={btn.val}
                            onClick={() => handleConfirmation(btn.val as any)}
                            className={`min-h-[44px] py-2.5 font-mono text-xs uppercase font-bold tracking-widest transition-all cursor-pointer flex items-center justify-center ${btn.style}`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[9px] font-mono text-gray-500 text-center tracking-wide mt-1">
                        Self Mirror learns through verification, avoiding silent assumptions.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Standard Conversation Stream */
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && !isGenerating && (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-3 py-6">
                  <div className="w-10 h-10 rounded-full border border-red-500/20 flex items-center justify-center bg-black">
                    <Flame className="w-4 h-4 text-red-500/40" />
                  </div>
                  <p className="font-sans text-xs text-gray-400 leading-relaxed">
                    The silence is a choice. Make an admission, state a frustration, or share a goal you've struggled to maintain. The mirror will respond.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[90%] sm:max-w-[75%] p-3.5 rounded-none font-sans text-xs sm:text-sm leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-[#141414] text-white border-l-2 border-red-500/40' 
                          : 'bg-black text-gray-300 border border-white/5 relative'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1 pb-1 border-b border-white/[0.02]">
                        <span className="font-mono text-[8px] uppercase tracking-widest text-gray-400 font-bold">
                          {msg.role === 'user' ? 'YOU' : 'SELF MIRROR'}
                        </span>
                        <span className="font-mono text-[8px] text-gray-500">{msg.timestamp}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}

                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-black/40 border border-white/5 p-3 rounded-none max-w-[80%] flex items-center space-x-2.5">
                      <Loader2 className="w-3.5 h-3.5 text-red-500 animate-spin" />
                      <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest animate-pulse font-bold">
                        {loadingPhrase}
                      </span>
                    </div>
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-white/5 bg-black/40 flex items-center space-x-2">
              <input
                type="text"
                id="chat-input-field"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isGenerating}
                placeholder={isGenerating ? "The Mirror is speaking..." : "Reflect or answer here..."}
                className="flex-1 bg-[#121212] border border-white/10 rounded-none px-3.5 py-2.5 font-sans text-xs sm:text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/40 transition-colors disabled:opacity-50 min-h-[44px]"
              />
              <button
                type="submit"
                id="chat-submit-btn"
                disabled={!inputText.trim() || isGenerating}
                className="bg-white hover:bg-red-500 text-black hover:text-white rounded-none p-3 font-mono text-xs uppercase font-bold transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black shrink-0 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>

      {/* Right Column: Dynamic Analytical Mirror feedback (Mockup metrics panel) */}
      <div className="space-y-4">
        
        {/* Real-time Defense Intensity Meter */}
        <div className="bg-[#0e0e0e] border border-white/5 p-4 rounded-none">
          <div className="flex justify-between items-center border-b border-white/5 pb-1.5 mb-3">
            <span className="font-mono text-[9px] tracking-widest text-gray-400 uppercase font-bold">DEFENSE INTENSITY</span>
            <span className="font-mono text-xs text-red-500 font-bold">{currentIntensity}%</span>
          </div>
          
          {/* Progress bar */}
          <div className="relative h-3 bg-black border border-white/5 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${currentIntensity}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r ${
                currentIntensity >= 75 
                  ? 'from-red-950 to-red-500' 
                  : currentIntensity >= 50 
                  ? 'from-amber-950 to-amber-500' 
                  : 'from-green-950 to-green-500'
              }`}
            />
          </div>
          
          <p className="text-[10px] text-gray-400 leading-relaxed mt-2.5 font-sans font-light">
            {currentIntensity >= 75 
              ? 'High defense detected. You may be using intellectual logic or blame to avoid the root discomfort.' 
              : currentIntensity >= 50 
              ? 'Moderate defense. You are cooperating, but holding onto some rationalizations.' 
              : currentIntensity > 0 
              ? 'Low defense. Honesty is stabilizing. The mirror can reflect with high accuracy.' 
              : 'Complete reflections to calibrate defense model.'}
          </p>
        </div>

        {/* Dynamic Contradiction spotted */}
        <div className={`bg-[#0e0e0e] border p-4 rounded-none transition-all duration-500 ${
          lastMeta?.contradiction ? 'border-red-500/20 bg-red-950/5' : 'border-white/5'
        }`}>
          <div className="flex items-center space-x-2 border-b border-white/5 pb-1.5 mb-2.5">
            <ShieldAlert className={`w-3.5 h-3.5 ${lastMeta?.contradiction ? 'text-red-500' : 'text-gray-500'}`} />
            <span className="font-mono text-[9px] tracking-widest text-gray-400 uppercase font-bold">CONTRADICTION STATUS</span>
          </div>
          {lastMeta?.contradiction ? (
            <div className="space-y-2">
              <p className="text-xs text-white leading-relaxed font-sans italic">
                "{lastMeta.contradiction}"
              </p>
              <div className="pt-2 border-t border-white/5">
                <span className="block font-mono text-[8px] text-red-500 uppercase tracking-wider font-bold mb-0.5">INQUIRY</span>
                <p className="text-[10px] text-gray-400 font-sans leading-relaxed">
                  How do these conflicts coexist in your behaviors?
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-gray-400 leading-relaxed font-sans text-center py-2">
              No contradiction detected yet.
            </p>
          )}
        </div>

        {/* Dynamic Shadow Swaps */}
        <div className={`bg-[#0e0e0e] border p-4 rounded-none transition-all duration-500 ${
          lastMeta?.shadowPattern ? 'border-red-500/20 bg-red-950/5' : 'border-white/5'
        }`}>
          <div className="flex items-center space-x-2 border-b border-white/5 pb-1.5 mb-2.5">
            <RefreshCw className={`w-3.5 h-3.5 ${lastMeta?.shadowPattern ? 'text-red-500' : 'text-gray-500'}`} />
            <span className="font-mono text-[9px] tracking-widest text-gray-400 uppercase font-bold">ACTIVE PSYCHE SWAP</span>
          </div>
          {lastMeta?.shadowPattern ? (
            <div className="space-y-1.5">
              <p className="text-[10px] text-red-400 font-mono uppercase tracking-wider font-bold">
                {lastMeta.shadowPattern.wound ? `${lastMeta.shadowPattern.wound} -> ${lastMeta.shadowPattern.weapon}` : 'WOUND -> WEAPON'}
              </p>
              <p className="text-xs text-gray-300 font-sans leading-relaxed font-light">
                {lastMeta.shadowPattern.description}
              </p>
            </div>
          ) : (
            <p className="text-[10px] text-gray-400 leading-relaxed font-sans text-center py-2">
              Not enough evidence to outline psyche swaps.
            </p>
          )}
        </div>

        {/* Unavoidable abyss question */}
        <div className={`bg-[#0e0e0e] border p-4 rounded-none transition-all duration-500 ${
          lastMeta?.avoidedQuestion ? 'border-red-500/20' : 'border-white/5'
        }`}>
          <div className="flex items-center space-x-2 border-b border-white/5 pb-1.5 mb-2.5">
            <HelpCircle className="w-3.5 h-3.5 text-red-500" />
            <span className="font-mono text-[9px] tracking-widest text-gray-400 uppercase font-bold">THE INQUIRY</span>
          </div>
          {lastMeta?.avoidedQuestion ? (
            <p className="text-xs text-white leading-relaxed font-sans font-medium border-l border-red-500 pl-2">
              {lastMeta.avoidedQuestion}
            </p>
          ) : (
            <p className="text-[10px] text-gray-400 leading-relaxed font-sans text-center py-2">
              Waiting for entry admissions...
            </p>
          )}
        </div>

      </div>

    </div>
  );
}
