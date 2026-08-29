/**
 * Formata um valor enquanto o usuário digita num campo de preço (BRL).
 * Remove separadores de milhar existentes, mantém vírgula decimal e re-aplica
 * a formatação com pontos como separador de milhar.
 *
 * Exemplos:
 *   "20000"  → "20.000"
 *   "1500"   → "1.500"
 *   "299,90" → "299,90"
 *   "20.000" → "20.000" (idempotente)
 */
export function formatCurrencyInput(value: string): string {
  // Remove separadores de milhar existentes (pontos) para não confundir com decimal
  const withoutDots = value.replace(/\./g, "");
  // Mantém apenas dígitos e vírgula
  const sanitized = withoutDots.replace(/[^\d,]/g, "");

  if (!sanitized) return "";

  const commaIndex = sanitized.indexOf(",");
  const hasComma = commaIndex !== -1;

  const intPart = hasComma ? sanitized.slice(0, commaIndex) : sanitized;
  const decPart = hasComma ? sanitized.slice(commaIndex + 1, commaIndex + 3) : null;

  const intNum = parseInt(intPart || "0", 10);
  const intFormatted = isNaN(intNum)
    ? ""
    : new Intl.NumberFormat("pt-BR").format(intNum);

  return hasComma ? `${intFormatted},${decPart ?? ""}` : intFormatted;
}

/**
 * Converte uma string de preço formatada no padrão brasileiro (ex: "20.000" ou "1.500,50")
 * para o número puro correspondente (20000 ou 1500.5).
 */
export function parseCurrencyInput(value: string): number {
  if (!value) return 0;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

/**
 * Converte um número para string de exibição no formato brasileiro sem símbolo de moeda.
 * Usado para exibir valores numéricos do estado em campos de texto mascarados.
 *
 * Exemplos: 20000 → "20.000", 1500.5 → "1.500,5"
 */
export function displayCurrencyValue(num: number): string {
  if (!num) return "";
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(num);
}

/**
 * Aplica máscara de telefone brasileiro enquanto o usuário digita.
 * Suporta celular (11 dígitos) e fixo (10 dígitos).
 *
 * Exemplos:
 *   "11999999999" → "(11) 99999-9999"
 *   "1133334444"  → "(11) 3333-4444"
 */
export function formatPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Remove a máscara de telefone, retornando apenas dígitos.
 * É o valor a ser enviado para a API / banco.
 *
 * Exemplo: "(11) 99999-9999" → "11999999999"
 */
export function unformatPhone(value: string): string {
  return value.replace(/\D/g, "");
}
