export interface LeadFormData {
  nome: string;
  nomeLoja: string;
  whatsapp: string;
  email: string;
  cnpj: string;
  cidadeEstado: string;
  marcasVendidas: string;
  instagramLoja: string;
  comoConheceu: string;
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
