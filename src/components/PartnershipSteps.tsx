const steps = ['Preencha seus dados.', 'Nossa equipe comercial entra em contato com você.', 'Conheça as condições e faça seu pedido.'];

export const PartnershipSteps = () => (
  <section id="partnership-steps" className="grid md:grid-cols-2 bg-white">
    <div className="flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-16 md:py-20">
      <h2 className="section-title max-w-xl mb-10">Como ser um lojista parceiro</h2>
      <ol className="flex flex-col gap-8 max-w-xl">
        {steps.map((step, index) => (
          <li key={step} className="step-motion relative overflow-hidden border-t border-neutral-200 pt-6">
            <span className="block text-xs tracking-[0.2em] text-neutral-500 mb-3">PASSO {index + 1}</span>
            <p className="text-lg leading-relaxed">{step}</p>
          </li>
        ))}
      </ol>
    </div>
    <div data-motion-photo className="photo-reveal relative overflow-hidden min-h-[400px] md:min-h-[600px] bg-neutral-100">
      <div className="panorama-surface absolute inset-0">
      <img src="/images/como-ser-parceiro.png" alt="Modelo sentada usando conjunto branco" loading="lazy" className="entrance-photo absolute inset-0 w-full h-full object-cover object-center" />
      </div>
    </div>
  </section>
);
