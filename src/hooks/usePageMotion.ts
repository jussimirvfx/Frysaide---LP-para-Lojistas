import { useEffect, useRef } from 'react';

const revealSelectors = [
  '#hero-title', '#hero-cta-btn', '#collection-title', '[id^="collection-item-"]',
  '#authority-numbers-section h2', '#authority-numbers-section .grid > div',
  '#about-section > div:last-child', '#benefits-section h2', '#benefits-section li',
  '#partnership-steps h2', '#partnership-steps li', '#faq-section h2',
  '#faq-section .space-y-4 > div', '#formulario-contato .backdrop-blur-xl',
  '#footer-section img', '#footer-section p', '[data-motion-photo]'
].join(',');

export function usePageMotion() {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const elements = [...root.querySelectorAll<HTMLElement>(revealSelectors)];
    let observer: IntersectionObserver | undefined;
    const show = (element: HTMLElement) => {
      element.classList.add('reveal-visible');

    };
    const reset = () => {
      observer?.disconnect();
      elements.forEach(element => {
        element.classList.remove('reveal-ready', 'reveal-visible');
        element.style.removeProperty('--reveal-delay');
      });
    };
    const initialize = () => {
      reset();
      if (preference.matches) return;
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const element = entry.target as HTMLElement;
          if (entry.isIntersecting) show(element);
          else if (!element.contains(document.activeElement)) element.classList.remove('reveal-visible');
        });
      }, { threshold: 0.08 });
      const groupCounts = new Map<Element, number>();
      elements.forEach(element => {
        const group = element.parentElement!;
        const index = groupCounts.get(group) ?? 0;
        groupCounts.set(group, index + 1);
        element.style.setProperty('--reveal-delay', `${Math.min(index * 70, 210)}ms`);
        element.classList.add('reveal-ready');
        observer!.observe(element);
      });
    };
    const handleFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest<HTMLElement>('.reveal-ready');
      if (element) show(element);
    };
    initialize();
    preference.addEventListener('change', initialize);
    root.addEventListener('focusin', handleFocus);
    return () => {
      reset();
      preference.removeEventListener('change', initialize);
      root.removeEventListener('focusin', handleFocus);
    };
  }, []);
  return rootRef;
}
