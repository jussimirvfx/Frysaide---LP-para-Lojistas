export interface LeadFormData {
  nome: string;
  nomeLoja: string;
  whatsapp: string;
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
