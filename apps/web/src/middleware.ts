import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth; // Retorna true se o usuário tiver o cookie válido
  
  const { pathname } = req.nextUrl;
  
  // Rotas que o Auth.js precisa para funcionar nos bastidores (nunca bloquear)
  const isApiAuthRoute = pathname.startsWith("/api/auth");
  // A porta de entrada
  const isAuthRoute = pathname === "/login";
  // A sala forte (qualquer coisa dentro de /dashboard)
  const isProtectedRoute = pathname.startsWith("/dashboard");

  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Se o cara já está logado e tenta acessar /login, joga ele pro painel
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    return NextResponse.next();
  }

  // A TRAVA MESTRA: Tenta acessar o painel sem estar logado? Chuta pro /login.
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Se for qualquer outra página (tipo a Landing Page raiz "/"), deixa passar livre
  return NextResponse.next();
});

// Essa configuração diz ao Next.js para NÃO rodar esse middleware em arquivos estáticos (imagens, CSS, etc) para economizar processamento
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};