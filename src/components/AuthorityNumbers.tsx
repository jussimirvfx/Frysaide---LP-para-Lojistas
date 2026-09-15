import React from 'react';

const stats = [
  {
    number: '+29 anos',
    label: 'de mercado',
    description: 'Tradição e estabilidade no atacado de moda feminina.'
  },
  {
    number: '+800',
    label: 'lojistas ativos',
    description: 'Multimarcas e boutiques parceiras em todo o país.'
  },
  {
    number: '+50 mil',
    label: 'peças por coleção',
    description: 'Estrutura de produção e pronta entrega para o seu abastecimento.'
  }
];

export const AuthorityNumbers: React.FC = () => {
  return (
    <section id="authority-numbers-section" className="py-16 sm:py-20 px-4 sm:px-6 bg-[#fbfbf9] border-b border-stone-200">
      <div className="max-w-6xl mx-auto">
        <h2 
          id="authority-title"
          className="font-brand-serif text-center text-xl sm:text-2xl text-stone-900 mb-12"
        >
          Segurança para a compra da sua loja
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
          {stats.map((item, index) => (
            <div 
              key={index} 
              id={`stat-box-${index}`}
              className="text-center p-6 bg-white border border-stone-200/80 rounded-sm"
            >
              <p className="font-brand-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-stone-900 mb-1">
                {item.number}
              </p>
              <p className="text-sm font-semibold uppercase tracking-wider text-stone-700 mb-3">
                {item.label}
              </p>
              <p className="text-stone-600 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
