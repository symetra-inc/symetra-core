/**
 * Normaliza um CPF para conter apenas dígitos.
 */
export function normalizeCpf(cpf: string): string {
  return (cpf ?? '').replace(/\D/g, '');
}

/**
 * Valida um CPF pelos dígitos verificadores (algoritmo oficial da Receita Federal).
 * Aceita CPF formatado ou não — normaliza internamente.
 */
export function isValidCpf(cpf: string): boolean {
  const digits = normalizeCpf(cpf);

  if (digits.length !== 11) return false;
  // Rejeita sequências de dígitos repetidos (ex: 111.111.111-11), que passam
  // no cálculo do dígito verificador mas nunca são CPFs reais.
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calcCheckDigit = (base: string): number => {
    let sum = 0;
    let weight = base.length + 1;
    for (const char of base) {
      sum += Number(char) * weight;
      weight -= 1;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstNine = digits.slice(0, 9);
  const digit1 = calcCheckDigit(firstNine);
  const digit2 = calcCheckDigit(firstNine + digit1);

  return digits === firstNine + String(digit1) + String(digit2);
}
