import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CollectionSection } from './components/CollectionSection';
import { AuthorityNumbers } from './components/AuthorityNumbers';
import { AboutSection } from './components/AboutSection';
import { BenefitsSection } from './components/BenefitsSection';
import { FaqSection } from './components/FaqSection';
import { LeadForm } from './components/LeadForm';
import { Footer } from './components/Footer';

export default function App() {
  const scrollToForm = () => {
    const formElement = document.getElementById('formulario-contato');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbf9] text-stone-900 selection:bg-stone-200">
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

        {/* 7. FAQ */}
        <FaqSection />

        {/* 8. FORMULÁRIO */}
        <LeadForm />
      </main>

      <Footer />
    </div>
  );
}
