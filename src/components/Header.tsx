import React from 'react';
import { NavLink } from 'react-router-dom';

export const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between border-b border-charred pb-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-forge_panel border border-blood flex items-center justify-center">
          <span className="text-xs font-display tracking-[0.25em]">B</span>
        </div>
        <div className="flex flex-col">
          <span className="font-display text-sm tracking-[0.35em] uppercase">
            BURKEONIS
          </span>
          <span className="text-xs text-muted tracking-[0.2em] uppercase">
            Know Thyself. Break the Cycle.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <nav className="hidden md:flex gap-4 text-xs tracking-[0.18em] uppercase">
          <NavLink to="/" className="hover:text-ember">Home</NavLink>
          <NavLink to="/music" className="hover:text-ember">Music</NavLink>
          <NavLink to="/apps" className="hover:text-ember">Apps</NavLink>
          <NavLink to="/tools" className="hover:text-ember">Tools</NavLink>
          <NavLink to="/shadow-work" className="hover:text-ember">Shadow Work</NavLink>
          <NavLink to="/about" className="hover:text-ember">About</NavLink>
          <NavLink to="/updates" className="hover:text-ember">Updates</NavLink>
        </nav>

        <a
          href="mailto:hello@burkeonis.com"
          className="text-xs tracking-[0.2em] uppercase bg-charred text-bone px-4 py-2 border border-blood hover:bg-blood transition-colors"
        >
          Contact
        </a>
      </div>
    </header>
  );
};
