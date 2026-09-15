import React from 'react';

const benefits = [
  {
    title: 'Frete pago pela empresa',
    description: 'Envio sem custo de transporte para a sua loja.'
  },
  {
    title: 'Boleto em até 6 vezes',
    description: 'Faturamento facilitado para o seu fluxo de caixa, além de cartão, PIX e depósito.'
  },
  {
    title: 'Markup médio de 2,2',
    description: 'Margem saudável praticada pelos lojistas parceiros para a rentabilidade da sua loja.'
  },
  {
    title: 'Materiais de divulgação',
    description: 'Fotos e vídeos em alta resolução para suas redes sociais e materiais de apoio para o PDV.'
  },
  {
    title: 'Suporte para reposição',
    description: 'Estrutura com produtos disponíveis a pronta entrega para reposições ágeis.'
  }
];

export const BenefitsSection: React.FC = () => {
  return (
    <section id="benefits-section" className="py-20 sm:py-24 px-4 sm:px-6 bg-[#fbfbf9] border-b border-stone-200">
      <div className="max-w-5xl mx-auto">
        <h2 
          id="benefits-title"
          className="font-brand-serif text-2xl sm:text-3xl md:text-4xl text-stone-900 mb-12 text-center"
        >
          Condições comerciais para a sua multimarcas
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {benefits.map((item, index) => (
            <div 
              key={index}
              id={`benefit-item-${index}`}
              className="p-6 bg-white border border-stone-200 rounded-sm"
            >
              <h3 className="font-semibold text-stone-900 text-lg mb-2 font-sans">
                {item.title}
              </h3>
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
