import React from 'react';

const collectionImages = [
  {
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    alt: 'Alfaiataria e moda feminina contemporânea Frysaide'
  },
  {
    url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80',
    alt: 'Conjunto em linho e modelagem feminina'
  },
  {
    url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80',
    alt: 'Peças em corte refinado para boutiques e multimarcas'
  },
  {
    url: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=900&q=80',
    alt: 'Design autoral e acabamento em alfaiataria'
  },
  {
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80',
    alt: 'Vestido e moda feminina elegante para mulheres de 25 a 45 anos'
  },
  {
    url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&q=80',
    alt: 'Linha jeans e sarja com grade do 34 ao 46'
  }
];

export const CollectionSection: React.FC = () => {
  return (
    <section id="collection-section" className="py-20 sm:py-24 px-4 sm:px-6 bg-white border-b border-stone-200">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 
            id="collection-title"
            className="font-brand-serif text-2xl sm:text-3xl md:text-4xl text-stone-900 mb-4"
          >
            Design que valoriza a sua vitrine e atrai a cliente no ponto de venda
          </h2>
          <p 
            id="collection-support-text"
            className="text-stone-600 text-base sm:text-lg leading-relaxed"
          >
            Peças desenvolvidas em alfaiataria sensoriale, linho, sarja, malharia canelada e jeans, com grade de moda do PP ao GG e jeans do 34 ao 46.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {collectionImages.map((img, index) => (
            <div 
              key={index}
              id={`collection-item-${index}`}
              className="group overflow-hidden bg-stone-100 aspect-[3/4] border border-stone-200"
            >
              <img
                src={img.url}
                alt={img.alt}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500 ease-out"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
