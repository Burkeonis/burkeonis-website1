import React from 'react';
import { Header } from './Header';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-forge_bg text-bone font-body">
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="w-full h-full bg-[radial-gradient(circle_at_top,_#541014_0,_transparent_55%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Header />
        <main className="mt-10 space-y-12">
          {children}
        </main>
      </div>
    </div>
  );
};
