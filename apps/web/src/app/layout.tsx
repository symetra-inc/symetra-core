import "./globals.css";

import { Fraunces, Instrument_Sans, JetBrains_Mono } from 'next/font/google'

const fraunces   = Fraunces({ subsets: ['latin'], weight: ['300','700'], style: ['normal','italic'], variable: '--font-fraunces' })
const instrument = Instrument_Sans({ subsets: ['latin'], weight: ['400','500','600'], variable: '--font-instrument' })
const jetbrains  = JetBrains_Mono({ subsets: ['latin'], weight: ['400','500'], variable: '--font-jetbrains' })


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${instrument.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
