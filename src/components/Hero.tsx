import React from 'react';

interface HeroProps {
  onCtaClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onCtaClick }) => {
  return (
    <section id="hero-section" className="py-20 sm:py-28 px-4 sm:px-6 border-b border-stone-200">
      <div className="max-w-4xl mx-auto text-center">
        <h1 
          id="hero-title"
          className="font-brand-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] text-stone-900 leading-[1.2] tracking-tight mb-6"
        >
          Lojista, leve para a sua multimarcas uma marca mineira com design forte, giro no ponto de venda e margem de 2,2.
        </h1>
        <p 
          id="hero-description"
          className="text-stone-600 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10 font-normal"
        >
          Com mais de 29 anos de mercado, a Frysaide abastece boutiques com coleções em alfaiataria sensoriale, linho e jeans, pronta entrega para reposição e frete pago pela empresa.
        </p>
        <div>
          <button
            id="hero-cta-btn"
            onClick={onCtaClick}
            type="button"
            className="bg-stone-900 hover:bg-stone-800 text-stone-50 text-base font-medium px-8 py-3.5 rounded-sm transition-colors duration-200"
          >
            Quero revender Frysaide
          </button>
        </div>
      </div>
    </section>
  );
};
