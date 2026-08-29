export interface CatalogItem {
  procedimento: string;
  preco: number;
  precoTipo: 'fixo' | 'a_partir';
  durationMinutes: number;
}
