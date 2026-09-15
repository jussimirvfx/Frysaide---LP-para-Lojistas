import { useEffect, useRef, useState } from 'react';

const stats = [
  { value: 29, suffix: ' anos', label: 'de mercado' },
  { value: 800, suffix: '', label: 'lojistas ativos' },
  { value: 50, suffix: ' mil', label: 'peças por coleção' }
];

export const AuthorityNumbers = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1);
      return;
    }
    const section = sectionRef.current;
    if (!section) return;
    let frame = 0;
    let active = false;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) {
        active = false;
        cancelAnimationFrame(frame);
        setProgress(0);
        return;
      }
      if (active) return;
      active = true;
      const startedAt = performance.now();
      const animate = (now: number) => {
        const nextProgress = Math.min((now - startedAt) / 2000, 1);
        setProgress(nextProgress);
        if (nextProgress < 1) frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
    }, { threshold: 0.25 });
    observer.observe(section);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  return (
    <section ref={sectionRef} id="authority-numbers-section" className="py-16 sm:py-20 px-6 bg-black text-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="section-title text-center mb-12">Uma marca construída ao lado de lojistas.</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {stats.map(item => (
            <div key={item.label} className="text-center border border-white/25 rounded-none bg-white/5 px-6 py-10 sm:py-12">
              <p className="text-5xl lg:text-6xl mb-3 tabular-nums">
                <span aria-hidden="true">+{Math.floor(item.value * progress)}{item.suffix}</span>
                <span className="sr-only">+{item.value}{item.suffix}</span>
              </p>
              <p className="text-base">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
