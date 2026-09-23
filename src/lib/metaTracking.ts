import { buildLeadWebhookPayload } from './leadRequest';
import { isLeadBlockedByCuration } from './leadScoring';
import type { LeadFormData } from '../types';

export function prepareMetaLead(data: LeadFormData) {
  const payload = buildLeadWebhookPayload(data, new Date().toISOString(), '');
  // Only matching fields and scoring metadata go to Meta, never the full form/CNPJ.
  const { name, email, phone, city, state, country, value, currency, content_name, content_category,
    lead_score, lead_priority, disqualified, lead_score_breakdown, lead_score_raw_total } = payload;
  return { name, email, phone, city, state, country, value, currency, content_name, content_category,
    lead_score, lead_priority, disqualified, lead_score_breakdown, lead_score_raw_total };
}

export type MetaLead = ReturnType<typeof prepareMetaLead>;
export type LeadTracker = (data: MetaLead) => Promise<unknown>;

export async function trackValidatedLead(data: LeadFormData, trackLead: LeadTracker, trackLeadQualificado: LeadTracker) {
  if (isLeadBlockedByCuration(data)) return;
  const lead = prepareMetaLead(data);
  for (const track of lead.lead_score >= 70 && !lead.disqualified ? [trackLead, trackLeadQualificado] : [trackLead]) {
    try { await track(lead); }
    catch { console.warn('META_TRACKING_FAILED: o envio comercial foi preservado.'); }
  }
}
