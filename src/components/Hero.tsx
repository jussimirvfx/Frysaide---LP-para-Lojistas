export const Hero = ({ onCtaClick }: { onCtaClick: () => void }) => (
  <section id="hero-section" className="relative isolate min-h-[640px] h-[100svh] max-h-[900px] flex items-end xl:items-center px-6 sm:px-10 lg:px-16 py-16 sm:py-20 md:py-12 xl:py-20 bg-neutral-900">
    <img src="/images/hero-frysaide.png" alt="Modelo da coleção Frysaide sentada em cenário com pedras e vegetação" fetchPriority="high" className="absolute inset-0 -z-20 w-full h-full object-cover object-[20%_center] md:object-left" />
    <div className="hero-overlay absolute inset-0 -z-10" />
    <div className="w-full max-w-6xl mx-auto">
      <div className="md:w-3/4 xl:ml-auto xl:w-1/2">
        <h1 id="hero-title" className="text-white text-4xl sm:text-5xl lg:text-6xl leading-[1.12] tracking-tight mb-8"><span className="font-nightmare text-[1.3em]">Lojista,</span> leve Frysaide para a sua loja.</h1>
        <button id="hero-cta-btn" onClick={onCtaClick} type="button" className="cta bg-white text-black hover:bg-neutral-100">QUERO SER LOJISTA PARCEIRO</button>
      </div>
    </div>
  </section>
);
