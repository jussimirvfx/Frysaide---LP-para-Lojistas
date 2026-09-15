import React, { useState } from 'react';
import { LeadFormData } from '../types';

const initialFormData: LeadFormData = {
  nome: '',
  nomeLoja: '',
  whatsapp: '',
  email: '',
  cnpj: '',
  cidadeEstado: '',
  marcasVendidas: '',
  instagramLoja: '',
  comoConheceu: ''
};

export const LeadForm: React.FC = () => {
  const [formData, setFormData] = useState<LeadFormData>(initialFormData);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="formulario-contato" className="py-20 sm:py-24 px-4 sm:px-6 bg-[#fbfbf9]">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h2 
            id="form-title"
            className="font-brand-serif text-2xl sm:text-3xl md:text-4xl text-stone-900 mb-3"
          >
            Leve a Frysaide para a sua loja
          </h2>
          <p 
            id="form-subtitle"
            className="text-stone-600 text-base sm:text-lg"
          >
            Preencha os dados da sua empresa para receber o contato da nossa equipe comercial e conhecer as condições da coleção.
          </p>
        </div>

        {submitted ? (
          <div 
            id="form-success-message"
            className="p-8 bg-white border border-stone-200 text-center rounded-sm"
          >
            <h3 className="font-brand-serif text-2xl text-stone-900 mb-2">
              Solicitação recebida com sucesso.
            </h3>
            <p className="text-stone-600 text-base mb-6">
              A equipe comercial da Frysaide entrará em contato pelo WhatsApp informado para apresentar o catálogo e orientar o cadastro da sua loja.
            </p>
            <button
              type="button"
              id="form-reset-btn"
              onClick={() => {
                setFormData(initialFormData);
                setSubmitted(false);
              }}
              className="text-sm font-medium text-stone-900 underline hover:text-stone-700"
            >
              Enviar outra solicitação
            </button>
          </div>
        ) : (
          <form 
            id="lead-capture-form"
            onSubmit={handleSubmit} 
            className="bg-white border border-stone-200 p-6 sm:p-8 rounded-sm shadow-xs space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nome" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Nome do responsável *
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  required
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Seu nome completo"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-sm text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
                />
              </div>

              <div>
                <label htmlFor="nomeLoja" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Nome da loja *
                </label>
                <input
                  type="text"
                  id="nomeLoja"
                  name="nomeLoja"
                  required
                  value={formData.nomeLoja}
                  onChange={handleChange}
                  placeholder="Nome fantasia da sua boutique"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-sm text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="whatsapp" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  WhatsApp com DDD *
                </label>
                <input
                  type="tel"
                  id="whatsapp"
                  name="whatsapp"
                  required
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-sm text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  E-mail comercial *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contato@sualoja.com.br"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-sm text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cnpj" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  CNPJ *
                </label>
                <input
                  type="text"
                  id="cnpj"
                  name="cnpj"
                  required
                  value={formData.cnpj}
                  onChange={handleChange}
                  placeholder="00.000.000/0000-00"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-sm text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
                />
              </div>

              <div>
                <label htmlFor="cidadeEstado" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Cidade / Estado *
                </label>
                <input
                  type="text"
                  id="cidadeEstado"
                  name="cidadeEstado"
                  required
                  value={formData.cidadeEstado}
                  onChange={handleChange}
                  placeholder="Ex: Belo Horizonte / MG"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-sm text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="marcasVendidas" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Principais marcas vendidas na loja *
              </label>
              <input
                type="text"
                id="marcasVendidas"
                name="marcasVendidas"
                required
                value={formData.marcasVendidas}
                onChange={handleChange}
                placeholder="Cite 2 ou 3 marcas presentes no seu mix atual"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-sm text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="instagramLoja" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Instagram da loja *
                </label>
                <input
                  type="text"
                  id="instagramLoja"
                  name="instagramLoja"
                  required
                  value={formData.instagramLoja}
                  onChange={handleChange}
                  placeholder="@sualoja"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-sm text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
                />
              </div>

              <div>
                <label htmlFor="comoConheceu" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Como conheceu a Frysaide? *
                </label>
                <select
                  id="comoConheceu"
                  name="comoConheceu"
                  required
                  value={formData.comoConheceu}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-sm text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
                >
                  <option value="">Selecione uma opção</option>
                  <option value="Instagram / Redes sociais">Instagram / Redes sociais</option>
                  <option value="Indicação de outro lojista">Indicação de outro lojista</option>
                  <option value="Representante comercial">Representante comercial</option>
                  <option value="Feiras de moda / Showroom">Feiras de moda / Showroom</option>
                  <option value="Busca na internet">Busca na internet</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                id="submit-form-btn"
                className="w-full bg-stone-900 hover:bg-stone-800 text-stone-50 text-base font-medium py-3.5 px-6 rounded-sm transition-colors duration-200 cursor-pointer"
              >
                Solicitar atendimento comercial
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};
