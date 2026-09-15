import { Truck, Images, PackageCheck, Headset } from 'lucide-react';

const benefits = [
  { title: 'Frete pago pela marca', icon: Truck },
  { title: 'Materiais de divulgação', icon: Images },
  { title: 'Suporte para reposições', icon: PackageCheck },
  { title: 'Suporte comercial próximo', icon: Headset }
];

export const BenefitsSection = () => (
  <section id="benefits-section" className="section-space bg-white border-b border-neutral-200">
    <div className="max-w-6xl mx-auto">
      <h2 className="section-title max-w-2xl mx-auto text-center mb-12">Mais do que produto, uma parceria para sua loja.</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {benefits.map(({ title, icon: Icon }) => (
          <li key={title} className="flex flex-col items-center justify-center gap-5 text-center min-h-44 p-8 border border-neutral-200 bg-neutral-50 rounded-none text-lg sm:text-xl">
            <Icon aria-hidden="true" className="w-8 h-8" strokeWidth={1.5} />
            <span>{title}</span>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
