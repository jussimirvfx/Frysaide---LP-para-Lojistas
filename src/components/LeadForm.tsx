import { useState, type ChangeEvent, type FocusEvent, type FormEvent } from 'react';
import { CNPJ_ERROR, cnpjDigits, formatCnpj, getCnpjFieldError, isValidCnpj } from '../lib/cnpj';
import { CNPJ_LOOKUP_ERROR, consultarCnpj } from '../lib/cnpjLookup';
import { LOJA_FISICA_OPTIONS, TIPO_LOJA_OPTIONS } from '../lib/formOptions';
import { formatTelefone, logLeadScoreNoConsole, validarEmail, validarTelefoneCompleto } from '../lib/leadScoring';
import { sendLead } from '../lib/sendLead';
import type { LeadFormData } from '../types';
import { useMetaPixel } from 'scoretrack';
import { trackValidatedLead } from '../lib/metaTracking';

const initialFormData: LeadFormData = { nome: '', nomeLoja: '', telefone: '', email: '', cidade: '', estado: '', cnpj: '', instagramLoja: '', marcasVendidas: '', tipoLoja: '', lojaFisica: '', tempoCnpj: '' };
const fields: { name: keyof LeadFormData; label: string; type?: string; autoComplete?: string; placeholder?: string; optional?: boolean }[] = [
  { name: 'nome', label: 'Nome completo', autoComplete: 'name' },
  { name: 'nomeLoja', label: 'Nome da loja', autoComplete: 'organization' },
  { name: 'telefone', label: 'WhatsApp com DDD', type: 'tel', autoComplete: 'tel', placeholder: '(00) 00000-0000' },
  { name: 'email', label: 'E-mail', type: 'email', autoComplete: 'email' },
  { name: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0000-00' },
  { name: 'instagramLoja', label: 'Instagram da loja', placeholder: '@sualoja' }
];
type QualificationOption = { readonly value: string; readonly label: string };
const qualificationFields: { name: keyof LeadFormData; label: string; options: readonly QualificationOption[] }[] = [
  { name: 'tipoLoja', label: 'Qual o tipo da loja?', options: TIPO_LOJA_OPTIONS },
  { name: 'lojaFisica', label: 'Possui loja física?', options: LOJA_FISICA_OPTIONS }
];

export const LeadForm = () => {
  const { trackLead, trackLeadQualificado } = useMetaPixel();
  const [formData, setFormData] = useState(initialFormData);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [cnpjError, setCnpjError] = useState('');
  const [telefoneError, setTelefoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    const normalized = name === 'cnpj' ? formatCnpj(value) : name === 'telefone' ? formatTelefone(value) : value;
    if (name === 'cnpj') {
      setCnpjError(cnpjDigits(normalized).length === 14 && !isValidCnpj(normalized) ? CNPJ_ERROR : '');
    }
    if (name === 'telefone') setTelefoneError('');
    if (name === 'email') setEmailError('');
    setFormData(previous => ({ ...previous, [name]: normalized }));
  };
  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (event.target.name !== 'cnpj') return;
    setCnpjError(getCnpjFieldError(event.target.value));
  };
  const handleTelefoneBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (!event.target.value) return;
    const validation = validarTelefoneCompleto(event.target.value);
    setTelefoneError(validation.valido ? '' : validation.erro || 'Telefone inválido.');
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidCnpj(formData.cnpj)) {
      setCnpjError(CNPJ_ERROR);
      event.currentTarget.querySelector<HTMLInputElement>('#cnpj')?.focus();
      return;
    }
    const phoneValidation = validarTelefoneCompleto(formData.telefone);
    if (!phoneValidation.valido) {
      setTelefoneError(phoneValidation.erro || 'Telefone inválido.');
      event.currentTarget.querySelector<HTMLInputElement>('#telefone')?.focus();
      return;
    }
    if (!validarEmail(formData.email)) {
      setEmailError('Digite um e-mail válido.');
      event.currentTarget.querySelector<HTMLInputElement>('#email')?.focus();
      return;
    }
    setCnpjError('');
    setTelefoneError('');
    setEmailError('');
    setStatus('sending');
    setError('');
    try {
      const cnpjData = await consultarCnpj(formData.cnpj);
      const enrichedFormData = {
        ...formData,
        cidade: cnpjData.cidade,
        estado: cnpjData.estado,
        tempoCnpj: cnpjData.tempoCnpj
      };
      logLeadScoreNoConsole(enrichedFormData);
      await sendLead(enrichedFormData, '/api/leads');
      setStatus('success');
      void trackValidatedLead(enrichedFormData, trackLead, trackLeadQualificado);
    } catch (submissionError) {
      setError(submissionError instanceof Error && submissionError.message === CNPJ_LOOKUP_ERROR
        ? CNPJ_LOOKUP_ERROR
        : 'Não foi possível enviar seus dados. Por favor, tente novamente.');
      setStatus('error');
    }
  };
  return (
    <section id="cta-form" className="section-space relative isolate bg-neutral-900">
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
            <p className="text-neutral-700 mb-6">Obrigado pelo interesse. Nossa equipe entrará em contato em breve.</p>
            <button id="form-reset-btn" type="button" onClick={() => { setFormData(initialFormData); setStatus('idle'); setCnpjError(''); setTelefoneError(''); setEmailError(''); }} className="underline underline-offset-4">Enviar outra solicitação</button>
          </div>
        ) : (
          <form id="lead-capture-form" onSubmit={handleSubmit} aria-labelledby="form-title" className="bg-transparent">
            <fieldset disabled={status === 'sending'} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              <legend className="sr-only">Dados de contato e da loja</legend>
              {fields.map(field => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="block text-sm font-medium mb-2">{field.label}{field.optional ? '' : ' *'}</label>
                  <input id={field.name} name={field.name} type={field.type || 'text'} required={!field.optional} inputMode={field.name === 'cnpj' || field.name === 'telefone' ? 'numeric' : undefined} maxLength={field.name === 'cnpj' ? 18 : field.name === 'telefone' ? 15 : undefined} aria-invalid={field.name === 'cnpj' ? Boolean(cnpjError) : field.name === 'telefone' ? Boolean(telefoneError) : field.name === 'email' ? Boolean(emailError) : undefined} aria-describedby={field.name === 'cnpj' && cnpjError ? 'cnpj-error' : field.name === 'telefone' && telefoneError ? 'telefone-error' : field.name === 'email' && emailError ? 'email-error' : undefined} onInvalid={field.name === 'cnpj' ? () => setCnpjError(CNPJ_ERROR) : undefined} onBlur={field.name === 'cnpj' ? handleBlur : field.name === 'telefone' ? handleTelefoneBlur : undefined} autoComplete={field.autoComplete} placeholder={field.placeholder} value={formData[field.name]} onChange={handleChange} className="form-field bg-white/65 border-black/20" />
                  {field.name === 'cnpj' && cnpjError && <p id="cnpj-error" role="alert" className="text-sm mt-2">{cnpjError}</p>}
                  {field.name === 'telefone' && telefoneError && <p id="telefone-error" role="alert" className="text-sm mt-2">{telefoneError}</p>}
                  {field.name === 'email' && emailError && <p id="email-error" role="alert" className="text-sm mt-2">{emailError}</p>}
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
                    {field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
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
