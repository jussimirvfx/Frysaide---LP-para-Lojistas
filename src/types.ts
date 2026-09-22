export interface LeadFormData {
  nome: string;
  nomeLoja: string;
  telefone: string;
  email: string;
  cnpj: string;
  cidade: string;
  estado: string;
  instagramLoja: string;
  marcasVendidas: string;
  tipoLoja: string;
  lojaFisica: string;
  tempoCnpj: string;
}

export type LeadPriority = 'high' | 'medium' | 'low' | 'disqualified';

export interface LeadSubmissionContext {
  timestamp: string;
  pageUrl: string;
  userAgent: string;
  referrer: string;
}

export interface FaqItem {
  id: string;
  pergunta: string;
  resposta: string;
}

export interface AuthorityNumber {
  numero: string;
  descricao: string;
}

export interface CommercialBenefit {
  titulo: string;
  descricao: string;
}
