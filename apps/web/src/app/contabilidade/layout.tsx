import type { Metadata } from 'next'

// Landing antiga da Symetra para contabilidades. Fica fora do índice e sem link na home.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function ContabilidadeLayout({ children }: { children: React.ReactNode }) {
  return children
}
