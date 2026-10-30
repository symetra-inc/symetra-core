import type { Metadata } from 'next'

// Arquivada: landing antiga do produto para clínicas. Fora do Google e sem link na home.
export const metadata: Metadata = {
  title: 'Symetra · Clínicas',
  robots: { index: false, follow: false },
}

export default function ClinicasLayout({ children }: { children: React.ReactNode }) {
  return children
}
