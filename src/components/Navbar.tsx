import React from 'react';

interface NavbarProps {
  onCtaClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onCtaClick }) => {
  return (
    <header id="navbar-header" className="sticky top-0 z-50 bg-[#fbfbf9]/95 backdrop-blur-sm border-b border-stone-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        <a 
          href="#" 
          id="navbar-logo"
          className="tracking-[0.2em] uppercase font-semibold text-xl text-stone-900 font-brand-serif"
        >
          FRYSAIDE
        </a>
        <button
          id="navbar-cta-btn"
          onClick={onCtaClick}
          type="button"
          className="bg-stone-900 hover:bg-stone-800 text-stone-50 text-sm font-medium px-5 py-2.5 rounded-sm transition-colors duration-200"
        >
          Quero revender Frysaide
        </button>
      </div>
    </header>
  );
};
