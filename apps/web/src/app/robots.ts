import type { MetadataRoute } from "next";

// /login, /clinicas e /contabilidade ficam fora do Google pelo "noindex" de cada página.
// Por isso não entram aqui: se o robô for bloqueado, ele nem chega a ler o noindex.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/api"] },
    sitemap: "https://www.symetra.com.br/sitemap.xml",
  };
}
