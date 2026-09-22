import type { LeadFormData } from '../types.js';
import { CNPJ_ERROR, cnpjDigits, formatCnpj, isValidCnpj } from './cnpj.js';
import { TIPO_LOJA_OPTIONS } from './formOptions.js';

const requiredFields: (keyof LeadFormData)[] = [
  'nome',
  'nomeLoja',
  'whatsapp',
  'email',
  'cidade',
  'estado',
  'cnpj',
  'instagramLoja',
  'tipoLoja',
  'lojaFisica',
  'tempoCnpj'
];

export const phoneDigits = (value: string) => value.replace(/\D/g, '');

export function buildLeadWebhookPayload(
  input: LeadFormData,
  submittedAt: string,
  sourceUrl: string
) {
  for (const field of requiredFields) {
    if (!String(input[field] ?? '').trim()) throw new Error(`Campo obrigatório ausente: ${field}`);
  }

  if (!isValidCnpj(input.cnpj)) throw new Error(CNPJ_ERROR);

  const whatsappDigits = phoneDigits(input.whatsapp);
  if (![10, 11].includes(whatsappDigits.length)) throw new Error('WhatsApp inválido.');

  if (!TIPO_LOJA_OPTIONS.includes(input.tipoLoja as (typeof TIPO_LOJA_OPTIONS)[number])) {
    throw new Error('Tipo de loja inválido.');
  }

  return {
    ...input,
    cnpj: formatCnpj(input.cnpj),
    cnpj_digits: cnpjDigits(input.cnpj),
    cnpj_validation_status: 'checksum_valid' as const,
    submittedAt,
    source: 'frysaide-lojista',
    url: sourceUrl
  };
}
