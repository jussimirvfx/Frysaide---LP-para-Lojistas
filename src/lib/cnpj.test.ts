import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CNPJ_ERROR, cnpjDigits, formatCnpj, isValidCnpj } from './cnpj';
import { sendLead } from './sendLead';
import type { LeadFormData } from '../types';

const data: LeadFormData = {
  nome: 'Teste', nomeLoja: 'Loja de teste', whatsapp: '11999999999', email: 'teste@example.test',
  cidade: 'São Paulo', estado: 'SP', cnpj: '60887522000189', instagramLoja: '@teste',
  marcasVendidas: 'Teste', tipoLoja: 'Multimarcas / Boutique', lojaFisica: 'Sim', tempoCnpj: '1 a 3 anos'
};

test('accepts the valid checksum, raw or masked', () => {
  assert.equal(isValidCnpj('60887522000189'), true);
  assert.equal(isValidCnpj('60.887.522/0001-89'), true);
});

test('rejects altered check digits, repeated digits, incomplete and oversized values', () => {
  for (const value of ['60887522000188', '60887522000179', '', '608875220001', '608875220001899', ...Array.from({ length: 10 }, (_, i) => String(i).repeat(14))]) {
    assert.equal(isValidCnpj(value), false, value);
  }
});

test('strips non-numeric characters, limits to 14 digits, and masks partial input', () => {
  assert.equal(formatCnpj('abc60.887.522/0001-89xyz1234'), '60.887.522/0001-89');
  for (let i = 0; i <= 14; i++) {
    const input = '60887522000189'.slice(0, i);
    assert.equal(cnpjDigits(formatCnpj(input)), input);
  }
  assert.equal(formatCnpj('608875220001'), '60.887.522/0001');
});

test('invalid or incomplete CNPJ never calls the webhook', async () => {
  let calls = 0;
  const request: typeof fetch = async () => { calls++; throw new Error('Unexpected network call'); };
  for (const cnpj of ['60887522000188', '00000000000000', '608875220001', '']) {
    await assert.rejects(sendLead({ ...data, cnpj }, 'https://webhook.example.test', request), { message: CNPJ_ERROR });
  }
  assert.equal(calls, 0);
});

test('valid CNPJ sends its mask and checksum status while preserving other lead fields', async () => {
  let calls = 0;
  const request: typeof fetch = async (url, init) => {
    calls++;
    assert.equal(url, 'https://webhook.example.test');
    assert.equal(init?.method, 'POST');
    assert.deepEqual(JSON.parse(String(init?.body)), { ...data, cnpj: '60.887.522/0001-89', cnpj_validation_status: 'checksum_valid' });
    return new Response(null, { status: 200 });
  };
  await sendLead(data, 'https://webhook.example.test', request);
  assert.equal(calls, 1);
});

test('preserves failed-webhook behavior', async () => {
  const request: typeof fetch = async () => new Response(null, { status: 500 });
  await assert.rejects(sendLead(data, 'https://webhook.example.test', request), { message: 'Submission failed' });
});
