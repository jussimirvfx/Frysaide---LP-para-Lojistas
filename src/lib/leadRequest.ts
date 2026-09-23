import type { LeadFormData } from '../types.js';
import { CNPJ_ERROR, cnpjDigits, formatCnpj, isValidCnpj } from './cnpj.js';
import { calculateLeadQualification, converterParaE164, formatTelefone, isValidQualificationOption, qualificationOptionFor, validarEmail, validarTelefoneCompleto } from './leadScoring.js';

const requiredFields: (keyof LeadFormData)[] = [
  'nome',
  'nomeLoja',
  'telefone',
  'email',
  'cnpj',
  'instagramLoja',
  'tipoLoja',
  'lojaFisica'
];

export function buildLeadWebhookPayload(
  input: LeadFormData,
  timestamp: string,
  pageUrl: string,
  userAgent = '',
  referrer = 'direct'
) {
  if (!input || !isValidCnpj(input.cnpj || '')) throw new Error(CNPJ_ERROR);

  for (const field of requiredFields) {
    if (!String(input[field] ?? '').trim()) throw new Error(`Campo obrigatório ausente: ${field}`);
  }

  const phoneValidation = validarTelefoneCompleto(input.telefone);
  if (!phoneValidation.valido) throw new Error(phoneValidation.erro);
  if (!validarEmail(input.email)) throw new Error('E-mail inválido.');

  if (!isValidQualificationOption(0, input.tipoLoja)) throw new Error('Tipo de loja inválido.');
  if (!isValidQualificationOption(1, input.lojaFisica)) throw new Error('Resposta sobre loja física inválida.');
  if (input.tempoCnpj && !isValidQualificationOption(2, input.tempoCnpj)) throw new Error('Tempo de CNPJ inválido.');

  const qualification = calculateLeadQualification(input);
  const storeType = qualificationOptionFor(0, input.tipoLoja);
  const physicalStore = qualificationOptionFor(1, input.lojaFisica);
  const cnpjAge = qualificationOptionFor(2, input.tempoCnpj);

  return {
    ...input,
    nome: input.nome.trim(),
    email: input.email.trim().toLowerCase(),
    telefone: formatTelefone(input.telefone),
    whatsapp: formatTelefone(input.telefone),
    tipoLoja: storeType?.label,
    tipoLoja_value: input.tipoLoja,
    lojaFisica: physicalStore?.label,
    lojaFisica_value: input.lojaFisica,
    tempoCnpj: cnpjAge?.label ?? '',
    tempoCnpj_value: input.tempoCnpj,
    cnpj: formatCnpj(input.cnpj),
    cnpj_digits: cnpjDigits(input.cnpj),
    cnpj_validation_status: 'checksum_valid' as const,
    name: input.nome.trim(),
    phone: converterParaE164(input.telefone),
    city: input.cidade.trim(),
    state: input.estado,
    country: 'BR',
    value: qualification.score,
    currency: 'BRL',
    content_name: 'Formulário de Contato',
    content_category: 'Lead Generation',
    lead_score: qualification.score,
    lead_score_breakdown: qualification.breakdown,
    lead_score_raw_total: qualification.rawTotal,
    lead_priority: qualification.priority,
    disqualified: qualification.disqualified,
    disqualification_reasons: qualification.disqualificationReasons,
    timestamp,
    submittedAt: timestamp,
    source: 'landing-page',
    user_agent: userAgent,
    page_url: pageUrl,
    url: pageUrl,
    referrer: referrer || 'direct'
  };
}

export function normalizeSubmittedLead(body: LeadFormData & {
  tipoLoja_value?: string;
  lojaFisica_value?: string;
  tempoCnpj_value?: string;
}): LeadFormData {
  return {
    ...body,
    tipoLoja: body.tipoLoja_value || body.tipoLoja,
    lojaFisica: body.lojaFisica_value || body.lojaFisica,
    tempoCnpj: body.tempoCnpj_value || body.tempoCnpj
  };
}
