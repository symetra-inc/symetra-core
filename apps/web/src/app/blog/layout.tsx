import "./blog.css";
import Link from "next/link";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import { WA_URL } from "./posts";

const newsreader = Newsreader({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-newsreader" });
const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`blog ${newsreader.variable} ${plex.variable} ${plexMono.variable}`}>
      <header className="blog-top">
        <div className="wrap">
          <Link href="/" className="blog-logo serif">
            Symetra<i aria-hidden="true" />
          </Link>
          <a href={WA_URL} className="blog-btn">Falar comigo</a>
        </div>
      </header>
      {children}
      <footer className="blog-foot">
        <div className="wrap">
          <span>Symetra · CNPJ 50.931.481/0001-27 · São Paulo, SP</span>
          <span>
            <Link href="/">Início</Link> · <Link href="/blog">Blog</Link> ·{" "}
            <a href="mailto:contato@symetra.com.br">contato@symetra.com.br</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
