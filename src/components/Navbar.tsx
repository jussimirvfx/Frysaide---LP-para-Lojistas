import { useEffect, useState } from 'react';

export const Navbar = ({ onCtaClick }: { onCtaClick: () => void }) => {
  const [onHero, setOnHero] = useState(true);
  useEffect(() => {
    const hero = document.getElementById('hero-section');
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setOnHero(entry.isIntersecting), {
      rootMargin: '-80px 0px 0px 0px', threshold: 0
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);
  return (
    <header id="navbar-header" data-on-hero={onHero} className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${onHero ? 'bg-transparent border-transparent' : 'bg-white/95 backdrop-blur-sm border-neutral-200/80'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-10 h-20 flex items-center justify-between gap-3">
        <a href="#hero-section" id="navbar-logo" aria-label="Frysaide, início" className={`shrink-0 flex items-center ${onHero ? 'text-white' : 'text-black'}`}>
          <img src="/images/logo-frysaide.png" alt="Frysaide" width="1080" height="391" className={`w-28 sm:w-44 h-auto object-contain ${onHero ? 'brightness-0 invert' : ''}`} />
        </a>
        <button id="navbar-cta-btn" onClick={onCtaClick} type="button" className={`cta text-[10px] sm:text-sm px-3 sm:px-6 ${onHero ? 'bg-white text-black hover:bg-neutral-100' : 'bg-black text-white hover:bg-neutral-800'}`}>QUERO SER LOJISTA PARCEIRO</button>
      </div>
    </header>
  );
};
