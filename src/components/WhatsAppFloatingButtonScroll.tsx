import { useEffect, useState } from 'react';

const WhatsAppIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.86 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.418-8.214" />
  </svg>
);

interface Props {
  formId?: string;
  brandName?: string;
}

export default function WhatsAppFloatingButtonScroll({ formId = 'cta-form', brandName = 'Frysaide' }: Props) {
  const [showCallout, setShowCallout] = useState(false);

  useEffect(() => {
    const showTimer = window.setTimeout(() => setShowCallout(true), 6000);
    return () => window.clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!showCallout) return;
    const hideTimer = window.setTimeout(() => setShowCallout(false), 12000);
    return () => window.clearTimeout(hideTimer);
  }, [showCallout]);

  const handleScrollToForm = () => {
    setShowCallout(false);
    const formElement = document.getElementById(formId);
    if (!formElement) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    formElement.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    window.setTimeout(() => formElement.querySelector<HTMLElement>('input, select, textarea')?.focus(), reducedMotion ? 0 : 700);
  };

  return (
    <>
      {showCallout && (
        <aside id="whatsapp-form-callout" role="status" className="whatsapp-callout fixed bottom-28 right-4 z-40 w-[min(22rem,calc(100vw-2rem))] border border-black bg-white p-4 shadow-xl">
          <button type="button" onClick={() => setShowCallout(false)} className="absolute right-3 top-3 p-1 text-neutral-500 hover:text-black" aria-label="Fechar mensagem">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
          <p className="pr-7 text-sm leading-relaxed text-neutral-800">
            Quer ser lojista parceiro <strong>{brandName}</strong>? Vá direto ao formulário.
          </p>
        </aside>
      )}
      <button
        type="button"
        onClick={handleScrollToForm}
        className="whatsapp-float fixed bottom-4 right-4 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:bg-[#1fba59]"
        aria-label={`Ir para o formulário de parceria ${brandName}`}
        aria-describedby={showCallout ? 'whatsapp-form-callout' : undefined}
      >
        <WhatsAppIcon />
      </button>
    </>
  );
}
