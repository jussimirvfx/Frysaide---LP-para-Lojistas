export const AboutSection = () => (
  <section id="about-section" className="grid md:grid-cols-2 bg-white border-b border-neutral-200">
    <div data-motion-photo className="photo-reveal relative overflow-hidden min-h-[400px] md:min-h-[560px] bg-neutral-100">
      <img src="/images/sobre-frysaide.png" alt="Modelo com vestido estampado claro em cenário com plantas" loading="lazy" className="absolute inset-0 w-full h-full object-cover object-center" />
    </div>
    <div className="flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-16 md:py-20">
      <h2 id="about-title" className="section-title max-w-xl mb-6">Uma marca mineira feita para crescer junto com a sua loja.</h2>
      <p className="max-w-xl text-neutral-600 text-base sm:text-lg leading-relaxed">Nascida em Minas Gerais, a Frysaide cria moda feminina com o design como um dos seus principais diferenciais. Coleções pensadas para compor o mix da sua multimarcas ou boutique.</p>
      <a href="#collection-section" className="cta self-start mt-8 bg-black text-white hover:bg-neutral-800">CONHEÇA A COLEÇÃO</a>
    </div>
  </section>
);
