export const CNPJ_ERROR = 'CNPJ inválido. Confira os números digitados.';

export const cnpjDigits = (value: string) => value.replace(/\D/g, '');

export function formatCnpj(value: string): string {
  return cnpjDigits(value).slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function isValidCnpj(value: string): boolean {
  const digits = cnpjDigits(value);
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false;
  const checkDigit = (base: string, weights: number[]) => {
    const remainder = [...base].reduce((sum, digit, i) => sum + Number(digit) * weights[i], 0) % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const first = checkDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = checkDigit(digits.slice(0, 12) + first, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return digits.endsWith(`${first}${second}`);
}
