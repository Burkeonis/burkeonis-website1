export interface MemoryContext {
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  evidenceReferences: string[];
}

export interface MemoryEngine {
  buildContext(sessionId: string): Promise<MemoryContext>;
  deleteSession(sessionId: string): Promise<void>;
  deleteAll(): Promise<void>;
}

// IndexedDB arrives in Phase 2. This contract keeps storage mechanics out of
// the reflection and UI layers from the start.
