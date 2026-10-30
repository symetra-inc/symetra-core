import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { POSTS, WA_URL, formatDate, getPost } from "../posts";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = `https://www.symetra.com.br/blog/${post.slug}`;
  return {
    title: `${post.title} | Symetra`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: { type: "article", url, title: post.title, description: post.description, locale: "pt_BR", siteName: "Symetra", publishedTime: post.date },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Person", name: "Guilherme Guedes" },
    publisher: { "@type": "Organization", name: "Symetra", url: "https://www.symetra.com.br/" },
    mainEntityOfPage: `https://www.symetra.com.br/blog/${post.slug}`,
  };

  return (
    <main className="wrap narrow post" style={{ paddingTop: 56 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/blog" className="blog-meta" style={{ textDecoration: "none" }}>← Todos os artigos</Link>
      <h1 className="serif">{post.title}</h1>
      <p className="lede">{post.description}</p>
      <p className="blog-meta" style={{ marginTop: 20 }}>
        Guilherme Guedes · {formatDate(post.date)} · {post.minutes} min de leitura
      </p>

      <article className="post-body">
        {post.body.map((block, i) => {
          if (block.type === "h2") return <h2 key={i} className="serif">{block.text}</h2>;
          if (block.type === "ul")
            return <ul key={i}>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
          return <p key={i}>{block.text}</p>;
        })}
      </article>

      <aside className="post-cta">
        <h2 className="serif">Quer saber quanto isso custa na sua empresa?</h2>
        <p>Em 30 minutos eu aponto o que dá para automatizar e quanto vale cada item por mês. Grátis e sem compromisso.</p>
        <a href={WA_URL}>Agendar diagnóstico grátis</a>
      </aside>
    </main>
  );
}
