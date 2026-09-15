import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FaqItem } from '../types';

const faqList: FaqItem[] = [
  {
    id: 'faq-1',
    pergunta: 'Como faço para revender Frysaide?',
    resposta: 'Basta preencher o formulário abaixo com os dados da sua loja. Nossa equipe comercial entrará em contato para apresentar a coleção e iniciar o cadastro.'
  },
  {
    id: 'faq-2',
    pergunta: 'Quais são as formas de pagamento?',
    resposta: 'Trabalhamos com boleto bancário em até 6 vezes, cartão de crédito, PIX e depósito.'
  },
  {
    id: 'faq-3',
    pergunta: 'Qual é a grade de tamanhos?',
    resposta: 'A linha de moda vai do PP ao GG, e a linha de jeans atende do tamanho 34 ao 46.'
  },
  {
    id: 'faq-4',
    pergunta: 'A marca oferece materiais para divulgação?',
    resposta: 'Sim. Disponibilizamos fotos e vídeos dos produtos para uso em redes sociais, displays e brindes para ações no seu ponto de venda e kit de boas-vindas.'
  },
  {
    id: 'faq-5',
    pergunta: 'Como funciona o frete?',
    resposta: 'O frete é pago pela empresa para a entrega na sua loja.'
  },
  {
    id: 'faq-6',
    pergunta: 'Como funciona a reposição?',
    resposta: 'Temos estrutura interna e suporte dedicado com produtos disponíveis a pronta entrega para reposições ágeis.'
  },
  {
    id: 'faq-7',
    pergunta: 'Qual é a condição de pedido?',
    resposta: 'Consulte nossa equipe para conhecer as condições de pedido.'
  }
];

export const FaqSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const toggleFaq = (id: string) => {
    setOpenId(prev => (prev === id ? null : id));
  };

  return (
    <section id="faq-section" className="py-20 sm:py-24 px-4 sm:px-6 bg-white border-b border-stone-200">
      <div className="max-w-3xl mx-auto">
        <h2 
          id="faq-title"
          className="font-brand-serif text-2xl sm:text-3xl md:text-4xl text-stone-900 mb-12 text-center"
        >
          Dúvidas frequentes do lojista
        </h2>

        <div className="space-y-4">
          {faqList.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div 
                key={item.id}
                id={item.id}
                className="border border-stone-200 rounded-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(item.id)}
                  className="w-full text-left px-5 sm:px-6 py-4 flex items-center justify-between bg-stone-50/50 hover:bg-stone-50 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-stone-900 text-base sm:text-lg">
                    {item.pergunta}
                  </span>
                  <ChevronDown 
                    className={`w-5 h-5 text-stone-500 shrink-0 ml-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                  />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 py-4 bg-white border-t border-stone-100">
                    <p className="text-stone-600 text-base leading-relaxed">
                      {item.resposta}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
