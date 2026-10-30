import type { Metadata } from 'next'

// Arquivada: landing antiga de teste. Fora do Google e sem link na home.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function ContabilidadeLayout({ children }: { children: React.ReactNode }) {
  return children
}
