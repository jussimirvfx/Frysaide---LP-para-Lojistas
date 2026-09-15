const collectionImages = [
  { url: '/images/colecao-6.png', alt: 'Modelo loira usando vestido preto' },
  { url: '/images/colecao-1.png', alt: 'Modelo morena usando conjunto claro em ambiente escuro' },
  { url: '/images/colecao-2.png', alt: 'Modelo morena usando vestido vermelho, sentada em um sofá' },
  { url: '/images/colecao-3.png', alt: 'Modelo morena usando conjunto listrado azul e branco na praia' },
  { url: '/images/colecao-4.png', alt: 'Modelo morena usando look roxo diante de uma parede de mármore' },
  { url: '/images/colecao-5.png', alt: 'Modelo loira usando conjunto claro com listras em ambiente externo com plantas' }
];

export const CollectionSection = () => (
  <section id="collection-section" className="section-space bg-white border-b border-neutral-200">
    <div className="max-w-6xl mx-auto">
      <div id="collection-title" className="text-center max-w-3xl mx-auto mb-12">
        <p className="font-nightmare text-5xl sm:text-6xl mb-4">Coleção Verão</p>
        <h2 className="text-xl sm:text-2xl leading-tight">Design que ganha espaço na sua vitrine.</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {collectionImages.map((image, index) => (
          <div key={image.url} id={`collection-item-${index}`} className="overflow-hidden bg-neutral-100 aspect-[4/5]">
            <img src={image.url} alt={image.alt} loading="lazy" className="w-full h-full object-cover object-center" />
          </div>
        ))}
      </div>
    </div>
  </section>
);
