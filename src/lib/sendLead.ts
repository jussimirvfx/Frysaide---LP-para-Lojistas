import type { LeadFormData } from '../types';
import { CNPJ_ERROR, formatCnpj, isValidCnpj } from './cnpj';

export async function sendLead(data: LeadFormData, endpoint: string, request: typeof fetch = fetch) {
  if (!isValidCnpj(data.cnpj)) throw new Error(CNPJ_ERROR);
  const payload = { ...data, cnpj: formatCnpj(data.cnpj), cnpj_validation_status: 'checksum_valid' as const };
  const response = await request(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Submission failed');
}
