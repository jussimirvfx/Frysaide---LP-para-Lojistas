import { useState, type ChangeEvent, type FormEvent } from 'react';
import { CNPJ_ERROR, cnpjDigits, formatCnpj, isValidCnpj } from '../lib/cnpj';
import { sendLead } from '../lib/sendLead';
import type { LeadFormData } from '../types';

const initialFormData: LeadFormData = { nome: '', nomeLoja: '', whatsapp: '', email: '', cidade: '', estado: '', cnpj: '', instagramLoja: '', marcasVendidas: '', tipoLoja: '', lojaFisica: '', tempoCnpj: '' };
const fields: { name: keyof LeadFormData; label: string; type?: string; autoComplete?: string; placeholder?: string; optional?: boolean }[] = [
  { name: 'nome', label: 'Nome completo', autoComplete: 'name' },
  { name: 'nomeLoja', label: 'Nome da loja', autoComplete: 'organization' },
  { name: 'whatsapp', label: 'WhatsApp com DDD', type: 'tel', autoComplete: 'tel', placeholder: '(00) 00000-0000' },
  { name: 'email', label: 'E-mail', type: 'email', autoComplete: 'email' },
  { name: 'cidade', label: 'Cidade', autoComplete: 'address-level2' },
  { name: 'estado', label: 'Estado', autoComplete: 'address-level1' },
  { name: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0000-00' },
  { name: 'instagramLoja', label: 'Instagram da loja', placeholder: '@sualoja' }
];
const states = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const qualificationFields: { name: keyof LeadFormData; label: string; options: string[] }[] = [
  { name: 'tipoLoja', label: 'Tipo de loja', options: ['Multimarcas / Boutique', 'Loja de shopping', 'Loja online', 'Magazine', 'Revendedor autônomo'] },
  { name: 'lojaFisica', label: 'Possui loja física?', options: ['Sim', 'Não'] },
  { name: 'tempoCnpj', label: 'Tempo de CNPJ', options: ['Menos de 1 ano', '1 a 3 anos', '3 a 5 anos', 'Mais de 5 anos'] }
];

export const LeadForm = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [cnpjError, setCnpjError] = useState('');
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    const normalized = name === 'cnpj' ? formatCnpj(value) : value;
    if (name === 'cnpj') {
      setCnpjError(cnpjDigits(normalized).length === 14 && !isValidCnpj(normalized) ? CNPJ_ERROR : '');
    }
    setFormData(previous => ({ ...previous, [name]: normalized }));
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidCnpj(formData.cnpj)) {
      setCnpjError(CNPJ_ERROR);
      event.currentTarget.querySelector<HTMLInputElement>('#cnpj')?.focus();
      return;
    }
    setCnpjError('');
    const endpoint = import.meta.env.VITE_LEAD_FORM_ENDPOINT;
    if (!endpoint) {
      setError('O envio está temporariamente indisponível. Tente novamente mais tarde.');
      setStatus('error');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      await sendLead(formData, endpoint);
      setStatus('success');
    } catch {
      setError('Não foi possível enviar seus dados. Por favor, tente novamente.');
      setStatus('error');
    }
  };
  return (
    <section id="formulario-contato" className="section-space relative isolate bg-neutral-900">
      <img src="/images/fundo-formulario.png" alt="" loading="lazy" className="absolute inset-0 -z-20 w-full h-full object-cover object-[25%_center]" />
      <div className="absolute inset-0 -z-10 bg-black/15" />
      <div className="max-w-7xl mx-auto flex justify-end">
        <div className="w-full max-w-2xl lg:w-1/2 bg-white/65 lg:bg-white/45 backdrop-blur-xl border border-white/40 shadow-xl p-6 sm:p-8 lg:p-10">
        <div className="text-left mb-8">
          <h2 id="form-title" className="section-title mb-4">Leve Frysaide para a sua loja.</h2>
          <p className="text-neutral-600 text-base sm:text-lg">Preencha seus dados e nossa equipe comercial entrará em contato.</p>
        </div>
        {status === 'success' ? (
          <div id="form-success-message" role="status" className="py-8 text-center">
            <h3 className="text-2xl mb-4">Solicitação recebida com sucesso.</h3>
            <button id="form-reset-btn" type="button" onClick={() => { setFormData(initialFormData); setStatus('idle'); setCnpjError(''); }} className="underline underline-offset-4">Enviar outra solicitação</button>
          </div>
        ) : (
          <form id="lead-capture-form" onSubmit={handleSubmit} aria-labelledby="form-title" className="bg-transparent">
            <fieldset disabled={status === 'sending'} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              <legend className="sr-only">Dados de contato e da loja</legend>
              {fields.map(field => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="block text-sm font-medium mb-2">{field.label}{field.optional ? '' : ' *'}</label>
                  {field.name === 'estado' ? (
                    <select id="estado" name="estado" required autoComplete={field.autoComplete} value={formData.estado} onChange={handleChange} className="form-field bg-white/65 border-black/20">
                      <option value="">Selecione</option>
                      {states.map(state => <option key={state} value={state}>{state}</option>)}
                    </select>
                  ) : (
                    <input id={field.name} name={field.name} type={field.type || 'text'} required={!field.optional} inputMode={field.name === 'cnpj' ? 'numeric' : undefined} maxLength={field.name === 'cnpj' ? 18 : undefined} aria-invalid={field.name === 'cnpj' ? Boolean(cnpjError) : undefined} aria-describedby={field.name === 'cnpj' && cnpjError ? 'cnpj-error' : undefined} onInvalid={field.name === 'cnpj' ? () => setCnpjError(CNPJ_ERROR) : undefined} autoComplete={field.autoComplete} placeholder={field.placeholder} value={formData[field.name]} onChange={handleChange} className="form-field bg-white/65 border-black/20" />
                  )}
                  {field.name === 'cnpj' && cnpjError && <p id="cnpj-error" role="alert" className="text-sm mt-2">{cnpjError}</p>}
                </div>
              ))}
              <div className="md:col-span-2">
                <label htmlFor="marcasVendidas" className="block text-sm font-medium mb-2">Principais marcas que a loja vende</label>
                <input id="marcasVendidas" name="marcasVendidas" type="text" value={formData.marcasVendidas} onChange={handleChange} className="form-field bg-white/65 border-black/20" />
              </div>
              {qualificationFields.map(field => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="block text-sm font-medium mb-2">{field.label} *</label>
                  <select id={field.name} name={field.name} required value={formData[field.name]} onChange={handleChange} className="form-field bg-white/65 border-black/20">
                    <option value="">Selecione</option>
                    {field.options.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
              ))}
              {status === 'error'  && <p role="alert" className="md:col-span-2 text-sm">{error}</p>}
              <button id="submit-form-btn" type="submit" className="cta md:col-span-2 w-full mt-2 bg-black text-white hover:bg-neutral-800 disabled:opacity-60">{status === 'sending' ? 'Enviando…' : 'QUERO SER LOJISTA PARCEIRO'}</button>
            </fieldset>
          </form>
        )}
        </div>
      </div>
    </section>
  );
};
