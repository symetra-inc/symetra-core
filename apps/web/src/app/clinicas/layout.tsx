import type { Metadata } from 'next'

// Landing antiga da Symetra para clínicas. Fica fora do índice e sem link na home.
export const metadata: Metadata = {
  title: 'Symetra · Clínicas',
  robots: { index: false, follow: false },
}

export default function ClinicasLayout({ children }: { children: React.ReactNode }) {
  return children
}
