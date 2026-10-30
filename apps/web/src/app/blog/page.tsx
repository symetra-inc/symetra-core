import type { Metadata } from "next";
import Link from "next/link";
import { POSTS, formatDate } from "./posts";

export const metadata: Metadata = {
  title: "Blog | Symetra",
  description: "Artigos práticos sobre automação, integrações e atendimento no WhatsApp para pequenas e médias empresas.",
  alternates: { canonical: "https://www.symetra.com.br/blog" },
};

export default function BlogIndex() {
  return (
    <main className="wrap narrow" style={{ paddingTop: 72 }}>
      <h1 className="serif" style={{ fontSize: "clamp(38px,5vw,56px)", margin: 0 }}>Blog</h1>
      <p style={{ marginTop: 16, fontSize: 19, color: "var(--body)" }}>
        Como tirar trabalho repetitivo da sua equipe, explicado sem tecniquês.
      </p>
      <ul className="blog-list">
        {POSTS.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`}>
              <p className="blog-meta">{formatDate(post.date)} · {post.minutes} min de leitura</p>
              <h2 className="serif" style={{ marginTop: 8 }}>{post.title}</h2>
              <p>{post.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
