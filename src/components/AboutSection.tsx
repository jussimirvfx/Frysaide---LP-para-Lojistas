import React from 'react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about-section" className="py-20 sm:py-24 px-4 sm:px-6 bg-white border-b border-stone-200">
      <div className="max-w-3xl mx-auto">
        <h2 
          id="about-title"
          className="font-brand-serif text-2xl sm:text-3xl md:text-4xl text-stone-900 mb-8 text-center sm:text-left"
        >
          Tradição mineira e suporte próximo ao lojista
        </h2>
        
        <div className="space-y-6 text-stone-700 text-base sm:text-lg leading-relaxed">
          <p id="about-paragraph-1">
            Nascida em Minas Gerais, a Frysaide atua há quase três décadas no atacado de moda feminina. O design das peças é o nosso principal diferencial, pensado para vestir mulheres de 25 a 45 anos com cortes precisos, tecidos nobres e acabamentos de alfaiataria que valorizam a vitrine da sua loja.
          </p>
          <p id="about-paragraph-2">
            Nossa relação com o lojista vai além da entrega: mantemos suporte comercial dedicado e estrutura ágil para reposição de peças a pronta entrega, garantindo segurança na sua recompra durante toda a temporada.
          </p>
        </div>
      </div>
    </section>
  );
};
