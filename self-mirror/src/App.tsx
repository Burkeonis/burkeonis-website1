import React, { lazy, Suspense, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home as HomeIcon, 
  BookOpen, 
  Compass, 
  Zap, 
  Flame, 
  Sparkles, 
  Eye, 
  Menu, 
  X,
  Database,
  CreditCard,
  Hammer,
  Scale
} from 'lucide-react';

import { Session, UserProfile, MirrorTestResult, AbyssTopic, Message, MemoryItem, GuidedFlow } from './types';
import { INITIAL_SESSIONS, INITIAL_USER_PROFILE } from './data';

import WelcomeScreen from './components/WelcomeScreen';
import {
  clearSelfMirrorData,
  loadLocalState,
  loadAppSetting,
  migrateLegacyLocalStorage,
  saveMemory as persistMemory,
  saveMirrorTest as persistMirrorTest,
  saveName as persistName,
  saveProfile as persistProfile,
  saveSessions as persistSessions,
} from './storage/database';
import { useEntitlement } from './billing/useEntitlement';
import type { ReflectionResult } from './schemas/reflection';
import { ReflectionEngine } from './engine/reflectionEngine';
import { OllamaProvider } from './providers/ollamaProvider';
import { OpenAiCompatibleProvider } from './providers/openAiCompatibleProvider';
import { byokVault } from './providers/byokVault';
import { BurkeonisCloudProvider } from './api/cloudProvider';
import { ReflectionUnavailableError } from './api/errors';
import { memoryFromConfirmedReflection } from './engine/memoryEngine';

const Dashboard = lazy(() => import('./components/Dashboard'));
const ChatInterface = lazy(() => import('./components/ChatInterface'));
const AbyssMenu = lazy(() => import('./components/AbyssMenu'));
const MirrorTestView = lazy(() => import('./components/MirrorTestView'));
const MemoryConsole = lazy(() => import('./components/MemoryConsole'));
const AccountBilling = lazy(() => import('./components/AccountBilling'));
const ProModeGate = lazy(() => import('./components/ProModeGate'));
const TurnstileWidget = lazy(() => import('./components/TurnstileWidget'));

export default function App() {
  const [userName, setUserName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'mediator' | 'abyss' | 'builder' | 'evolution' | 'memory' | 'account'>('home');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [mirrorTest, setMirrorTest] = useState<MirrorTestResult | null>(null);
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const { user, billing, hasPro } = useEntitlement();
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);
  const [usage, setUsage] = useState<{ remaining: number; limit: number; resetAt: number } | null>(null);

  const refreshUsage = async () => {
    try {
      const token = user ? await user.getIdToken() : null;
      const response = await fetch('/api/self-mirror/usage?feature=mirror', {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) setUsage(await response.json());
    } catch { /* The app remains usable in local modes when the Worker is offline. */ }
  };

  useEffect(() => { void refreshUsage(); }, [user]);

  // Migrate legacy storage once, then load substantial private data from IndexedDB.
  useEffect(() => {
    void (async () => {
      try {
        await migrateLegacyLocalStorage();
        const saved = await loadLocalState();
        setUserName(saved.name);
        setSessions(saved.sessions.length ? saved.sessions : INITIAL_SESSIONS);
        setUserProfile(saved.profile ?? INITIAL_USER_PROFILE);
        setMirrorTest(saved.mirrorTest);
        setMemoryItems(saved.memory);
      } catch (err) {
        console.error('Self Mirror local database could not be opened.', err);
        setSessions(INITIAL_SESSIONS);
        setUserProfile(INITIAL_USER_PROFILE);
      }
    })();
  }, []);

  // Save state helpers
  const saveSessions = (updated: Session[]) => {
    setSessions(updated);
    void persistSessions(updated);
  };

  const saveUserProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    void persistProfile(updated);
  };

  const saveMemoryItems = (updated: MemoryItem[]) => {
    setMemoryItems(updated);
    void persistMemory(updated);
  };

  const handleEnterWelcome = (name: string) => {
    setUserName(name);
    void persistName(name);
    
    // Update profile name
    const updatedProfile = { ...userProfile, name };
    saveUserProfile(updatedProfile);
    setActiveTab('home');
  };

  // Start a fresh, standard or guided chat session
  const handleStartNewSession = (topic?: AbyssTopic, forceGuided = false, mode: Session['mode'] = 'mirror') => {
    const id = `session-${Date.now()}`;
    const sessionCount = sessions.length;
    
    // Force guided if it is the very first reflection
    const shouldBeGuided = forceGuided || sessionCount === 0;

    const initialGuidedFlow: GuidedFlow | undefined = shouldBeGuided ? {
      currentStepIndex: 0,
      answers: {
        happened: '',
        felt: '',
        did: '',
        wanted: '',
        avoided: ''
      }
    } : undefined;

    const newSession: Session = {
      id,
      title: shouldBeGuided 
        ? `Guided Reflection ${sessionCount + 1}` 
        : (topic ? `Abyss Exploration: ${topic.title}` : `Reflection ${sessionCount + 1}`),
      date: new Date().toLocaleDateString(),
      messages: topic && !shouldBeGuided ? [
        {
          id: `initial-prompt`,
          role: 'assistant',
          content: topic.initialQuestion,
          timestamp: 'Just now',
          meta: {
            contradiction: null,
            shadowPattern: null,
            defenseIntensity: 20,
            avoidedQuestion: topic.initialQuestion
          }
        }
      ] : [],
      activeAbyssTopic: topic ? topic.id : null,
      mode,
      intensityMax: shouldBeGuided ? 15 : 30,
      guidedFlow: initialGuidedFlow
    };

    saveSessions([newSession, ...sessions]);
    setActiveSessionId(id);
    setActiveTab('chat');
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setActiveTab('chat');
  };

  // Update active session's guidedFlow state
  const handleUpdateGuidedFlow = (updatedFlow: GuidedFlow) => {
    if (!activeSessionId) return;
    const sessionIndex = sessions.findIndex(s => s.id === activeSessionId);
    if (sessionIndex === -1) return;

    const currentSession = sessions[sessionIndex];
    const updatedSession = {
      ...currentSession,
      guidedFlow: updatedFlow
    };

    const updatedSessions = [...sessions];
    updatedSessions[sessionIndex] = updatedSession;
    saveSessions(updatedSessions);
  };

  // Main logic: Sending a user message to Express -> Gemini API
  const handleSendMessage = async (text: string) => {
    if (!activeSessionId) return;

    const sessionIndex = sessions.findIndex((s) => s.id === activeSessionId);
    if (sessionIndex === -1) return;

    const currentSession = sessions[sessionIndex];
    
    // Construct new user message
    const userMessage: Message = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: 'Just now'
    };

    const updatedMessages = [...currentSession.messages, userMessage];
    const updatedSession = { ...currentSession, messages: updatedMessages };
    
    const updatedSessions = [...sessions];
    updatedSessions[sessionIndex] = updatedSession;
    saveSessions(updatedSessions);
    setIsGenerating(true);

    try {
      const mode = currentSession.mode ?? (currentSession.activeAbyssTopic ? 'abyss' : 'mirror');
      const processingMode = await loadAppSetting<'cloud' | 'ollama' | 'byok'>('processingMode') ?? 'cloud';
      let replyData: ReflectionResult;
      if (processingMode === 'ollama') {
        const baseUrl = await loadAppSetting<string>('ollamaBaseUrl') ?? 'http://localhost:11434';
        const model = await loadAppSetting<string>('ollamaModel');
        if (!model) throw new ReflectionUnavailableError('Select an Ollama model before using Local AI. No cloud fallback was used.');
        const engine = new ReflectionEngine(new OllamaProvider({ baseUrl, model }));
        replyData = (await engine.reflect({ mode, messages: updatedMessages })).reflection;
      } else if (processingMode === 'byok') {
        const baseUrl = await loadAppSetting<string>('byokBaseUrl') ?? 'https://api.openai.com/v1';
        const model = await loadAppSetting<string>('byokModel');
        if (!model || !byokVault.has()) throw new ReflectionUnavailableError('Enter a session-only API key and model before using BYOK. No Burkeonis cloud fallback was used.');
        const engine = new ReflectionEngine(new OpenAiCompatibleProvider({ baseUrl, model, apiKey: byokVault.get() }));
        replyData = (await engine.reflect({ mode, messages: updatedMessages })).reflection;
      } else {
        const token = user ? await user.getIdToken() : null;
        const engine = new ReflectionEngine(new BurkeonisCloudProvider({
          accessToken: token,
          turnstileToken,
        }));
        try {
          replyData = (await engine.reflect({ mode, messages: updatedMessages })).reflection;
        } finally {
          // Turnstile tokens are single-use. Force a fresh challenge after every cloud attempt.
          setTurnstileToken('');
          setTurnstileResetSignal((value) => value + 1);
        }
        void refreshUsage();
      }
      const section = (title: string, items: string[]) => items.length
        ? `${title}\n${items.map((item) => `• ${item}`).join('\n')}`
        : '';
      const reply = [
        section('FACTS', replyData.facts),
        section('PATTERNS', replyData.patterns),
        section('POSSIBILITIES', replyData.possibilities),
        section('BLIND SPOTS', replyData.blindSpots),
        `NEXT STEP\n${replyData.nextStep}`,
        `CONFIDENCE: ${replyData.confidence.toUpperCase()} · EVIDENCE: ${replyData.evidenceLevel.toUpperCase()}`,
        section('LIMITATIONS', replyData.limitations),
      ].filter(Boolean).join('\n\n');

      const assistantMessage: Message = {
        id: `msg-assistant-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: 'Just now',
        meta: {
          contradiction: null,
          shadowPattern: null,
          defenseIntensity: 0,
          avoidedQuestion: replyData.nextStep,
          reflection: replyData,
        }
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      const finalSession = {
        ...updatedSession,
        messages: finalMessages,
        intensityMax: currentSession.intensityMax || 0,
      };

      const finalSessions = [...sessions];
      finalSessions[sessionIndex] = finalSession;
      saveSessions(finalSessions);

    } catch (error) {
      console.error('Reflection request failed without generating analysis.', error);
      const failureText = error instanceof ReflectionUnavailableError
        ? error.message
        : 'Self Mirror could not complete this reflection. No conclusion has been generated. Your entry remains stored locally.';
      const failureMessage: Message = {
        id: `msg-system-failure-${Date.now()}`,
        role: 'assistant',
        content: failureText,
        timestamp: 'Just now',
        meta: {
          contradiction: null,
          shadowPattern: null,
          defenseIntensity: 0,
          avoidedQuestion: null
        }
      };
      const failedSessions = [...sessions];
      failedSessions[sessionIndex] = {
        ...updatedSession,
        messages: [...updatedMessages, failureMessage]
      };
      saveSessions(failedSessions);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveMirrorTest = (result: MirrorTestResult) => {
    setMirrorTest(result);
    void persistMirrorTest(result);
  };

  // Memory Console functions
  const handleUpdateMemoryItem = (updated: MemoryItem) => {
    const updatedList = memoryItems.map(m => m.id === updated.id ? updated : m);
    saveMemoryItems(updatedList);
  };

  const handleDeleteMemoryItem = (id: string) => {
    const filtered = memoryItems.filter(m => m.id !== id);
    saveMemoryItems(filtered);
  };

  const handleConfirmObservation = (confirmation: 'yes' | 'partly' | 'no') => {
    if (!activeSessionId) return;
    const session = sessions.find((item) => item.id === activeSessionId);
    if (!session) return;
    const memory = memoryFromConfirmedReflection(session, confirmation);
    if (!memory) return;
    saveMemoryItems([memory, ...memoryItems.filter((item) => item.id !== memory.id)]);
  };

  const handleDeleteSession = (id: string) => {
    saveSessions(sessions.filter((session) => session.id !== id));
    saveMemoryItems(memoryItems.filter((item) => item.sourceSessionId !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setActiveTab('home');
    }
  };

  const handleToggleMemoryTracking = (enabled: boolean) => {
    const updatedProfile = { ...userProfile, isMemoryEnabled: enabled };
    saveUserProfile(updatedProfile);
  };

  const handleClearAllData = () => {
    void clearSelfMirrorData();
    setUserName('');
    setSessions([]);
    setUserProfile({
      name: '',
      repeatingTriggersCount: 0,
      emotionalReactionsCount: 0,
      corePatternsCount: 0,
      breakthroughsCount: 0,
      recentTriggers: [],
      shadowSwaps: [],
      isMemoryEnabled: true
    });
    setMirrorTest(null);
    setMemoryItems([]);
    setActiveSessionId(null);
    setActiveTab('home');
  };

  // Welcome portal gating
  if (!userName) {
    return <WelcomeScreen onEnter={handleEnterWelcome} />;
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col md:flex-row relative">
      {/* Absolute background element */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.02)_0%,transparent_80%)] pointer-events-none" />

      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden md:flex md:w-64 bg-black border-r border-white/5 flex-col justify-between py-6 px-4 z-20 shrink-0">
        <div className="space-y-8">
          {/* Brand Logo & Philosophy tag */}
          <div className="flex items-center space-x-3 px-2">
            <div className="text-xl font-light text-red-500 tracking-widest flex">
              <span className="transform rotate-180">)</span>
              <span>(</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-sm tracking-widest text-white uppercase">
                SELF MIRROR
              </h1>
              <span className="text-[8px] font-mono tracking-widest text-gray-500 block uppercase">
                Burkeonis Doctrine
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {[
              { id: 'home', label: 'Dashboard', icon: HomeIcon },
              { id: 'chat', label: 'Dialogue logs', icon: BookOpen },
              { id: 'mediator', label: 'Mediator', icon: Scale },
              { id: 'abyss', label: 'Enter Abyss', icon: Compass },
              { id: 'builder', label: 'Builder', icon: Hammer },
              { id: 'evolution', label: 'Mirror Test', icon: Zap },
              { id: 'memory', label: 'Memory Console', icon: Database },
              { id: 'account', label: 'Account & Billing', icon: CreditCard }
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    if (item.id !== 'chat') setActiveSessionId(null);
                  }}
                  id={`nav-${item.id}`}
                  className={`w-full flex items-center space-x-3 px-4 py-3 font-mono text-xs uppercase tracking-wider transition-all rounded-none cursor-pointer ${
                    isActive 
                      ? 'bg-red-950/20 text-white border-l-2 border-red-500 font-medium' 
                      : 'text-gray-500 hover:text-white hover:bg-[#121212]/30'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-red-500' : 'text-gray-600'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="px-4 text-[9px] font-mono text-gray-500 space-y-1 border-t border-white/5 pt-4">
          <p>Access: {billing.plan.toUpperCase()}</p>
          <p>{usage ? `Cloud: ${usage.remaining}/${usage.limit} left` : 'Cloud quota: unavailable'}</p>
          <p className="uppercase">Identity: {userName}</p>
        </div>
      </aside>

      {/* Header - Mobile */}
      <header className="md:hidden bg-black border-b border-white/5 p-4 flex items-center justify-between z-20">
        <div className="flex items-center space-x-2">
          <div className="text-sm font-light text-red-500 tracking-widest">
            <span>)(</span>
          </div>
          <h1 className="font-display font-bold text-xs tracking-widest text-white uppercase">
            SELF MIRROR
          </h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-400 hover:text-white cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-14 left-0 right-0 bg-black border-b border-white/5 z-30 p-4 space-y-1"
          >
            {[
              { id: 'home', label: 'Dashboard', icon: HomeIcon },
              { id: 'chat', label: 'Dialogue logs', icon: BookOpen },
              { id: 'mediator', label: 'Mediator', icon: Scale },
              { id: 'abyss', label: 'Enter Abyss', icon: Compass },
              { id: 'builder', label: 'Builder', icon: Hammer },
              { id: 'evolution', label: 'Mirror Test', icon: Zap },
              { id: 'memory', label: 'Memory Console', icon: Database },
              { id: 'account', label: 'Account & Billing', icon: CreditCard }
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    if (item.id !== 'chat') setActiveSessionId(null);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 font-mono text-xs uppercase tracking-wider transition-all ${
                    isActive ? 'bg-red-950/20 text-white border-l-2 border-red-500' : 'text-gray-500'
                  }`}
                >
                  <item.icon className="w-4 h-4 text-red-500" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto z-10">
        <TurnstileWidget onToken={setTurnstileToken} resetSignal={turnstileResetSignal} />
        <Suspense fallback={<div className="p-8 font-mono text-xs uppercase tracking-widest text-gray-500">Loading local interface…</div>}>
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Dashboard 
                userProfile={userProfile}
                sessions={sessions}
                onSelectSession={handleSelectSession}
                onStartNewSession={() => handleStartNewSession(undefined, false)}
                onNavigateToAbyss={() => setActiveTab('abyss')}
              />
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ChatInterface 
                sessionTitle={activeSession?.title || 'Interactive Reflection'}
                messages={activeSession?.messages || []}
                activeAbyssTopic={activeSession?.activeAbyssTopic}
                onSendMessage={handleSendMessage}
                onBack={() => {
                  setActiveTab('home');
                  setActiveSessionId(null);
                }}
                isGenerating={isGenerating}
                intensityScore={activeSession?.intensityMax}
                guidedFlow={activeSession?.guidedFlow}
                onUpdateGuidedFlow={handleUpdateGuidedFlow}
                onConfirmObservation={handleConfirmObservation}
              />
            </motion.div>
          )}

          {activeTab === 'mediator' && (
            hasPro
              ? <section className="mx-auto max-w-3xl py-16 text-center"><span className="font-mono text-[10px] uppercase tracking-widest text-amber-500">Mediator / Pro</span><h2 className="mt-4 text-4xl font-bold uppercase text-white">Examine both sides without pretending blame is equal.</h2><button className="mt-8 bg-amber-700 px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-white" onClick={() => handleStartNewSession(undefined, false, 'mediator')}>Start Mediator</button></section>
              : <ProModeGate mode="Mediator" signedIn={Boolean(user)} onUpgrade={() => setActiveTab('account')} />
          )}

          {activeTab === 'abyss' && hasPro && (
            <motion.div 
              key="abyss"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AbyssMenu 
                onSelectTopic={(topic) => handleStartNewSession(topic, false, 'abyss')}
              />
            </motion.div>
          )}

          {activeTab === 'abyss' && !hasPro && <ProModeGate mode="Abyss" signedIn={Boolean(user)} onUpgrade={() => setActiveTab('account')} />}

          {activeTab === 'builder' && (
            hasPro
              ? <section className="mx-auto max-w-3xl py-16 text-center"><span className="font-mono text-[10px] uppercase tracking-widest text-amber-500">Builder / Pro</span><h2 className="mt-4 text-4xl font-bold uppercase text-white">Turn the reflection into one move you can actually make.</h2><button className="mt-8 bg-amber-700 px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-white" onClick={() => handleStartNewSession(undefined, false, 'builder')}>Start Builder</button></section>
              : <ProModeGate mode="Builder" signedIn={Boolean(user)} onUpgrade={() => setActiveTab('account')} />
          )}

          {activeTab === 'evolution' && (
            <motion.div 
              key="evolution"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MirrorTestView 
                sessions={sessions}
                savedResult={mirrorTest}
                onSaveResult={handleSaveMirrorTest}
                onStartCalibration={() => handleStartNewSession(undefined, true)}
              />
            </motion.div>
          )}

          {activeTab === 'memory' && (
            <motion.div 
              key="memory"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MemoryConsole 
                memoryItems={memoryItems}
                sessions={sessions}
                userProfile={userProfile}
                onUpdateMemoryItem={handleUpdateMemoryItem}
                onDeleteMemoryItem={handleDeleteMemoryItem}
                onDeleteSession={handleDeleteSession}
                onToggleMemoryTracking={handleToggleMemoryTracking}
                onClearAllData={handleClearAllData}
              />
            </motion.div>
          )}

          {activeTab === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AccountBilling />
            </motion.div>
          )}
        </AnimatePresence>
        </Suspense>
      </main>
    </div>
  );
}
