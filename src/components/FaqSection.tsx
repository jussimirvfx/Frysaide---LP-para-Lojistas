import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqList = [
  { question: 'Qual é a grade de tamanhos?', answer: 'A linha de moda vai do PP ao GG, e o jeans do 34 ao 46.' },
  { question: 'Quais são as formas de pagamento?', answer: 'A marca trabalha com boleto em até 6 vezes, cartão de crédito, PIX e depósito.' },
  { question: 'Como funciona a exclusividade comercial?', answer: 'A exclusividade pode variar conforme o cliente, a região e o volume de compra. Consulte nossa equipe para entender as condições para sua cidade.' },
  { question: 'Quais tecidos e materiais a Frysaide trabalha?', answer: 'A marca trabalha com linho, alfaiataria Sensoriale, tule, malharia canelada, jeans, sarja e, em coleções específicas, couro.' }
];

export const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <section id="faq-section" className="section-space bg-[#353535] text-white border-b border-white/10">
      <div className="max-w-3xl mx-auto">
        <h2 className="section-title text-center mb-12">Dúvidas frequentes do lojista</h2>
        <div className="space-y-4">
          {faqList.map((item, index) => (
            <div key={item.question} className="border border-white/20">
              <button type="button" id={`faq-question-${index}`} aria-expanded={openIndex === index} aria-controls={`faq-answer-${index}`} onClick={() => setOpenIndex(openIndex === index ? null : index)} className="w-full flex items-center justify-between gap-4 text-left px-5 sm:px-6 py-5 hover:bg-white/5 transition-colors">
                <span className="text-base sm:text-lg">{item.question}</span>
                <ChevronDown aria-hidden="true" className={`w-5 h-5 shrink-0 text-white/60 transition-transform ${openIndex === index ? 'rotate-180' : ''}`} />
              </button>
              <div id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-question-${index}`} hidden={openIndex !== index} className="px-5 sm:px-6 py-5 border-t border-white/10 text-white/80 leading-relaxed">{item.answer}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
