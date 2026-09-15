import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer id="footer-section" className="py-10 px-4 sm:px-6 bg-stone-900 text-stone-400 border-t border-stone-800 text-sm">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <span className="font-brand-serif font-semibold tracking-[0.2em] uppercase text-stone-200">
            FRYSAIDE
          </span>
          <p className="text-xs text-stone-400 mt-1">
            Moda feminina mineira para lojistas e multimarcas. Mais de 29 anos de mercado.
          </p>
        </div>
        <p className="text-xs text-stone-400">
          Atendimento exclusivo para pessoas jurídicas e lojistas de moda.
        </p>
      </div>
    </footer>
  );
};
