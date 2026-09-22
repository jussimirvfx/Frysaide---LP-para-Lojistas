import { usePageMotion } from './hooks/usePageMotion';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CollectionSection } from './components/CollectionSection';
import { AuthorityNumbers } from './components/AuthorityNumbers';
import { AboutSection } from './components/AboutSection';
import { BenefitsSection } from './components/BenefitsSection';
import { PartnershipSteps } from './components/PartnershipSteps';
import { FaqSection } from './components/FaqSection';
import { LeadForm } from './components/LeadForm';
import { Footer } from './components/Footer';
import WhatsAppFloatingButtonScroll from './components/WhatsAppFloatingButtonScroll';

export default function App() {
  const motionRef = usePageMotion();
  const scrollToForm = () => {
    const formElement = document.getElementById('cta-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  };

  return (
    <div ref={motionRef} className="min-h-screen flex flex-col bg-white text-black selection:bg-neutral-200">
      {/* 1. NAVBAR */}
      <Navbar onCtaClick={scrollToForm} />

      <main className="flex-1">
        {/* 2. HERO */}
        <Hero onCtaClick={scrollToForm} />

        {/* 3. SEÇÃO DA COLEÇÃO / PRODUTOS */}
        <CollectionSection />

        {/* 4. NÚMEROS DE AUTORIDADE */}
        <AuthorityNumbers />

        {/* 5. SOBRE A FRYSAIDE */}
        <AboutSection />

        {/* 6. BENEFÍCIOS / PARCERIA COM O LOJISTA */}
        <BenefitsSection />

        <PartnershipSteps />

        {/* 8. FAQ */}
        <FaqSection />

        {/* 8. FORMULÁRIO */}
        <LeadForm />
      </main>

      <Footer />
      <WhatsAppFloatingButtonScroll formId="cta-form" brandName="Frysaide" />
    </div>
  );
}
